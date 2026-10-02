import React, { useEffect, useState } from 'react';
import { IconArrowRight, IconBrandGoogle, IconCheck, IconLock } from '@tabler/icons-react';
import Brand from '../ui/Brand';
import { ThemeToggle } from '../builder/ThemeToggle/ThemeToggle';
import { useAuth } from './AuthProvider';
import { api } from './client';
import './Auth.css';

export default function AuthPage({ route, params }) {
  const auth = useAuth();
  const mode = ['register', 'forgot-password', 'reset-password', 'verify-email'].includes(route) ? route : 'login';
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [config, setConfig] = useState(null);
  const [token] = useState(() => params.get('token') || '');
  const oauthError = params.get('error');
  useEffect(() => {
    let alive = true;
    api('/auth/config').then(value => { if (alive) setConfig(value); }).catch(err => { if (alive) setError(err.message); });
    if (token) window.history.replaceState(null, '', `#/${mode}`);
    return () => { alive = false; };
  }, [mode, token]);
  const titles = { login: 'Welcome back.', register: 'Make room for your ideas.', 'forgot-password': 'Find your way back.', 'reset-password': 'A fresh start.', 'verify-email': 'Verify your email.' };
  const descriptions = { login: 'Sign in to your Framewright workspace.', register: 'Create your account and start building.', 'forgot-password': 'We’ll send you a link to reset your password.', 'reset-password': 'Choose a new password for your account.', 'verify-email': 'Confirm this email belongs to you to finish setting up your account.' };
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'login') {
        await auth.login(email, password); window.location.hash = route === 'editor' ? '/editor' : '/';
      } else if (mode === 'register') {
        const data = await api('/auth/register', { method: 'POST', body: { name, email, password } }); setMessage(data.message);
      } else if (mode === 'forgot-password') {
        setMessage((await api('/auth/forgot-password', { method: 'POST', body: { email } })).message);
      } else if (mode === 'reset-password') {
        setMessage((await api('/auth/reset-password', { method: 'POST', body: { token, password } })).message); await auth.restore();
      } else {
        setMessage((await api('/auth/verify-email', { method: 'POST', body: { token } })).message); await auth.restore();
      }
      setPassword('');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const google = async () => { setBusy(true); setError(''); try { const data = await api('/auth/google/start', { method: 'POST' }); window.location.assign(data.url); } catch (err) { setError(err.message); setBusy(false); } };
  return <div className="fw-auth"><header className="fw-auth-header"><Brand compact /><ThemeToggle /></header>
    <main className="fw-auth-main"><section className="fw-auth-story"><span className="fw-eyebrow">FROM IDEA TO INTERFACE</span><h1>Your next idea.<br /><em>Your own way.</em></h1><p>Build visually, shape every detail and take your React code with you.</p><div className="fw-auth-sketch" aria-hidden="true"><div /><div /><div /><div /></div><span className="fw-auth-caption">A workspace made for making.</span></section>
      <section className="fw-auth-card"><IconLock size={23} stroke={1.5} /><h2>{titles[mode]}</h2><p>{descriptions[mode]}</p>
        {oauthError && <p role="alert" className="fw-error">{oauthError === 'LINK_REQUIRED' ? 'An account already uses this email. Sign in with its existing method, then connect Google in Account settings.' : 'Google sign-in could not be completed. Please start again.'}</p>}
        {error && <p role="alert" className="fw-error">{error}</p>}
        {message ? <div className="fw-auth-success" role="status"><IconCheck size={22} /><p>{message}</p><a className="fw-button fw-button--primary" href={auth.user ? '#/' : '#/login'}>{auth.user ? 'Back to workspace' : 'Go to sign in'}<IconArrowRight size={16} /></a></div> : <>
          {['login', 'register'].includes(mode) && <><button className="fw-button fw-google" onClick={google} disabled={busy || !config?.googleEnabled}><IconBrandGoogle size={18} />Continue with Google</button>{config && !config.googleEnabled && <small className="fw-auth-hint">Google sign-in is awaiting configuration. Use email below.</small>}<div className="fw-auth-divider"><span>or continue with email</span></div></>}
          <form onSubmit={submit}>
            {mode === 'register' && <label>Your name<input autoComplete="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>}
            {['login', 'register', 'forgot-password'].includes(mode) && <label>Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>}
            {['login', 'register', 'reset-password'].includes(mode) && <label>{mode === 'reset-password' ? 'New password' : 'Password'}<input type="password" required minLength={mode === 'login' ? 1 : 12} maxLength={256} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} />{mode !== 'login' && <small>Use at least 12 characters. A passphrase works well.</small>}</label>}
            {mode === 'login' && <a className="fw-forgot" href="#/forgot-password">Forgot password?</a>}
            {['reset-password', 'verify-email'].includes(mode) && !token && <p className="fw-error">Open the link from your email to continue. If it was already used, request a new link.</p>}
            <button className="fw-button fw-button--primary fw-auth-submit" disabled={busy || (['reset-password', 'verify-email'].includes(mode) && !token)}>{busy ? 'Please wait…' : ({ login: 'Sign in', register: 'Create account', 'forgot-password': 'Send reset link', 'reset-password': 'Update password', 'verify-email': 'Verify email' })[mode]}<IconArrowRight size={17} /></button>
          </form>
        </>}
        {config?.emailDelivery === 'file' && <p className="fw-auth-dev-note">Development mode: account emails are saved in the backend’s <code>.data/mail</code> folder.</p>}
        <p className="fw-auth-switch">{mode === 'login' ? <>New to Framewright? <a href="#/register">Create an account</a></> : <a href="#/login">Back to sign in</a>}{auth.user && <> · <a href="#/">Workspace</a></>}</p>
      </section>
    </main><footer className="fw-auth-footer">The visual React workspace.</footer>
  </div>;
}
