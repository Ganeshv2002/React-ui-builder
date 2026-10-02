import React, { useEffect, useState } from 'react';
import { IconArrowLeft, IconDeviceDesktop, IconLogout, IconBrandGoogle, IconShieldCheck } from '@tabler/icons-react';
import Brand from '../ui/Brand';
import { ThemeToggle } from '../builder/ThemeToggle/ThemeToggle';
import { api } from './client';
import { useAuth } from './AuthProvider';

export default function AccountPage() {
  const auth = useAuth();
  const [name, setName] = useState(auth.user.name), [avatar, setAvatar] = useState(auth.user.avatar || '');
  const [identities, setIdentities] = useState([]), [sessions, setSessions] = useState([]);
  const [currentPassword, setCurrentPassword] = useState(''), [password, setPassword] = useState('');
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const load = async () => {
    const [account, devices, config] = await Promise.all([api('/account'), api('/account/sessions'), api('/auth/config')]);
    setIdentities(account.identities); setSessions(devices.sessions); setGoogleEnabled(config.googleEnabled);
  };
  useEffect(() => { load().catch(err => setError(err.message)); }, []);
  const run = async action => { setBusy(true); setError(''); setMessage(''); try { await action(); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const signOut = () => run(async () => { await auth.logout(); window.location.hash = '/login'; });
  return <div className="fw-account"><header className="fw-auth-header"><Brand compact /><div className="fw-header-tools"><ThemeToggle /><button className="fw-button" onClick={signOut} disabled={busy}><IconLogout size={16} />Sign out</button></div></header>
    <main className="fw-account-main"><a className="fw-account-back" href="#/"><IconArrowLeft size={16} />Back to projects</a><span className="fw-eyebrow">YOUR WORKSPACE, YOUR ACCOUNT</span><h1>Account settings</h1><p className="fw-account-intro">Manage your profile, sign-in methods and active devices.</p>
      {error && <p role="alert" className="fw-error">{error}</p>}{message && <p role="status" className="fw-account-message">{message}</p>}
      <section className="fw-account-section"><div><h2>Profile</h2><p>The details associated with your account.</p></div><form onSubmit={e => { e.preventDefault(); run(async () => { const data = await api('/account', { method: 'PATCH', body: { name, avatar: avatar || null } }); auth.setUser(data.user); setMessage('Profile updated.'); }); }}>
        <label>Display name<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label><label>Avatar URL<input type="url" maxLength={2048} value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://…" /></label>
        <label>Email address<input readOnly value={auth.user.email} /></label><div className="fw-email-status"><IconShieldCheck size={16} />{auth.user.emailVerified ? 'Email verified' : 'Email not verified'}{!auth.user.emailVerified && <button type="button" className="fw-text-button" disabled={busy} onClick={() => run(async () => setMessage((await api('/auth/resend-verification', { method: 'POST' })).message))}>Send verification email</button>}</div>
        <button className="fw-button fw-button--primary" disabled={busy}>Save profile</button></form></section>
      <section className="fw-account-section"><div><h2>Sign-in methods</h2><p>Connect another way to access your account.</p></div><div className="fw-account-methods">{identities.map(identity => <div key={identity.provider}><strong>{identity.provider === 'google' ? 'Google' : 'Email and password'}</strong><span>Connected</span></div>)}
        {!identities.some(i => i.provider === 'google') && <><button className="fw-button" disabled={busy || !googleEnabled || !auth.user.emailVerified} onClick={() => run(async () => { const data = await api('/auth/google/link', { method: 'POST' }); window.location.assign(data.url); })}><IconBrandGoogle size={17} />Connect Google</button><p>{!googleEnabled ? 'Google sign-in is awaiting backend configuration.' : !auth.user.emailVerified ? 'Verify your email before connecting Google.' : 'For security, sign in again if your session is more than 10 minutes old.'}</p></>}
        {!identities.some(i => i.provider === 'local') && <button className="fw-button" disabled={busy} onClick={() => run(async () => setMessage((await api('/auth/forgot-password', { method: 'POST', body: { email: auth.user.email } })).message))}>Email me a link to set a password</button>}
      </div></section>
      {identities.some(i => i.provider === 'local') && <section className="fw-account-section"><div><h2>Password</h2><p>Changing your password signs out all devices.</p></div><form onSubmit={e => { e.preventDefault(); run(async () => { await api('/account/password', { method: 'POST', body: { currentPassword, password } }); setPassword(''); setCurrentPassword(''); await auth.restore(); window.location.hash = '/login'; }); }}>
        <label>Current password<input type="password" autoComplete="current-password" required value={currentPassword} maxLength={256} onChange={e => setCurrentPassword(e.target.value)} /></label><label>New password<input type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={password} onChange={e => setPassword(e.target.value)} /><small>Use at least 12 characters.</small></label><button className="fw-button" disabled={busy}>Change password</button></form></section>}
      <section className="fw-account-section"><div><h2>Active devices</h2><p>Sign out sessions you no longer use.</p></div><div className="fw-device-list">{sessions.map(session => <div key={session.id}><IconDeviceDesktop size={21} /><div><strong>{session.current ? 'This browser' : 'Browser session'}</strong><p title={session.device}>{session.device}</p><small>Last active {new Date(session.lastSeenAt).toLocaleString()}</small></div><button className="fw-button" disabled={busy} onClick={() => run(async () => { await api(`/account/sessions/${session.id}`, { method: 'DELETE' }); if (session.current) await auth.restore(); else await load(); })}>Sign out</button></div>)}<button className="fw-button" disabled={busy || sessions.length < 2} onClick={() => run(async () => { await api('/account/sessions/revoke-others', { method: 'POST' }); await load(); setMessage('Other devices signed out.'); })}>Sign out other devices</button></div></section>
    </main></div>;
}
