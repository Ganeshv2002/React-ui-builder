import { pgTable, uuid, text, timestamp, uniqueIndex, index, integer, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
const date = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(), avatar: text('avatar'),
  emailVerifiedAt: date('email_verified_at'), createdAt: date('created_at').notNull(), updatedAt: date('updated_at').notNull(),
});
export const identities = pgTable('identities', {
  id: uuid('id').primaryKey(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').$type<'local' | 'google'>().notNull(), providerUserId: text('provider_user_id').notNull(), passwordHash: text('password_hash'), createdAt: date('created_at').notNull(),
}, t => [uniqueIndex('identity_provider_subject').on(t.provider, t.providerUserId), uniqueIndex('identity_user_provider').on(t.userId, t.provider),
  check('identity_hash_kind', sql`(${t.provider} = 'local' AND ${t.passwordHash} IS NOT NULL) OR (${t.provider} = 'google' AND ${t.passwordHash} IS NULL)`)]);
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessHash: text('access_hash').notNull().unique(), accessExpiresAt: date('access_expires_at').notNull(), expiresAt: date('expires_at').notNull(),
  revokedAt: date('revoked_at'), authenticatedAt: date('authenticated_at').notNull(), createdAt: date('created_at').notNull(), lastSeenAt: date('last_seen_at').notNull(), device: text('device').notNull(),
}, t => [index('session_user').on(t.userId), index('session_expiry').on(t.expiresAt)]);
export const refreshTokens = pgTable('refresh_tokens', {
  hash: text('hash').primaryKey(), sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  expiresAt: date('expires_at').notNull(), consumedAt: date('consumed_at'),
}, t => [index('refresh_session').on(t.sessionId)]);
export const accountTokens = pgTable('account_tokens', {
  hash: text('hash').primaryKey(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  purpose: text('purpose').$type<'verify' | 'reset'>().notNull(), expiresAt: date('expires_at').notNull(), consumedAt: date('consumed_at'),
}, t => [index('account_token_user').on(t.userId)]);
export const oauthTransactions = pgTable('oauth_transactions', {
  stateHash: text('state_hash').primaryKey(), nonce: text('nonce').notNull(), verifier: text('verifier').notNull(),
  bindingHash: text('binding_hash').notNull(), expiresAt: date('expires_at').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
});
export const rateLimits = pgTable('rate_limits', { key: text('key').primaryKey(), count: integer('count').notNull(), expiresAt: date('expires_at').notNull() });
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
