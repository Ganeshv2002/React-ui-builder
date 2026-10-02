import { randomUUID } from 'node:crypto';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import type { Database } from '../../db/connection.js';
import { identities, refreshTokens, sessions, users, type Session } from '../../db/schema.js';
import { digest, randomToken } from '../../shared/crypto.js';
import { AppError, unauthorized } from '../../shared/errors.js';

export const ACCESS_SECONDS = 600;
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const publicUser = (user: typeof users.$inferSelect) => ({ id: user.id, name: user.name, email: user.email, avatar: user.avatar, emailVerified: Boolean(user.emailVerifiedAt), createdAt: user.createdAt });
export class SessionService {
  constructor(private db: Database, private now: () => Date = () => new Date()) {}
  async create(userId: string, device: string, expectedPasswordHash?: string) {
    const access = randomToken(), refresh = randomToken(), now = this.now();
    const session = { id: randomUUID(), userId, device: device.slice(0, 300), accessHash: digest(access), accessExpiresAt: new Date(+now + ACCESS_SECONDS * 1000),
      expiresAt: new Date(+now + SESSION_SECONDS * 1000), authenticatedAt: now, createdAt: now, lastSeenAt: now };
    await this.db.transaction(async tx => {
      await tx.select().from(users).where(eq(users.id, userId)).for('update');
      if (expectedPasswordHash) {
        const [identity] = await tx.select().from(identities).where(and(eq(identities.userId, userId), eq(identities.provider, 'local')));
        if (identity?.passwordHash !== expectedPasswordHash) throw unauthorized();
      }
      await tx.insert(sessions).values(session);
      await tx.insert(refreshTokens).values({ hash: digest(refresh), sessionId: session.id, expiresAt: session.expiresAt });
    });
    return { access, refresh, expiresAt: session.expiresAt, sessionId: session.id };
  }
  async authenticate(access?: string) {
    if (!access || access.length > 128) throw unauthorized();
    const [record] = await this.db.select({ session: sessions, user: users }).from(sessions).innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.accessHash, digest(access)), isNull(sessions.revokedAt), gt(sessions.accessExpiresAt, this.now()), gt(sessions.expiresAt, this.now())));
    if (!record) throw unauthorized();
    return record;
  }
  async rotate(refresh?: string) {
    if (!refresh || refresh.length > 128) throw unauthorized();
    const hash = digest(refresh), now = this.now();
    const result = await this.db.transaction(async tx => {
      const [token] = await tx.select().from(refreshTokens).where(eq(refreshTokens.hash, hash));
      if (!token) throw unauthorized();
      const [session] = await tx.select().from(sessions).where(eq(sessions.id, token.sessionId)).for('update');
      if (!session || session.revokedAt || +session.expiresAt <= +now || +token.expiresAt <= +now) throw unauthorized();
      const [consumed] = await tx.update(refreshTokens).set({ consumedAt: now }).where(and(eq(refreshTokens.hash, hash), isNull(refreshTokens.consumedAt))).returning();
      if (!consumed) {
        await tx.update(sessions).set({ revokedAt: now }).where(eq(sessions.id, session.id));
        return null; // Commit revocation before returning an authentication error.
      }
      const access = randomToken(), nextRefresh = randomToken();
      await tx.update(sessions).set({ accessHash: digest(access), accessExpiresAt: new Date(+now + ACCESS_SECONDS * 1000), lastSeenAt: now }).where(eq(sessions.id, session.id));
      await tx.insert(refreshTokens).values({ hash: digest(nextRefresh), sessionId: session.id, expiresAt: session.expiresAt });
      return { access, refresh: nextRefresh, expiresAt: session.expiresAt, sessionId: session.id };
    });
    if (!result) throw new AppError(401, 'SESSION_REVOKED', 'This session expired. Please sign in again.');
    return result;
  }
  async logout(access?: string, refresh?: string) {
    if (access) await this.db.update(sessions).set({ revokedAt: this.now() }).where(eq(sessions.accessHash, digest(access)));
    if (refresh) {
      const [token] = await this.db.select().from(refreshTokens).where(eq(refreshTokens.hash, digest(refresh)));
      if (token) await this.db.update(sessions).set({ revokedAt: this.now() }).where(eq(sessions.id, token.sessionId));
    }
  }
  async list(userId: string, currentId: string) {
    const rows = await this.db.select({ id: sessions.id, device: sessions.device, createdAt: sessions.createdAt, lastSeenAt: sessions.lastSeenAt, expiresAt: sessions.expiresAt }).from(sessions)
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, this.now()))).orderBy(sql`${sessions.lastSeenAt} DESC`);
    return rows.map(row => ({ ...row, current: row.id === currentId }));
  }
  async revoke(userId: string, sessionId: string) {
    const rows = await this.db.update(sessions).set({ revokedAt: this.now() }).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId))).returning({ id: sessions.id });
    if (!rows.length) throw new AppError(404, 'NOT_FOUND', 'Session not found.');
  }
  async revokeOthers(userId: string, currentId: string) {
    await this.db.update(sessions).set({ revokedAt: this.now() }).where(and(eq(sessions.userId, userId), sql`${sessions.id} <> ${currentId}`));
  }
  requireRecent(session: Session) {
    if (+this.now() - +session.authenticatedAt > 10 * 60 * 1000) throw new AppError(403, 'REAUTHENTICATE', 'Sign out and sign in again before linking an identity.');
  }
}
