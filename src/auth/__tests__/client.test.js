import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../client';
const response = (status, data) => ({ ok: status < 400, status, json: async () => status < 400 ? { data } : { error: { code: 'UNAUTHENTICATED', message: 'Sign in' } } });
afterEach(() => vi.unstubAllGlobals());
describe('cookie API client', () => {
  it('explains a failed local proxy without treating it as an expired session', async () => {
    const fetch = vi.fn(async () => ({ ok: false, status: 500, json: async () => { throw new SyntaxError('Empty proxy response'); } }));
    vi.stubGlobal('fetch', fetch);
    await expect(api('/auth/session')).rejects.toMatchObject({ status: 500, code: 'LOCAL_API_UNAVAILABLE' });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('coordinates concurrent refreshes, retries once and sends CSRF headers', async () => {
    let refreshed = false, rotations = 0;
    const fetch = vi.fn(async (url, options) => {
      expect(options.credentials).toBe('same-origin');
      if (url.endsWith('/refresh')) { rotations++; expect(options.headers['X-Framewright-CSRF']).toBe('1'); refreshed = true; return response(200, { user: { id: 'a' } }); }
      return response(refreshed ? 200 : 401, { user: { id: 'a' } });
    });
    vi.stubGlobal('fetch', fetch);
    const result = await Promise.all([api('/account'), api('/account/sessions')]);
    expect(result).toHaveLength(2); expect(rotations).toBe(1);
  });
  it('does not refresh an invalid login or loop on expired refresh tokens', async () => {
    const fetch = vi.fn(async () => response(401)); vi.stubGlobal('fetch', fetch);
    await expect(api('/auth/login', { method: 'POST', body: { email: 'a@test.dev', password: 'wrong' } })).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(1); fetch.mockClear();
    const expired = vi.fn(); window.addEventListener('framewright:session-expired', expired);
    await expect(api('/account')).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(3); expect(expired).toHaveBeenCalledOnce();
    window.removeEventListener('framewright:session-expired', expired);
  });
});
