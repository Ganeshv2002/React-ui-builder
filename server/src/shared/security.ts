import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Config } from '../config.js';
import type { SessionService } from '../modules/auth/sessions.js';
import { ACCESS_SECONDS } from '../modules/auth/sessions.js';
import { AppError } from './errors.js';
import type { Session, User } from '../db/schema.js';
declare module 'fastify' { interface FastifyRequest { auth?: { user: User; session: Session } } }
export function createSecurity(config: Config, sessions: SessionService) {
  const secure = config.NODE_ENV === 'production';
  const names = { access: secure ? '__Host-fw_access' : 'fw_access', refresh: secure ? '__Host-fw_refresh' : 'fw_refresh', oauth: secure ? '__Host-fw_oauth' : 'fw_oauth' };
  const options = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' };
  return {
    names,
    requireAuth: async (request: FastifyRequest) => { request.auth = await sessions.authenticate(request.cookies[names.access]); },
    requireVerified: async (request: FastifyRequest) => {
      request.auth = await sessions.authenticate(request.cookies[names.access]);
      if (!request.auth.user.emailVerifiedAt) throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before continuing.');
    },
    csrf(request: FastifyRequest) {
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
      if (request.headers.origin !== config.APP_ORIGIN || request.headers['x-framewright-csrf'] !== '1' || request.headers['sec-fetch-site'] === 'cross-site') {
        throw new AppError(403, 'CSRF_REJECTED', 'The request origin could not be verified.');
      }
      if (!request.headers['content-type']?.startsWith('application/json')) throw new AppError(415, 'JSON_REQUIRED', 'Send an application/json request.');
    },
    setTokens(reply: FastifyReply, tokens: { access: string; refresh: string; expiresAt: Date }) {
      reply.setCookie(names.access, tokens.access, { ...options, maxAge: ACCESS_SECONDS });
      reply.setCookie(names.refresh, tokens.refresh, { ...options, expires: tokens.expiresAt });
    },
    clearTokens(reply: FastifyReply) { reply.clearCookie(names.access, options); reply.clearCookie(names.refresh, options); },
    setOAuth(reply: FastifyReply, binding: string) { reply.setCookie(names.oauth, binding, { ...options, maxAge: 600 }); },
    clearOAuth(reply: FastifyReply) { reply.clearCookie(names.oauth, options); },
  };
}
export type Security = ReturnType<typeof createSecurity>;
