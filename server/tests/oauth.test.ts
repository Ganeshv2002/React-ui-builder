import { describe, expect, it } from 'vitest';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import * as oidc from 'openid-client';
import { createGoogleOidc } from '../src/modules/auth/oauth.js';
import { loadConfig } from '../src/config.js';

describe('OIDC protocol adapter with signed ID tokens', () => {
  async function setup(overrides: Record<string, unknown> = {}, wrongSignature = false) {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256' };
    const signingKey = wrongSignature ? (await generateKeyPair('RS256')).privateKey : privateKey;
    const signed = await new SignJWT({ nonce: 'nonce-value', email: 'person@example.test', email_verified: true, name: 'Person', ...overrides })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setIssuer('https://accounts.google.com').setAudience('test-client').setSubject('subject-123').setIssuedAt().setExpirationTime('5m').sign(signingKey);
    const configuration = new oidc.Configuration({ issuer: 'https://accounts.google.com', authorization_endpoint: 'https://accounts.google.com/auth', token_endpoint: 'https://accounts.google.com/token', jwks_uri: 'https://accounts.google.com/jwks', id_token_signing_alg_values_supported: ['RS256'] }, 'test-client', 'test-secret');
    let verifier = '';
    configuration[oidc.customFetch] = async (url, options) => {
      if (String(url).endsWith('/jwks')) return Response.json({ keys: [jwk] });
      verifier = new URLSearchParams(String(options?.body)).get('code_verifier') || '';
      return Response.json({ access_token: 'google-test-token', token_type: 'Bearer', id_token: signed });
    };
    const provider = createGoogleOidc(loadConfig({ NODE_ENV: 'test' }), configuration);
    const transaction = { state: 'state-value', nonce: 'nonce-value', verifier: oidc.randomPKCECodeVerifier() };
    const callback = new URL('http://localhost:5173/api/v1/auth/google/callback?code=code&state=state-value');
    return { provider, transaction, callback, verifier: () => verifier };
  }
  it('sends state, nonce and S256 PKCE, then exchanges and verifies a signed token', async () => {
    const s = await setup(); const url = new URL(await s.provider.authorizationUrl(s.transaction));
    expect(url.searchParams.get('nonce')).toBe('nonce-value'); expect(url.searchParams.get('state')).toBe('state-value');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBe(await oidc.calculatePKCECodeChallenge(s.transaction.verifier));
    expect((await s.provider.exchange(s.callback, s.transaction)).sub).toBe('subject-123');
    expect(s.verifier()).toBe(s.transaction.verifier);
  });
  it('rejects a mismatched nonce, state, signature and unverified email', async () => {
    for (const overrides of [{ nonce: 'wrong' }, { email_verified: false }]) {
      const s = await setup(overrides); await expect(s.provider.exchange(s.callback, s.transaction)).rejects.toThrow();
    }
    const wrong = await setup({}, true); await expect(wrong.provider.exchange(wrong.callback, wrong.transaction)).rejects.toThrow();
    const state = await setup(); state.callback.searchParams.set('state', 'wrong'); await expect(state.provider.exchange(state.callback, state.transaction)).rejects.toThrow();
  });
});
