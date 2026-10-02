import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthProvider';
import ProtectedWorkspace from '../ProtectedWorkspace';
import { api } from '../client';
vi.mock('../client', () => ({ api: vi.fn() }));
vi.mock('../../builder/ThemeToggle/ThemeToggle', () => ({ ThemeToggle: () => null }));
vi.mock('../AuthPage', () => ({ default: () => <div>Sign-in screen</div> }));
beforeEach(() => { vi.clearAllMocks(); window.location.hash = '/editor'; });
afterEach(cleanup);
function Content() { const { user, logout } = useAuth(); return <><span>{user.name} editor</span><button onClick={logout}>Sign out</button></>; }
const renderApp = () => render(<AuthProvider><ProtectedWorkspace><Content /></ProtectedWorkspace></AuthProvider>);
it('keeps protected content hidden until session restoration completes', async () => {
  let resolve;
  api.mockReturnValue(new Promise(r => { resolve = r; }));
  renderApp(); expect(screen.queryByText('Alice editor')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Opening your workspace');
  await act(async () => resolve({ user: { id: 'a', name: 'Alice' } }));
  expect(screen.getByText('Alice editor')).toBeInTheDocument();
});
it('protects direct editor links for anonymous sessions', async () => {
  api.mockRejectedValue({ status: 401, message: 'Sign in' }); renderApp();
  await screen.findByText('Sign-in screen'); expect(screen.queryByText('Alice editor')).not.toBeInTheDocument();
});
it('shows an outage instead of silently treating the visitor as authenticated', async () => {
  api.mockRejectedValue({ status: 0, message: 'Server unavailable' }); renderApp();
  expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
  expect(screen.queryByText('Sign-in screen')).not.toBeInTheDocument();
  api.mockResolvedValue({ user: { id: 'a', name: 'Alice' } }); fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('Alice editor');
});
it('clears protected UI after server logout or session expiration', async () => {
  api.mockResolvedValue({ user: { id: 'a', name: 'Alice' } }); renderApp();
  await screen.findByText('Alice editor');
  api.mockResolvedValue({ signedOut: true }); fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() => expect(screen.getByText('Sign-in screen')).toBeInTheDocument());
  expect(api).toHaveBeenLastCalledWith('/auth/logout', { method: 'POST' });
});
