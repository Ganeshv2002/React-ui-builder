export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}
let refreshInFlight;
async function raw(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api/v1${path}`, { method, credentials: 'same-origin', signal,
      headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', 'X-Framewright-CSRF': '1' },
      ...(method !== 'GET' ? { body: JSON.stringify(body ?? {}) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach Framewright. Check your connection and try again.', 0, 'NETWORK_ERROR');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(result?.error?.message || 'The server could not complete this request.', response.status, result?.error?.code);
  if (!result || !('data' in result)) throw new ApiError('The server returned an unexpected response.', 502, 'INVALID_RESPONSE');
  return result.data;
}
export function refreshSession() {
  if (!refreshInFlight) {
    const refresh = async () => {
      // Another tab may have refreshed while we waited for the Web Lock.
      try { return await raw('/auth/session'); }
      catch (error) { if (error.status !== 401) throw error; }
      return raw('/auth/refresh', { method: 'POST' });
    };
    refreshInFlight = (typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('framewright-session-refresh', refresh) : refresh()).finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}
export async function api(path, options = {}, retry = true) {
  try { return await raw(path, options); }
  catch (error) {
    const publicAuth = ['/auth/login', '/auth/register', '/auth/logout', '/auth/reset-password', '/auth/forgot-password', '/auth/verify-email', '/auth/google/start'].includes(path);
    if (error.status !== 401 || publicAuth || !retry) throw error;
    try { await refreshSession(); return await raw(path, options); }
    catch (refreshError) {
      if (refreshError.status === 401) window.dispatchEvent(new Event('framewright:session-expired'));
      throw refreshError;
    }
  }
}
