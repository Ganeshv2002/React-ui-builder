import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { connectDatabase } from '../src/db/connection.js';
import { identities, users } from '../src/db/schema.js';
import type { AccountMail } from '../src/shared/mail.js';
import { digest } from '../src/shared/crypto.js';
import type { GoogleProfile, OidcTransaction } from '../src/modules/auth/oauth.js';
import { verifyPassword } from '../src/modules/auth/passwords.js';

const config = loadConfig({ NODE_ENV: 'test' });
const password = 'a strong test passphrase';
let db: Awaited<ReturnType<typeof connectDatabase>>, app: FastifyInstance;
let now = new Date(), mail: AccountMail[] = [], googleProfile: GoogleProfile;
let lastOidc: OidcTransaction | undefined;
const headers = { origin: config.APP_ORIGIN, 'x-framewright-csrf': '1', 'user-agent': 'Integration test browser' };
const request = (path: string, payload: Record<string, unknown> = {}, cookie = '', method: 'POST' | 'PATCH' | 'DELETE' = 'POST') => app.inject({ method, url: `/api/v1${path}`, payload, headers: { ...headers, cookie } });
const cookies = (response: Awaited<ReturnType<typeof request>>) => response.cookies.map(c => `${c.name}=${c.value}`).join('; ');
async function register(email = 'alice@example.test') { return request('/auth/register', { email, password, name: 'Alice' }); }
async function login(email = 'alice@example.test') { return request('/auth/login', { email, password }); }
async function account(cookie: string) { return app.inject({ url: '/api/v1/account', headers: { cookie } }); }
const mailToken = (purpose: 'verify' | 'reset') => new URLSearchParams(mail.filter(m => m.purpose === purpose).at(-1)!.url.split('?')[1]).get('token')!;

beforeAll(async () => {
  db = await connectDatabase('pglite://'); await db.migrate(); await db.migrate();
  app = await buildApp(config, { db: db.db, now: () => now, mailer: { async send(message) { mail.push(message); } }, google: {
    enabled: true,
    async authorizationUrl(t) { lastOidc = t; return `https://accounts.google.com/o/oauth2/v2/auth?state=${t.state}`; },
    async exchange(_url, t) { expect(t).toEqual(lastOidc); return googleProfile; },
  } });
});
beforeEach(async () => {
  await db.db.execute(sql`TRUNCATE users, rate_limits CASCADE`);
  now = new Date(); mail = []; googleProfile = { sub: 'google-subject', email: 'google@example.test', name: 'Google user' };
});
afterAll(async () => { await app?.close(); await db?.close(); });

describe('real SQL authentication API', () => {
  it('hashes passwords and issues HttpOnly cookies without leaking tokens into JSON', async () => {
    expect((await register()).statusCode).toBe(202);
    const [identity] = await db.db.select().from(identities);
    expect(identity!.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(identity!.passwordHash!, password)).toBe(true);
    const signedIn = await login(); expect(signedIn.statusCode).toBe(200);
    expect(signedIn.json().data.user.email).toBe('alice@example.test');
    expect(Object.keys(signedIn.json().data)).toEqual(['user']);
    expect(signedIn.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('HttpOnly'), expect.stringContaining('SameSite=Lax')]));
    expect((await account(cookies(signedIn))).statusCode).toBe(200);
    const raw = await db.db.execute(sql`SELECT access_hash FROM sessions`);
    expect(raw.rows[0]!.access_hash).toBe(digest(signedIn.cookies.find(c => c.name === 'fw_access')!.value));
  });
  it('rejects unauthenticated requests, malformed input, CSRF and incorrect credentials', async () => {
    expect((await account('')).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'a@test.dev', password }, headers: { origin: 'https://evil.test' } })).statusCode).toBe(403);
    expect((await request('/auth/register', { email: 'invalid', name: 'A', password: 'tiny' })).statusCode).toBe(400);
    await register();
    const wrong = await request('/auth/login', { email: 'alice@example.test', password: 'bad' });
    const unknown = await request('/auth/login', { email: 'unknown@example.test', password: 'bad' });
    expect(wrong.json().error).toEqual(unknown.json().error);
    expect(wrong.statusCode).toBe(401);
  });
  it('rotates refresh tokens after access expiry and revokes the family on replay', async () => {
    await register(); const first = await login();
    now = new Date(+now + 11 * 60000);
    expect((await account(cookies(first))).statusCode).toBe(401);
    const refreshed = await request('/auth/refresh', {}, cookies(first)); expect(refreshed.statusCode).toBe(200);
    expect((await account(cookies(refreshed))).statusCode).toBe(200);
    expect((await request('/auth/refresh', {}, cookies(first))).statusCode).toBe(401);
    expect((await account(cookies(refreshed))).statusCode).toBe(401);
  });
  it('allows at most one concurrent rotation and never extends absolute expiry', async () => {
    await register(); const first = await login();
    const attempts = await Promise.all([request('/auth/refresh', {}, cookies(first)), request('/auth/refresh', {}, cookies(first))]);
    expect(attempts.map(r => r.statusCode).sort()).toEqual([200, 401]);
    const next = await login(); now = new Date(+now + 31 * 86400000);
    expect((await request('/auth/refresh', {}, cookies(next))).statusCode).toBe(401);
  });
  it('logout invalidates both tokens and returns expired cookies', async () => {
    await register(); const signedIn = await login();
    const out = await request('/auth/logout', {}, cookies(signedIn)); expect(out.statusCode).toBe(200);
    expect(out.cookies.every(c => c.value === '')).toBe(true);
    expect((await account(cookies(signedIn))).statusCode).toBe(401);
    expect((await request('/auth/refresh', {}, cookies(signedIn))).statusCode).toBe(401);
  });
  it('uses one-time email verification and reset tokens, resetting all sessions', async () => {
    await register(); const verify = mailToken('verify');
    expect((await request('/auth/verify-email', { token: verify })).statusCode).toBe(200);
    expect((await request('/auth/verify-email', { token: verify })).statusCode).toBe(400);
    const signedIn = await login(); expect(signedIn.json().data.user.emailVerified).toBe(true);
    const known = await request('/auth/forgot-password', { email: 'alice@example.test' });
    const unknown = await request('/auth/forgot-password', { email: 'nobody@example.test' });
    expect(known.json()).toEqual(unknown.json());
    const token = mailToken('reset');
    expect((await request('/auth/reset-password', { token, password: 'a different secure passphrase' })).statusCode).toBe(200);
    expect((await request('/auth/reset-password', { token, password })).statusCode).toBe(400);
    expect((await account(cookies(signedIn))).statusCode).toBe(401);
    expect((await login()).statusCode).toBe(401);
    expect((await request('/auth/login', { email: 'alice@example.test', password: 'a different secure passphrase' })).statusCode).toBe(200);
  });
  it('rejects expired reset links and limits brute-force attempts', async () => {
    await register(); await request('/auth/forgot-password', { email: 'alice@example.test' });
    now = new Date(+now + 31 * 60000);
    expect((await request('/auth/reset-password', { token: mailToken('reset'), password })).statusCode).toBe(400);
    for (let i = 0; i < 10; i++) await request('/auth/login', { email: 'alice@example.test', password: 'bad' });
    expect((await login()).statusCode).toBe(429);
  });
  it('scopes device revocation to the owner and safely updates profiles', async () => {
    await register(); const alice = await login(); await register('bob@example.test'); const bob = await login('bob@example.test');
    const list = await app.inject({ url: '/api/v1/account/sessions', headers: { cookie: cookies(bob) } });
    const bobSession = list.json().data.sessions[0].id;
    expect((await request(`/account/sessions/${bobSession}`, {}, cookies(alice), 'DELETE')).statusCode).toBe(404);
    expect((await account(cookies(bob))).statusCode).toBe(200);
    expect((await request('/account', { name: 'Alice Updated', avatar: null }, cookies(alice), 'PATCH')).json().data.user.name).toBe('Alice Updated');
    expect((await request('/account', { name: 'X', avatar: 'javascript:alert(1)' }, cookies(alice), 'PATCH')).statusCode).toBe(400);
    expect((await request('/account', { name: 'X', avatar: null, email: 'hijack@test.dev' }, cookies(alice), 'PATCH')).statusCode).toBe(400);
    expect((await request('/account/password', { currentPassword: password, password: 'replacement secure passphrase' }, cookies(alice))).statusCode).toBe(200);
    expect((await account(cookies(alice))).statusCode).toBe(401);
  });
});

