import { describe, expect, it, vi } from 'vitest';
import { createProject, parseProject } from '../project';
import { normalizeTheme, parseThemeFile, resolveToken, defaultTheme } from '../theme';
import { resolveValue, runActions, writePath } from '../engine';
import { generateConfigApp } from '../../utils/configAppGenerator';

const page = { id: 'home', name: 'Home', path: '/', layout: [{ id: 'card', type: 'vendor.card', props: { style: { color: { $token: 'color.brand' } } }, customMetadata: { keep: true }, children: [{ id: 'text', type: 'text', props: { children: 'Hello' } }] }] };
describe('portable project contract', () => {
  it('round trips nested layout, unknown component metadata, behavior, routes and theme', () => {
    const project = createProject([{ ...page, logic: { state: { name: 'Ada' }, actions: { greet: [{ type: 'setState', path: 'greeting', value: { $state: 'name' } }] } } }]);
    expect(parseProject(JSON.stringify(project))).toEqual(project);
    expect(project.pages[0].layout[0].customMetadata.keep).toBe(true);
  });
  it('rejects future versions, duplicate IDs/routes and missing references', () => {
    const project = createProject([page]);
    expect(() => parseProject({ ...project, schemaVersion: 2 })).toThrow();
    expect(() => createProject([page, page])).toThrow(/unique/);
    expect(() => createProject([{ ...page, layout: [...page.layout, ...page.layout] }])).toThrow(/Duplicate/);
    expect(() => createProject([{ ...page, layout: [{ id: 'x', type: 'button', events: { click: ['missing'] } }] }])).toThrow(/Unknown action/);
    expect(() => createProject([page], { name: 'Empty', tokens: {} })).toThrow(/Missing theme/);
    expect(() => parseProject('{"__proto__":{}}')).toThrow(/Unsafe/);
  });
  it('migrates legacy page backups and exports actual runtime source, not page JSX', () => {
    const project = parseProject({ pages: [page] });
    const files = generateConfigApp(project);
    expect(JSON.parse(files['src/app.config.json'])).toEqual(project);
    expect(files['src/runtime/registry.jsx']).toContain('migrate');
    expect(files['src/handlers.js']).toContain('handlers');
    expect(files['src/pages/Home.jsx']).toBeUndefined();
    expect(JSON.parse(files['app.schema.json']).$schema).toContain('2020-12');
  });
});
describe('theme files', () => {
  it('imports CSS variables and resolves aliases', () => {
    const theme = parseThemeFile(':root { --brand: #1d4ed8; --accent: var(--brand); --space: 12px; }', 'theme.css');
    expect(resolveToken(theme, '--accent')).toBe('#1d4ed8');
    expect(resolveValue({ color: { $token: '--brand' } }, { theme })).toEqual({ color: '#1d4ed8' });
  });
  it('supports inherited DTCG types, dimension and sRGB objects', () => {
    const theme = normalizeTheme({ color: { $type: 'color', blue: { $value: { colorSpace: 'srgb', components: [0, 0, 1] } } }, space: { $type: 'dimension', md: { $value: { value: 1, unit: 'rem' } } } });
    expect(resolveToken(theme, 'color.blue')).toBe('rgb(0 0 255 / 1)');
    expect(resolveToken(theme, 'space.md')).toBe('1rem');
  });
  it('rejects missing/cyclic aliases, stylesheets and unsupported composite values', () => {
    expect(() => normalizeTheme({ a: { $value: '{b}' }, b: { $value: '{a}' } })).toThrow(/Circular/);
    expect(() => normalizeTheme({ a: { $value: '{missing}' } })).toThrow(/Missing/);
    expect(() => parseThemeFile('body { color: red; }', 'theme.css')).toThrow(/:root/);
    expect(() => normalizeTheme({ a: { $value: 'url(https://example.com)' } })).toThrow(/Invalid/);
  });
});
describe('declarative action runtime', () => {
  const setup = () => {
    let state = { email: '' };
    return { theme: defaultTheme, getState: () => state, setState: v => { state = v; }, setErrors: vi.fn(), navigate: vi.fn(), allowNetwork: true, fetch: vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 7 }) }) };
  };
  it('validates before request, assigns response and navigates in order', async () => {
    const env = setup();
    const logic = { resources: { save: { url: '/api/users', method: 'POST', body: { email: { $state: 'email' } } } }, validation: { default: [{ field: 'email', rule: 'required' }] }, actions: { save: [{ type: 'validate' }, { type: 'request', resource: 'save', assignTo: 'user' }, { type: 'navigate', pageId: 'done' }] } };
    await runActions(['save'], logic, env);
    expect(env.fetch).not.toHaveBeenCalled();
    env.setState({ email: 'ada@example.com' });
    await runActions(['save'], logic, env);
    expect(env.fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({ body: '{"email":"ada@example.com"}' }));
    expect(env.getState().user.id).toBe(7);
    expect(env.navigate).toHaveBeenCalledWith('done');
  });
  it('handles HTTP failures and blocks network in preview', async () => {
    const env = setup(), logic = { resources: { load: { url: '/api/data' } }, actions: { load: [{ type: 'request', resource: 'load', assignTo: 'data' }] } };
    env.fetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(runActions(['load'], logic, env)).rejects.toThrow(/500/);
    expect(env.getState().data).toBeUndefined();
    env.allowNetwork = false;
    await expect(runActions(['load'], logic, env)).rejects.toThrow(/disabled/);
    expect(() => writePath({}, '__proto__.x', 1)).toThrow();
  });
  it('uses event bindings, custom handlers and cancellation without evaluating source', async () => {
    const env = setup(); env.handlers = { double: vi.fn(v => v * 2) };
    await runActions(['input'], { actions: { input: [{ type: 'setState', path: 'email', value: { $event: 'value' } }, { type: 'custom', handler: 'double', args: 4 }, { type: 'setState', path: 'result', value: { $result: '' } }] } }, env, { value: 'new' });
    expect(env.getState()).toEqual({ email: 'new', result: 8 });
    const controller = new AbortController(); controller.abort();
    await runActions(['anything'], { actions: { anything: [{ type: 'navigate', pageId: 'done' }] } }, env, {}, controller.signal);
    expect(env.navigate).not.toHaveBeenCalled();
  });
});
