import { z } from 'zod';
import { defaultTheme, normalizeTheme, resolveToken } from './theme.js';

const json = z.json();
const record = z.record(z.string(), json);
const key = z.string().min(1).max(160);
const action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('setState'), path: key, value: json }).strict(),
  z.object({ type: z.literal('request'), resource: key, assignTo: key.optional() }).strict(),
  z.object({ type: z.literal('navigate'), pageId: key }).strict(),
  z.object({ type: z.literal('validate'), rules: key.optional() }).strict(),
  z.object({ type: z.literal('custom'), handler: key, args: json.optional() }).strict(),
]);
export const logicSchema = z.object({
  state: record.default({}),
  resources: z.record(z.string(), z.object({ url: z.string().min(1), method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'), headers: z.record(z.string(), z.string()).default({}), body: json.optional(), response: z.enum(['json', 'text']).default('json') }).strict()).default({}),
  actions: z.record(z.string(), z.array(action).max(100)).default({}),
  effects: z.array(z.object({ id: key, on: z.enum(['mount', 'change']), watch: z.array(key).default([]), actions: z.array(key) }).strict()).default([]),
  validation: z.record(z.string(), z.array(z.object({ field: key, rule: z.enum(['required', 'email', 'minLength', 'maxLength', 'min', 'max']), value: z.number().optional(), message: z.string().optional() }).strict())).default({}),
}).strict();
export const behaviorSchema = z.object({
  bindings: record.optional(),
  events: z.partialRecord(z.enum(['click', 'change', 'submit', 'blur']), z.array(key)).optional(),
  visibleWhen: json.optional(),
}).strict();
export const nodeSchema = z.lazy(() => z.object({
  id: key, type: key, contractVersion: z.number().int().positive().default(1),
  props: record.default({}), children: z.array(nodeSchema).optional(),
  bindings: record.optional(), events: behaviorSchema.shape.events,
  visibleWhen: json.optional(),
}).catchall(json));
export const projectSchema = z.object({
  format: z.literal('framewright'), schemaVersion: z.literal(1),
  name: z.string().default('Untitled project'),
  theme: z.object({ name: z.string(), tokens: z.record(z.string(), z.object({ type: z.string(), value: json }).strict()) }).strict(),
  pages: z.array(z.object({ id: key, name: key, path: z.string().startsWith('/'), isHome: z.boolean().optional(), layout: z.array(nodeSchema), logic: logicSchema.optional() }).catchall(json)).min(1).max(200),
}).catchall(json);

export function parseProject(value) {
  let data = typeof value === 'string' ? JSON.parse(value) : value;
  const serialized = JSON.stringify(data);
  if (serialized.length > 5_000_000) throw new Error('Project exceeds 5 MB.');
  JSON.parse(serialized, (k, v) => { if (['__proto__', 'prototype', 'constructor'].includes(k)) throw new Error(`Unsafe key: ${k}`); return v; });
  // Legacy builder backups had a pages array but no format/version.
  if (data && !data.format && !data.schemaVersion && Array.isArray(data.pages)) data = { ...data, format: 'framewright', schemaVersion: 1, theme: data.theme || defaultTheme };
  const project = projectSchema.parse(data);
  project.theme = normalizeTheme(project.theme);
  const checkTokens = value => {
    if (!value || typeof value !== 'object') return;
    if ('$token' in value) resolveToken(project.theme, value.$token);
    Object.values(value).forEach(checkTokens);
  };
  checkTokens(project.pages);
  const ids = new Set(), paths = new Set();
  for (const page of project.pages) {
    if (ids.has(page.id) || paths.has(page.path)) throw new Error('Page IDs and routes must be unique.');
    if (!/^\/(?!\/)[^?#]*$/.test(page.path)) throw new Error(`Invalid route: ${page.path}`);
    ids.add(page.id); paths.add(page.path);
    const nodeIds = new Set();
    function visit(nodes, depth = 0) {
      if (depth > 60) throw new Error('Layout nesting exceeds 60 levels.');
      for (const node of nodes) {
        if (nodeIds.has(node.id)) throw new Error(`Duplicate component ID: ${node.id}`);
        nodeIds.add(node.id);
        for (const actions of Object.values(node.events || {})) for (const name of actions) if (!page.logic?.actions?.[name]) throw new Error(`Unknown action: ${name}`);
        visit(node.children || [], depth + 1);
      }
    }
    visit(page.layout);
    for (const effect of page.logic?.effects || []) {
      if (effect.on === 'change' && !effect.watch.length) throw new Error(`Effect ${effect.id} needs watched state paths.`);
      for (const name of effect.actions) if (!page.logic.actions[name]) throw new Error(`Unknown effect action: ${name}`);
      for (const name of effect.actions) for (const step of page.logic.actions[name]) {
        const target = step.type === 'setState' ? step.path : step.type === 'request' ? step.assignTo : null;
        if (effect.on === 'change' && target && effect.watch.some(path => path === target || target.startsWith(`${path}.`) || path.startsWith(`${target}.`))) throw new Error(`Effect ${effect.id} cannot write to its own watched state.`);
      }
    }
    const effectIds = (page.logic?.effects || []).map(e => e.id);
    if (new Set(effectIds).size !== effectIds.length) throw new Error('Effect IDs must be unique within a page.');
    for (const rules of Object.values(page.logic?.validation || {})) for (const rule of rules) {
      if (['min', 'max', 'minLength', 'maxLength'].includes(rule.rule) && !Number.isFinite(rule.value)) throw new Error(`Validation ${rule.field}.${rule.rule} needs a numeric value.`);
    }
    for (const steps of Object.values(page.logic?.actions || {})) for (const step of steps) {
      if (step.type === 'request' && !page.logic.resources[step.resource]) throw new Error(`Unknown resource: ${step.resource}`);
      if (step.type === 'navigate' && !project.pages.some(p => p.id === step.pageId)) throw new Error(`Unknown destination: ${step.pageId}`);
      if (step.type === 'validate' && !page.logic.validation[step.rules || 'default']) throw new Error(`Unknown validation group: ${step.rules || 'default'}`);
    }
  }
  return project;
}

export function createProject(pages, theme = defaultTheme, metadata = {}) {
  return parseProject({ ...metadata, format: 'framewright', schemaVersion: 1, name: metadata.name || 'My app', theme, pages });
}
export const projectJSONSchema = () => z.toJSONSchema(projectSchema);
