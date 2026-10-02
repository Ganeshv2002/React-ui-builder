import React from 'react';
import { act, renderHook, render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageProvider, usePages } from '../../contexts/PageContext';
import { makeTemplate, templates } from '../templates';
import { parseProject } from '../../runtime/project';
import Dashboard from '../Dashboard';
vi.mock('../../builder/ThemeToggle/ThemeToggle', () => ({ ThemeToggle: () => null }));

const wrapper = ({ children }) => <PageProvider>{children}</PageProvider>;
const key = 'react-ui-builder:pages-state';
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('dashboard project library', () => {
  it('retains legacy work, undo history, theme and behavior across switches and reloads', () => {
    const legacy = makeTemplate('landing', 'Existing work');
    legacy.pages[0].logic = { state: { count: 1 }, actions: {}, resources: {}, effects: [], validation: {} };
    localStorage.setItem(key, JSON.stringify({ pages: legacy.pages, theme: legacy.theme, metadata: { name: legacy.name } }));
    const hook = renderHook(() => usePages(), { wrapper });
    const originalId = hook.result.current.workspaceId;
    act(() => hook.result.current.updatePageLayout('home', [{ id: 'new-heading', type: 'heading', props: { text: 'Changed' } }]));
    act(() => hook.result.current.createWorkspace(makeTemplate('dashboard', 'Analytics')));
    expect(hook.result.current.workspaceProjects).toHaveLength(2);
    act(() => hook.result.current.openWorkspace(originalId));
    expect(hook.result.current.metadata.name).toBe('Existing work');
    expect(hook.result.current.pages[0].logic.state.count).toBe(1);
    expect(hook.result.current.theme).toEqual(legacy.theme);
    act(() => hook.result.current.undoPageLayout('home'));
    expect(hook.result.current.pages[0].layout).toEqual(legacy.pages[0].layout);
    act(() => vi.advanceTimersByTime(250));
    hook.unmount();
    const restored = renderHook(() => usePages(), { wrapper });
    expect(restored.result.current.workspaceId).toBe(originalId);
    expect(restored.result.current.workspaceProjects.map(p => p.metadata.name)).toEqual(['Existing work', 'Analytics']);
    expect(restored.result.current.layoutHistory.home.pointer).toBe(0);
  });

  it('keeps the active project untouched when storage is full or an import is invalid', () => {
    const { result } = renderHook(() => usePages(), { wrapper });
    const before = result.current.pages;
    expect(() => act(() => result.current.createWorkspace({ pages: [] }))).toThrow();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage is full'); });
    expect(() => act(() => result.current.createWorkspace(makeTemplate('blank', 'New work')))).toThrow('Storage is full');
    expect(result.current.pages).toBe(before);
    expect(result.current.workspaceProjects).toHaveLength(1);
  });

  it('renders real project counts, searches, stars and opens existing projects', () => {
    const onOpenEditor = vi.fn();
    render(<PageProvider><Dashboard onOpenEditor={onOpenEditor} /></PageProvider>);
    expect(screen.getByText(/1 project ·/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search projects' }), { target: { value: 'missing' } });
    expect(screen.getByText('No matching projects')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    fireEvent.click(screen.getByRole('button', { name: 'Star My app' }));
    fireEvent.click(screen.getByRole('button', { name: 'Starred', exact: true }));
    expect(screen.getByRole('button', { name: 'Open My app' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open My app' }));
    expect(onOpenEditor).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem('react-ui-builder:pages-state:framewright:favorite-projects'))).toHaveLength(1);
  });

  it.each(templates)('$name produces portable, independent projects', ({ id }) => {
    const a = makeTemplate(id, 'Starter');
    const b = makeTemplate(id, 'Another');
    expect(parseProject(JSON.stringify(a)).name).toBe('Starter');
    expect(a.pages[0].layout.length).toBeGreaterThan(0);
    expect(a.pages[0].layout[0].id).not.toBe(b.pages[0].layout[0].id);
  });

  it('copies legacy projects only on request and isolates accounts without deleting the source', () => {
    const legacy = makeTemplate('landing', 'Legacy site');
    localStorage.setItem(key, JSON.stringify({ pages: legacy.pages, theme: legacy.theme, metadata: { name: legacy.name } }));
    const source = localStorage.getItem(key);
    const a = renderHook(() => usePages(), { wrapper: ({ children }) => <PageProvider storageKey="user-a">{children}</PageProvider> });
    expect(a.result.current.metadata.name).toBe('My app');
    expect(a.result.current.legacyWorkspaceAvailable).toBe(true);
    act(() => a.result.current.importLegacyWorkspace());
    expect(a.result.current.workspaceProjects).toHaveLength(2);
    expect(a.result.current.legacyWorkspaceAvailable).toBe(false);
    a.unmount();
    expect(localStorage.getItem(key)).toBe(source);
    const b = renderHook(() => usePages(), { wrapper: ({ children }) => <PageProvider storageKey="user-b">{children}</PageProvider> });
    expect(b.result.current.workspaceProjects).toHaveLength(1);
  });
});
