import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from './client';
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const generation = useRef(0);
  const channel = useRef(null);
  const restore = useCallback(async () => {
    const current = ++generation.current;
    try {
      const data = await api('/auth/session');
      if (current === generation.current) { setUser(data.user); setStatus('ready'); setError(''); }
    } catch (err) {
      if (current !== generation.current) return;
      setUser(null); setStatus(err.status === 401 ? 'ready' : 'error'); setError(err.status === 401 ? '' : err.message);
    }
  }, []);
  useEffect(() => {
    restore();
    const expired = () => { ++generation.current; setUser(null); setStatus('ready'); };
    window.addEventListener('framewright:session-expired', expired);
    const onFocus = () => { if (document.visibilityState === 'visible') restore(); };
    document.addEventListener('visibilitychange', onFocus);
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('framewright-auth');
      channel.current.onmessage = () => restore();
    }
    return () => { ++generation.current; window.removeEventListener('framewright:session-expired', expired); document.removeEventListener('visibilitychange', onFocus); channel.current?.close(); };
  }, [restore]);
  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    ++generation.current; setUser(data.user); setStatus('ready'); setError(''); channel.current?.postMessage('changed');
  };
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    ++generation.current; setUser(null); setStatus('ready'); channel.current?.postMessage('changed');
  };
  return <AuthContext.Provider value={{ user, status, error, login, logout, restore, setUser }}>{children}</AuthContext.Provider>;
}
