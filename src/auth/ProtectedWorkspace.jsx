import React from 'react';
import { useAuth } from './AuthProvider';
import { useRoute } from './useRoute';
import AuthPage from './AuthPage';
import Brand from '../ui/Brand';

export default function ProtectedWorkspace({ children }) {
  const { user, status, error, restore } = useAuth();
  const { path, params } = useRoute();
  if (status === 'loading') return <div className="fw-auth fw-auth-loading"><Brand compact /><p role="status">Opening your workspace…</p></div>;
  if (status === 'error') return <div className="fw-auth fw-auth-loading"><Brand compact /><h1>Unable to open your workspace</h1><p role="alert">{error}</p><button className="fw-button fw-button--primary" onClick={restore}>Try again</button></div>;
  if (!user || ['verify-email', 'reset-password', 'forgot-password'].includes(path) || (path === 'login' && params.has('error'))) return <AuthPage key={path} route={path} params={params} />;
  return children;
}
