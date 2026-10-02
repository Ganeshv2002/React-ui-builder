import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AuthService } from './service.js';
import type { Security } from '../../shared/security.js';
import type { Config } from '../../config.js';
import type { createRateLimiter } from '../../shared/rateLimit.js';
import { publicUser } from './sessions.js';
import { AppError } from '../../shared/errors.js';

export const emailSchema = z.string().trim().email().max(254).transform(s => s.toLowerCase());
export const passwordSchema = z.string().min(12, 'Use at least 12 characters.').max(256);
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const genericMessage = 'If this address can receive an account email, a link has been sent. Check your inbox.';
export async function authRoutes(app: FastifyInstance, auth: AuthService, security: Security, config: Config, limit: ReturnType<typeof createRateLimiter>, googleEnabled: boolean) {
  const prefix = '/api/v1/auth';
  app.get(`${prefix}/config`, async () => ({ data: { googleEnabled, emailDelivery: config.NODE_ENV === 'production' ? 'email' : config.MAIL_MODE } }));
  app.get(`${prefix}/session`, { preHandler: security.requireAuth }, async req => ({ data: { user: publicUser(req.auth!.user) } }));
  app.post(`${prefix}/register`, async (req, reply) => {
    const input = z.object({ name: z.string().trim().min(1).max(100), email: emailSchema, password: passwordSchema }).strict().parse(req.body);
    await limit(`register:ip:${req.ip}`, 10); await limit(`register:email:${input.email}`, 5);
    await auth.register(input.name, input.email, input.password);
    return reply.code(202).send({ data: { message: genericMessage } });
  });
  app.post(`${prefix}/login`, async (req, reply) => {
    const input = z.object({ email: emailSchema, password: z.string().min(1).max(256) }).strict().parse(req.body);
    await limit(`login:ip:${req.ip}`, 40); await limit(`login:email:${input.email}`, 10);
    const result = await auth.login(input.email, input.password, req.headers['user-agent'] || 'Unknown browser');
    security.setTokens(reply, result.tokens);
    return { data: { user: result.user } };
  });
  app.post(`${prefix}/refresh`, async (req, reply) => {
    await limit(`refresh:ip:${req.ip}`, 120);
    try {
      const tokens = await auth.session.rotate(req.cookies[security.names.refresh]);
      security.setTokens(reply, tokens);
      const result = await auth.session.authenticate(tokens.access);
      return { data: { user: publicUser(result.user) } };
    } catch (error) { security.clearTokens(reply); throw error; }
  });
  app.post(`${prefix}/logout`, async (req, reply) => {
    await auth.session.logout(req.cookies[security.names.access], req.cookies[security.names.refresh]);
    security.clearTokens(reply); return { data: { signedOut: true } };
  });
  app.post(`${prefix}/forgot-password`, async req => {
    const { email } = z.object({ email: emailSchema }).strict().parse(req.body);
    await limit(`mail:ip:${req.ip}`, 15); await limit(`mail:email:${email}`, 4);
    await auth.forgotPassword(email); return { data: { message: genericMessage } };
  });
  app.post(`${prefix}/reset-password`, async (req, reply) => {
    const { token, password } = z.object({ token: tokenSchema, password: passwordSchema }).strict().parse(req.body);
    await limit(`reset:ip:${req.ip}`, 10); await auth.resetPassword(token, password);
    security.clearTokens(reply); return { data: { message: 'Password updated. Sign in with your new password.' } };
  });
  app.post(`${prefix}/verify-email`, async req => {
    const { token } = z.object({ token: tokenSchema }).strict().parse(req.body);
    await limit(`verify:ip:${req.ip}`, 20); await auth.verifyEmail(token);
    return { data: { message: 'Email verified. You can continue to Framewright.' } };
  });
  app.post(`${prefix}/resend-verification`, { preHandler: security.requireAuth }, async req => {
    await limit(`verify:user:${req.auth!.user.id}`, 4);
    if (!req.auth!.user.emailVerifiedAt) await auth.sendAccountMail(req.auth!.user, 'verify');
    return { data: { message: genericMessage } };
  });
  app.post(`${prefix}/google/start`, async (req, reply) => {
    await limit(`google:ip:${req.ip}`, 20);
    const result = await auth.startGoogle(); security.setOAuth(reply, result.binding); return { data: { url: result.url } };
  });
  app.post(`${prefix}/google/link`, { preHandler: security.requireVerified }, async (req, reply) => {
    await limit(`google:ip:${req.ip}`, 20);
    const result = await auth.startGoogle(req.auth!); security.setOAuth(reply, result.binding); return { data: { url: result.url } };
  });
  app.get(`${prefix}/google/callback`, async (req, reply) => {
    security.clearOAuth(reply);
    try {
      await limit(`google:ip:${req.ip}`, 40);
      // Fixed origin; never trust Host or a caller-supplied redirect URL.
      const result = await auth.finishGoogle(new URL(req.url, config.APP_ORIGIN), req.cookies[security.names.oauth], req.headers['user-agent'] || 'Unknown browser');
      security.setTokens(reply, result.tokens);
      return reply.redirect(`${config.APP_ORIGIN}/#/${result.linked ? 'account' : ''}`);
    } catch (error) {
      const code = error instanceof AppError && ['LINK_REQUIRED', 'IDENTITY_IN_USE', 'REAUTHENTICATE', 'EMAIL_NOT_VERIFIED'].includes(error.code) ? error.code : 'GOOGLE_FAILED';
      return reply.redirect(`${config.APP_ORIGIN}/#/login?error=${code}`);
    }
  });
}
