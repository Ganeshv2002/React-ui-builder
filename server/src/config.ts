import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'), PORT: z.coerce.number().int().min(1).max(65535).default(3002),
  APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('pglite://.data/postgres'),
  RATE_LIMIT_SECRET: z.string().min(32).default('development-only-rate-limit-key-do-not-use-in-production'),
  GOOGLE_CLIENT_ID: z.string().optional(), GOOGLE_CLIENT_SECRET: z.string().optional(),
  MAIL_MODE: z.enum(['file', 'smtp', 'resend']).default('file'), MAIL_FROM: z.string().email().default('hello@framewright.test'),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(), SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(), SMTP_PASSWORD: z.string().optional(),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  SERVE_WEB: z.enum(['true', 'false']).optional(),
});
export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const c = schema.parse({ ...env, APP_ORIGIN: env.APP_ORIGIN || env.RENDER_EXTERNAL_URL });
  const origin = new URL(c.APP_ORIGIN);
  if (origin.origin !== c.APP_ORIGIN) throw new Error('APP_ORIGIN must be an origin without path or trailing slash.');
  if (Boolean(c.GOOGLE_CLIENT_ID) !== Boolean(c.GOOGLE_CLIENT_SECRET)) throw new Error('Configure both Google credentials.');
  if (c.MAIL_MODE === 'smtp' && !c.SMTP_HOST) throw new Error('SMTP_HOST is required.');
  if (c.MAIL_MODE === 'resend' && !c.RESEND_API_KEY?.trim()) throw new Error('RESEND_API_KEY is required.');
  if (c.NODE_ENV === 'production') {
    if (origin.protocol !== 'https:') throw new Error('Production requires an HTTPS APP_ORIGIN.');
    if (!/^postgres(ql)?:\/\//.test(c.DATABASE_URL)) throw new Error('Production requires PostgreSQL.');
    if (c.MAIL_MODE === 'file') throw new Error('Production requires SMTP or Resend delivery.');
    if (!env.RATE_LIMIT_SECRET || c.RATE_LIMIT_SECRET.startsWith('development')) throw new Error('Set a production RATE_LIMIT_SECRET.');
  }
  return c;
}
export type Config = ReturnType<typeof loadConfig>;
