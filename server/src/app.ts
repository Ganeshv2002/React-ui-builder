import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import staticFiles from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { ZodError } from 'zod';
import { sql } from 'drizzle-orm';
import type { Config } from './config.js';
import type { Database } from './db/connection.js';
import { createMailer, type Mailer } from './shared/mail.js';
import { AppError } from './shared/errors.js';
import { createSecurity } from './shared/security.js';
import { createRateLimiter } from './shared/rateLimit.js';
import { SessionService } from './modules/auth/sessions.js';
import { AuthService } from './modules/auth/service.js';
import { createGoogleOidc, type GoogleOidc } from './modules/auth/oauth.js';
import { authRoutes } from './modules/auth/routes.js';
import { accountRoutes } from './modules/account/routes.js';

export async function buildApp(config: Config, deps: { db: Database; mailer?: Mailer; google?: GoogleOidc; now?: () => Date }) {
  const app = Fastify({ bodyLimit: 16384, trustProxy: config.TRUST_PROXY === 'true', disableRequestLogging: true,
    logger: config.NODE_ENV === 'test' ? false : { level: 'info', redact: ['req.headers', 'req.body', 'res.headers', 'password', 'token'] } });
  await app.register(cookie);
  await app.register(helmet, { referrerPolicy: { policy: 'no-referrer' }, contentSecurityPolicy: {
    directives: { scriptSrc: ["'self'", "'unsafe-eval'"], workerSrc: ["'self'", 'blob:'],
      connectSrc: ["'self'", 'https:'], imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
      fontSrc: ["'self'", 'https:', 'data:'], frameSrc: ["'self'", 'blob:'] },
  } });
  const sessionService = new SessionService(deps.db, deps.now);
  const security = createSecurity(config, sessionService);
  const google = deps.google || createGoogleOidc(config);
  const auth = new AuthService(deps.db, sessionService, deps.mailer || createMailer(config), google, config.APP_ORIGIN, deps.now,
    () => app.log.error({ event: 'account_mail_failed' }, 'Account email delivery failed; inspect the mail service and use resend.'));
  const limit = createRateLimiter(deps.db, config.RATE_LIMIT_SECRET, deps.now);
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    security.csrf(req);
    if (req.url.startsWith('/api/v1/')) await limit(`global:ip:${req.ip}`, 1000);
  });
  app.addHook('onResponse', async (req, reply) => {
    app.log.info({ requestId: req.id, method: req.method, route: req.routeOptions.url || 'unmatched', status: reply.statusCode }, 'request complete');
  });
  app.setErrorHandler((error, req, reply) => {
    if (error instanceof ZodError) return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }, requestId: req.id });
    if (error instanceof AppError) return reply.code(error.status).send({ error: { code: error.code, message: error.message }, requestId: req.id });
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) return reply.code(status).send({ error: { code: 'BAD_REQUEST', message: 'The request could not be processed.' }, requestId: req.id });
    app.log.error({ requestId: req.id, event: 'unhandled_error' }, 'An unexpected server error occurred.');
    return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' }, requestId: req.id });
  });
  app.setNotFoundHandler((req, reply) => reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' }, requestId: req.id }));
  app.get('/api/health', async () => ({ data: { status: 'ok' } }));
  app.get('/api/ready', async () => { await deps.db.execute(sql`select 1`); return { data: { status: 'ready' } }; });
  await authRoutes(app, auth, security, config, limit, google.enabled);
  await accountRoutes(app, auth, security, limit);
  if (config.SERVE_WEB === 'true' || (config.NODE_ENV === 'production' && config.SERVE_WEB !== 'false')) {
    const root = fileURLToPath(new URL(import.meta.url.includes('/dist/src/') ? '../../../dist/' : '../../dist/', import.meta.url));
    if (!existsSync(`${root}/index.html`)) throw new Error('Frontend build missing. Run npm run build from the repository root.');
    await app.register(staticFiles, { root, index: 'index.html', dotfiles: 'deny' });
    // The editor uses hash routes; unknown API and asset paths must remain real 404s.
  }
  return app;
}
