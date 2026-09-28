import React, { useCallback, useEffect, useRef, useState } from 'react';
import { readPath, resolveValue, runActions, safeURL } from './engine.js';
import { themeVariables } from './theme.js';

function RuntimeNode({ node, registry, context, dispatch, navigate, pages }) {
  const adapter = registry[node.type];
  if (!adapter) return <div role="alert">Component “{node.type}” is not registered. Its configuration has been preserved.</div>;
  const version = node.contractVersion || 1;
  const Component = adapter.component;
  let props;
  try {
    if (version !== adapter.version && !adapter.migrate) throw new Error(`Unsupported contract ${node.type}@${version}`);
    props = adapter.migrate ? adapter.migrate(node.props, version) : node.props;
    if (node.visibleWhen !== undefined && !resolveValue(node.visibleWhen, context)) return null;
    props = resolveValue({ ...props, ...node.bindings }, context);
    for (const key of Object.keys(props)) if (/^on[A-Z]|^dangerouslySetInnerHTML$|^srcDoc$|^ref$|^key$/.test(key)) delete props[key];
    for (const key of ['href', 'src', 'action']) if (props[key]) safeURL(props[key]);
  } catch (error) { return <div role="alert">{error.message}</div>; }
  const eventProps = {};
  for (const [eventName, names] of Object.entries(node.events || {})) {
    eventProps[`on${eventName[0].toUpperCase()}${eventName.slice(1)}`] = event => {
      if (eventName === 'submit' || (eventName === 'click' && ['link', 'navigationLink'].includes(node.type))) event.preventDefault();
      const data = eventName === 'submit' ? { values: Object.fromEntries(new FormData(event.currentTarget)) } : { value: event.target?.value, checked: event.target?.checked };
      dispatch(names, data);
    };
  }
  const content = node.children?.length ? node.children.map(child => <RuntimeNode key={child.id} node={child} registry={registry} context={context} dispatch={dispatch} navigate={navigate} pages={pages} />) : props.children;
  return <Component {...props} {...eventProps} runtime={{ navigate, pages }} children={content} />;
}

function RuntimeEffect({ effect, state, dispatch }) {
  const watched = JSON.stringify(effect.watch.map(path => readPath(state, path)));
  const last = useRef(watched);
  useEffect(() => {
    const controller = new AbortController();
    if (effect.on === 'mount' || watched !== last.current) dispatch(effect.actions, {}, controller.signal);
    last.current = watched;
    return () => controller.abort();
  }, [effect, watched, dispatch]);
  return null;
}

class RuntimeBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error: error.message }; }
  render() { return this.state.error ? <div role="alert">Cannot render this page: {this.state.error}</div> : this.props.children; }
}

function RuntimePage({ page, project, registry, handlers, navigate, allowNetwork }) {
  const logic = page.logic || {};
  const [state, setState] = useState(() => structuredClone(logic.state || {}));
  const stateRef = useRef(state);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(0);
  const controllers = useRef(new Set());
  const envRef = useRef(null);
  envRef.current = { theme: project.theme, allowNetwork, handlers, navigate, getState: () => stateRef.current, setErrors,
    setState: next => { stateRef.current = next; setState(next); } };
  const dispatch = useCallback(async (names, event = {}, externalSignal) => {
    const controller = new AbortController();
    controllers.current.add(controller);
    const abort = () => controller.abort();
    externalSignal?.addEventListener('abort', abort, { once: true });
    setError(''); setPending(n => n + 1);
    try { await runActions(names, page.logic || {}, envRef.current, event, controller.signal); }
    catch (err) { if (!controller.signal.aborted) setError(err.message); }
    finally { externalSignal?.removeEventListener('abort', abort); controllers.current.delete(controller); setPending(n => Math.max(0, n - 1)); }
  }, [page.logic]);
  useEffect(() => {
    const active = controllers.current;
    return () => { active.forEach(c => c.abort()); active.clear(); };
  }, []);
  const context = { state, theme: project.theme };
  return <div className="fw-page" style={themeVariables(project.theme)}>
    {(page.logic?.effects || []).map(effect => <RuntimeEffect key={effect.id} effect={effect} state={state} dispatch={dispatch} />)}
    {pending > 0 && <div role="status">Working…</div>}
    {error && <div role="alert" className="fw-runtime-error">{error}</div>}
    {Object.keys(errors).length > 0 && <ul role="alert">{Object.entries(errors).map(([field, message]) => <li key={field}>{message}</li>)}</ul>}
    {page.layout.map(node => <RuntimeNode key={node.id} node={node} registry={registry} context={context} dispatch={dispatch} navigate={navigate} pages={project.pages} />)}
  </div>;
}

export default function Runtime({ project, registry, handlers = {}, initialPageId, onNavigate, allowNetwork = true }) {
  const routePage = () => project.pages.find(p => p.path === window.location.hash.slice(1))?.id || project.pages.find(p => p.isHome)?.id || project.pages[0].id;
  const [activeId, setActiveId] = useState(initialPageId || routePage);
  const navigate = useCallback(id => {
    const destination = project.pages.find(p => p.id === id);
    if (!destination) throw new Error(`Page not found: ${id}`);
    setActiveId(id);
    if (onNavigate) onNavigate(id);
    else window.location.hash = destination.path;
  }, [onNavigate, project.pages]);
  useEffect(() => {
    if (initialPageId) setActiveId(initialPageId);
  }, [initialPageId]);
  useEffect(() => {
    if (onNavigate) return;
    const onHash = () => setActiveId(project.pages.find(p => p.path === window.location.hash.slice(1))?.id || '__not_found__');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [project.pages, onNavigate]);
  const page = project.pages.find(p => p.id === activeId);
  if (!page) return <div role="alert">Page not found.</div>;
  return <RuntimeBoundary key={page.id}><RuntimePage page={page} project={project} registry={registry} handlers={handlers} navigate={navigate} allowNetwork={allowNetwork} /></RuntimeBoundary>;
}

