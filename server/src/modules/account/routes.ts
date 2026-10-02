import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AuthService } from '../auth/service.js';
import { passwordSchema } from '../auth/routes.js';
import { publicUser } from '../auth/sessions.js';
import type { Security } from '../../shared/security.js';
import type { createRateLimiter } from '../../shared/rateLimit.js';

export async function accountRoutes(app: FastifyInstance, auth: AuthService, security: Security, limit: ReturnType<typeof createRateLimiter>) {
  const prefix = '/api/v1/account';
  app.get(prefix, { preHandler: security.requireAuth }, async req => ({ data: { user: publicUser(req.auth!.user), identities: await auth.getIdentities(req.auth!.user.id) } }));
  app.patch(prefix, { preHandler: security.requireAuth }, async req => {
    const body = z.object({ name: z.string().trim().min(1).max(100), avatar: z.string().url().max(2048).refine(v => v.startsWith('https://'), 'Use an HTTPS image URL.').nullable() }).strict().parse(req.body);
    return { data: { user: await auth.updateProfile(req.auth!.user.id, body) } };
  });
  app.post(`${prefix}/password`, { preHandler: security.requireAuth }, async (req, reply) => {
    const { currentPassword, password } = z.object({ currentPassword: z.string().min(1).max(256), password: passwordSchema }).strict().parse(req.body);
    await limit(`password:user:${req.auth!.user.id}`, 5);
    await auth.changePassword(req.auth!.user.id, currentPassword, password); security.clearTokens(reply);
    return { data: { message: 'Password changed. Sign in again on your devices.' } };
  });
  app.get(`${prefix}/sessions`, { preHandler: security.requireAuth }, async req => ({ data: { sessions: await auth.session.list(req.auth!.user.id, req.auth!.session.id) } }));
  app.delete(`${prefix}/sessions/:id`, { preHandler: security.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await auth.session.revoke(req.auth!.user.id, id);
    if (id === req.auth!.session.id) security.clearTokens(reply);
    return { data: { revoked: true } };
  });
  app.post(`${prefix}/sessions/revoke-others`, { preHandler: security.requireAuth }, async req => {
    await auth.session.revokeOthers(req.auth!.user.id, req.auth!.session.id); return { data: { revoked: true } };
  });
}