describe('Google transaction and account linking boundaries', () => {
  async function start(cookie = '', link = false) {
    const response = await request(`/auth/google/${link ? 'link' : 'start'}`, {}, cookie);
    const state = new URL(response.json().data.url).searchParams.get('state');
    return { cookie: cookies(response), url: `/api/v1/auth/google/callback?code=code&state=${state}` };
  }
  it('binds callbacks to their initiating browser and consumes state once', async () => {
    const s = await start();
    const noCookie = await app.inject({ url: s.url }); expect(noCookie.headers.location).toContain('GOOGLE_FAILED');
    const success = await app.inject({ url: s.url, headers: { cookie: s.cookie } }); expect(success.headers.location).toBe(`${config.APP_ORIGIN}/#/`);
    expect((await account(cookies(success))).json().data.user.email).toBe('google@example.test');
    expect((await app.inject({ url: s.url, headers: { cookie: s.cookie } })).headers.location).toContain('GOOGLE_FAILED');
    const rows = await db.db.select().from(identities); expect(rows[0]!.passwordHash).toBeNull();
  });
  it('does not auto-link matching email; explicit verified-account linking works', async () => {
    await register(); googleProfile.email = 'alice@example.test';
    const s = await start();
    expect((await app.inject({ url: s.url, headers: { cookie: s.cookie } })).headers.location).toContain('LINK_REQUIRED');
    expect(await db.db.select().from(users)).toHaveLength(1);
    const signedIn = await login();
    expect((await request('/auth/google/link', {}, cookies(signedIn))).statusCode).toBe(403);
    await request('/auth/verify-email', { token: mailToken('verify') });
    const link = await start(cookies(signedIn), true);
    expect((await app.inject({ url: link.url, headers: { cookie: link.cookie } })).headers.location).toContain('/#/account');
    expect(await db.db.select().from(identities).where(eq(identities.userId, signedIn.json().data.user.id))).toHaveLength(2);
  });
  it('rejects expired state and a link after the initiating session was revoked', async () => {
    const s = await start(); now = new Date(+now + 11 * 60000);
    expect((await app.inject({ url: s.url, headers: { cookie: s.cookie } })).headers.location).toContain('GOOGLE_FAILED');
    await register(); await request('/auth/verify-email', { token: mailToken('verify') }); const signedIn = await login();
    const link = await start(cookies(signedIn), true); await request('/auth/logout', {}, cookies(signedIn));
    expect((await app.inject({ url: link.url, headers: { cookie: link.cookie } })).headers.location).toContain('GOOGLE_FAILED');
  });
});

it('rejects unsafe production configuration', () => {
  expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow();
  expect(() => loadConfig({ APP_ORIGIN: 'https://app.test/path' })).toThrow();
  expect(() => loadConfig({ GOOGLE_CLIENT_ID: 'only-one-credential' })).toThrow();
});
