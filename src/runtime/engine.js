import { resolveToken } from './theme.js';

const safeParts = path => {
  const parts = String(path).split('.');
  if (parts.some(p => !p || ['__proto__', 'constructor', 'prototype'].includes(p))) throw new Error(`Invalid state path: ${path}`);
  return parts;
};
export const readPath = (value, path) => path === '' ? value : safeParts(path).reduce((v, k) => v != null && Object.hasOwn(Object(v), k) ? v[k] : undefined, value);
export function writePath(object, path, value) {
  const result = structuredClone(object), parts = safeParts(path);
  let target = result;
  parts.slice(0, -1).forEach(key => { if (!target[key] || typeof target[key] !== 'object') target[key] = {}; target = target[key]; });
  target[parts.at(-1)] = value;
  return result;
}
export function resolveValue(value, context) {
  if (Array.isArray(value)) return value.map(v => resolveValue(v, context));
  if (value && typeof value === 'object') {
    if ('$token' in value) return resolveToken(context.theme, value.$token);
    for (const source of ['state', 'event', 'result']) if (`$${source}` in value) return readPath(context[source], value[`$${source}`]);
    if ('$eq' in value) { const [a, b] = resolveValue(value.$eq, context); return a === b; }
    if ('$ne' in value) { const [a, b] = resolveValue(value.$ne, context); return a !== b; }
    if ('$gt' in value) { const [a, b] = resolveValue(value.$gt, context); return a > b; }
    if ('$lt' in value) { const [a, b] = resolveValue(value.$lt, context); return a < b; }
    if ('$not' in value) return !resolveValue(value.$not, context);
    if ('$and' in value) return value.$and.every(v => Boolean(resolveValue(v, context)));
    if ('$or' in value) return value.$or.some(v => Boolean(resolveValue(v, context)));
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveValue(v, context)]));
  }
  return value;
}
export function validateValues(rules, values) {
  const errors = {};
  for (const rule of rules) {
    const value = readPath(values, rule.field);
    const empty = value == null || value === '' || value === false;
    const invalid = rule.rule === 'required' ? empty : empty ? false
      : rule.rule === 'email' ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
      : rule.rule === 'minLength' ? String(value).length < rule.value
      : rule.rule === 'maxLength' ? String(value).length > rule.value
      : rule.rule === 'min' ? !Number.isFinite(Number(value)) || Number(value) < rule.value
      : rule.rule === 'max' ? !Number.isFinite(Number(value)) || Number(value) > rule.value : false;
    if (invalid) errors[rule.field] = rule.message || `${rule.field}: ${rule.rule} validation failed`;
  }
  return errors;
}

export function safeURL(value) {
  const text = String(value);
  if (!text || /^\s*(?:javascript|data|vbscript):/i.test(text)) throw new Error('Unsupported URL protocol.');
  const url = new URL(text, 'https://framewright.local');
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Only HTTP(S) URLs are supported.');
  return text;
}

// JSON describes intent. All executable functions remain in this runtime or registered handlers.
export async function runActions(names, logic, env, event = {}, signal) {
  let result;
  for (const name of names) {
    const steps = logic.actions?.[name];
    if (!steps) throw new Error(`Action not registered: ${name}`);
    for (const step of steps) {
      if (signal?.aborted) return;
      const context = { state: env.getState(), event, result, theme: env.theme };
      if (step.type === 'setState') env.setState(writePath(env.getState(), step.path, resolveValue(step.value, context)));
      else if (step.type === 'navigate') { env.navigate(step.pageId); return; }
      else if (step.type === 'validate') {
        const errors = validateValues(logic.validation?.[step.rules || 'default'] || [], { ...env.getState(), ...event.values });
        env.setErrors(errors);
        if (Object.keys(errors).length) return;
      } else if (step.type === 'request') {
        if (!env.allowNetwork) throw new Error('API requests are disabled in preview. Enable API calls to test this action.');
        const resource = logic.resources?.[step.resource];
        if (!resource) throw new Error(`Unknown resource: ${step.resource}`);
        // URL templates substitute state values as encoded URL parts, never executable expressions.
        const url = resource.url.replace(/\{state\.([^{}]+)\}/g, (_, path) => encodeURIComponent(readPath(context.state, path) ?? ''));
        const headers = { ...resource.headers };
        const body = resource.body === undefined ? undefined : JSON.stringify(resolveValue(resource.body, context));
        if (body && !Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
        const response = await (env.fetch || fetch)(safeURL(url), { method: resource.method || 'GET', headers, ...(resource.method !== 'GET' && body !== undefined ? { body } : {}), signal });
        if (!response.ok) throw new Error(`Request ${step.resource} failed (${response.status}).`);
        result = response.status === 204 ? null : resource.response === 'text' ? await response.text() : await response.json();
        if (signal?.aborted) return;
        if (step.assignTo) env.setState(writePath(env.getState(), step.assignTo, result));
      } else if (step.type === 'custom') {
        const handler = env.handlers?.[step.handler];
        if (!handler) throw new Error(`Handler not registered: ${step.handler}`);
        result = await handler(resolveValue(step.args, context), { ...env, event, signal });
      } else throw new Error(`Unsupported action type: ${step.type}`);
    }
  }
  return result;
}
