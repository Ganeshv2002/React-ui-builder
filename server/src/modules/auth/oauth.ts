import * as oidc from 'openid-client';
import { z } from 'zod';
import type { Config } from '../../config.js';
import { AppError } from '../../shared/errors.js';

export type OidcTransaction = { state: string; nonce: string; verifier: string };
export type GoogleProfile = { sub: string; email: string; name: string; picture?: string };
export interface GoogleOidc {
  enabled: boolean;
  authorizationUrl(transaction: OidcTransaction): Promise<string>;
  exchange(callback: URL, transaction: OidcTransaction): Promise<GoogleProfile>;
}
const profile = z.object({ sub: z.string().min(1).max(255), email: z.string().email(), email_verified: z.literal(true), name: z.string().max(150).default('Framewright user'), picture: z.string().url().optional() });
export function createGoogleOidc(config: Config, suppliedConfiguration?: oidc.Configuration): GoogleOidc {
  let discovery: Promise<oidc.Configuration> | undefined;
  const get = () => {
    if (suppliedConfiguration) { oidc.enableNonRepudiationChecks(suppliedConfiguration); return Promise.resolve(suppliedConfiguration); }
    if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) throw new AppError(503, 'GOOGLE_NOT_CONFIGURED', 'Google sign-in is not configured yet. Use email and password.');
    return discovery ??= oidc.discovery(new URL('https://accounts.google.com'), config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, undefined, { execute: [oidc.enableNonRepudiationChecks] }).catch(e => { discovery = undefined; throw e; });
  };
  return {
    enabled: Boolean(suppliedConfiguration || config.GOOGLE_CLIENT_ID),
    async authorizationUrl(t) {
      return oidc.buildAuthorizationUrl(await get(), { redirect_uri: `${config.APP_ORIGIN}/api/v1/auth/google/callback`, scope: 'openid email profile',
        response_type: 'code', state: t.state, nonce: t.nonce, code_challenge: await oidc.calculatePKCECodeChallenge(t.verifier), code_challenge_method: 'S256' }).href;
    },
    async exchange(callback, t) {
      const tokens = await oidc.authorizationCodeGrant(await get(), callback, { pkceCodeVerifier: t.verifier, expectedState: t.state, expectedNonce: t.nonce, idTokenExpected: true });
      const p = profile.parse(tokens.claims());
      return { sub: p.sub, email: p.email.toLowerCase(), name: p.name, ...(p.picture?.startsWith('https://') ? { picture: p.picture } : {}) };
    },
  };
}
