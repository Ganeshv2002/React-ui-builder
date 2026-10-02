import { randomUUID } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Database } from '../../db/connection.js';
import { accountTokens, identities, oauthTransactions, sessions, users, type User, type Session } from '../../db/schema.js';
import { digest, randomToken } from '../../shared/crypto.js';
import { AppError, unauthorized } from '../../shared/errors.js';
import type { Mailer } from '../../shared/mail.js';
import { dummyHash, hashPassword, verifyPassword } from './passwords.js';
import { SessionService, publicUser } from './sessions.js';
import type { GoogleOidc } from './oauth.js';

export class AuthService {
  constructor(private db: Database, public session: SessionService, private mailer: Mailer, private google: GoogleOidc,
    private origin: string, private now: () => Date = () => new Date(), private mailFailure: () => void = () => {}) {}
  async register(name: string, email: string, password: string) {
    const passwordHash = await hashPassword(password), now = this.now();
    const user = await this.db.transaction(async tx => {
      const [created] = await tx.insert(users).values({ id: randomUUID(), name, email, createdAt: now, updatedAt: now }).onConflictDoNothing().returning();
      if (!created) return null;
      await tx.insert(identities).values({ id: randomUUID(), userId: created.id, provider: 'local', providerUserId: email, passwordHash, createdAt: now });
      return created;
    });
    if (user) await this.sendAccountMail(user, 'verify');
    // Do not reveal whether this email already has an account.
  }
  async login(email: string, password: string, device: string) {
    const [row] = await this.db.select({ user: users, identity: identities }).from(users).innerJoin(identities, eq(identities.userId, users.id))
      .where(and(eq(users.email, email), eq(identities.provider, 'local')));
    const valid = await verifyPassword(row?.identity.passwordHash || await dummyHash, password);
    if (!row || !valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    return { user: publicUser(row.user), tokens: await this.session.create(row.user.id, device, row.identity.passwordHash!) };
  }
  async sendAccountMail(user: User, purpose: 'verify' | 'reset') {
    const token = randomToken(), expiresAt = new Date(+this.now() + (purpose === 'verify' ? 24 * 60 : 30) * 60000);
    await this.db.insert(accountTokens).values({ hash: digest(token), userId: user.id, purpose, expiresAt });
    try { await this.mailer.send({ to: user.email, purpose, url: `${this.origin}/#/${purpose === 'verify' ? 'verify-email' : 'reset-password'}?token=${token}` }); }
    catch { this.mailFailure(); } // No links, email addresses or tokens in logs; resend remains available.
  }
  async forgotPassword(email: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    if (user) await this.sendAccountMail(user, 'reset');
  }
  async verifyEmail(token: string) {
    await this.db.transaction(async tx => {
      const [record] = await tx.update(accountTokens).set({ consumedAt: this.now() }).where(and(eq(accountTokens.hash, digest(token)), eq(accountTokens.purpose, 'verify'), isNull(accountTokens.consumedAt), gt(accountTokens.expiresAt, this.now()))).returning();
      if (!record) throw new AppError(400, 'INVALID_TOKEN', 'This link has expired or has already been used.');
      await tx.update(users).set({ emailVerifiedAt: this.now(), updatedAt: this.now() }).where(eq(users.id, record.userId));
    });
  }
  async resetPassword(token: string, password: string) {
    const passwordHash = await hashPassword(password);
    await this.db.transaction(async tx => {
      const [record] = await tx.select().from(accountTokens).where(and(eq(accountTokens.hash, digest(token)), eq(accountTokens.purpose, 'reset'), isNull(accountTokens.consumedAt), gt(accountTokens.expiresAt, this.now())));
      if (!record) throw new AppError(400, 'INVALID_TOKEN', 'This link has expired or has already been used.');
      const [user] = await tx.select().from(users).where(eq(users.id, record.userId)).for('update');
      if (!user) throw unauthorized();
      const [consumed] = await tx.update(accountTokens).set({ consumedAt: this.now() }).where(and(eq(accountTokens.hash, record.hash), isNull(accountTokens.consumedAt))).returning();
      if (!consumed) throw new AppError(400, 'INVALID_TOKEN', 'This link has already been used.');
      await tx.insert(identities).values({ id: randomUUID(), userId: user.id, provider: 'local', providerUserId: user.email, passwordHash, createdAt: this.now() })
        .onConflictDoUpdate({ target: [identities.userId, identities.provider], set: { passwordHash } });
      await tx.update(users).set({ emailVerifiedAt: this.now(), updatedAt: this.now() }).where(eq(users.id, user.id));
      await tx.update(accountTokens).set({ consumedAt: this.now() }).where(and(eq(accountTokens.userId, user.id), eq(accountTokens.purpose, 'reset')));
      await tx.update(sessions).set({ revokedAt: this.now() }).where(eq(sessions.userId, user.id));
    });
  }
  async changePassword(userId: string, current: string, next: string) {
    const [identity] = await this.db.select().from(identities).where(and(eq(identities.userId, userId), eq(identities.provider, 'local')));
    if (!identity?.passwordHash || !await verifyPassword(identity.passwordHash, current)) throw new AppError(400, 'INVALID_PASSWORD', 'Current password is incorrect.');
    const passwordHash = await hashPassword(next);
    await this.db.transaction(async tx => {
      await tx.select().from(users).where(eq(users.id, userId)).for('update');
      const changed = await tx.update(identities).set({ passwordHash }).where(and(eq(identities.id, identity.id), eq(identities.passwordHash, identity.passwordHash!))).returning();
      if (!changed.length) throw unauthorized();
      await tx.update(sessions).set({ revokedAt: this.now() }).where(eq(sessions.userId, userId));
      await tx.update(accountTokens).set({ consumedAt: this.now() }).where(and(eq(accountTokens.userId, userId), eq(accountTokens.purpose, 'reset')));
    });
  }
  async updateProfile(userId: string, data: { name: string; avatar: string | null }) {
    const [user] = await this.db.update(users).set({ ...data, updatedAt: this.now() }).where(eq(users.id, userId)).returning();
    if (!user) throw unauthorized();
    return publicUser(user);
  }
  async getIdentities(userId: string) {
    return this.db.select({ provider: identities.provider, createdAt: identities.createdAt }).from(identities).where(eq(identities.userId, userId));
  }
  async startGoogle(link?: { user: User; session: Session }) {
    if (link) this.session.requireRecent(link.session);
    const transaction = { state: randomToken(), nonce: randomToken(), verifier: randomToken() };
    const binding = randomToken();
    const url = await this.google.authorizationUrl(transaction);
    await this.db.insert(oauthTransactions).values({ stateHash: digest(transaction.state), nonce: transaction.nonce, verifier: transaction.verifier,
      bindingHash: digest(binding), expiresAt: new Date(+this.now() + 10 * 60000), userId: link?.user.id, sessionId: link?.session.id });
    return { url, binding };
  }
  async finishGoogle(callback: URL, binding: string | undefined, device: string) {
    const state = callback.searchParams.get('state');
    if (!state || !binding || state.length > 128 || binding.length > 128) throw new AppError(400, 'OAUTH_STATE', 'Google sign-in could not be verified. Start again.');
    const [transaction] = await this.db.delete(oauthTransactions).where(and(eq(oauthTransactions.stateHash, digest(state)), eq(oauthTransactions.bindingHash, digest(binding)), gt(oauthTransactions.expiresAt, this.now()))).returning();
    if (!transaction) throw new AppError(400, 'OAUTH_STATE', 'Google sign-in has expired or was already used.');
    const profile = await this.google.exchange(callback, { state, nonce: transaction.nonce, verifier: transaction.verifier });
    const user = await this.db.transaction(async tx => {
      const [identity] = await tx.select().from(identities).where(and(eq(identities.provider, 'google'), eq(identities.providerUserId, profile.sub)));
      if (transaction.userId) {
        const [session] = await tx.select().from(sessions).where(and(eq(sessions.id, transaction.sessionId!), eq(sessions.userId, transaction.userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, this.now()))).for('update');
        if (!session) throw unauthorized();
        this.session.requireRecent(session);
        if (identity && identity.userId !== transaction.userId) throw new AppError(409, 'IDENTITY_IN_USE', 'This Google identity is already connected to another account.');
        const [owner] = await tx.select().from(users).where(eq(users.id, transaction.userId)).for('update');
        if (!owner || !owner.emailVerifiedAt) throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before connecting Google.');
        if (!identity) await tx.insert(identities).values({ id: randomUUID(), userId: owner.id, provider: 'google', providerUserId: profile.sub, createdAt: this.now() });
        return owner;
      }
      if (identity) {
        const [owner] = await tx.select().from(users).where(eq(users.id, identity.userId));
        if (!owner) throw unauthorized();
        return owner;
      }
      const [existing] = await tx.select().from(users).where(eq(users.email, profile.email));
      if (existing) throw new AppError(409, 'LINK_REQUIRED', 'Sign in to your existing account, then connect Google in Account settings.');
      const [created] = await tx.insert(users).values({ id: randomUUID(), email: profile.email, name: profile.name, avatar: profile.picture, emailVerifiedAt: this.now(), createdAt: this.now(), updatedAt: this.now() }).onConflictDoNothing().returning();
      if (!created) throw new AppError(409, 'LINK_REQUIRED', 'Sign in to your existing account and connect Google.');
      await tx.insert(identities).values({ id: randomUUID(), userId: created.id, provider: 'google', providerUserId: profile.sub, createdAt: this.now() });
      return created;
    });
    return { user: publicUser(user), tokens: await this.session.create(user.id, device), linked: Boolean(transaction.userId) };
  }
}
