const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
export const tokenVariable = (name) => `--fw-${Array.from(name).map(c => /[a-zA-Z0-9-]/.test(c) ? c : `_${c.codePointAt(0).toString(16)}_`).join('')}`;
const inferType = (name, value) => /color|background|fill|stroke/i.test(name) || /^#|^rgb|^hsl/.test(String(value)) ? 'color' : /font.?family/i.test(name) ? 'fontFamily' : /weight/i.test(name) ? 'fontWeight' : /size|space|gap|radius|width|height|padding|margin/i.test(name) ? 'dimension' : 'string';

export function normalizeTheme(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Theme must be an object.');
  const source = input.tokens ?? input;
  const tokens = {};
  function visit(group, path = [], inherited) {
    for (const [key, value] of Object.entries(group)) {
      if (key.startsWith('$')) continue;
      if (forbidden.has(key)) throw new Error('Invalid token name.');
      const name = [...path, key].join('.');
      if (value && typeof value === 'object' && !Array.isArray(value) && !('$value' in value) && !('value' in value)) visit(value, [...path, key], value.$type ?? inherited);
      else {
        const raw = value && typeof value === 'object' && !Array.isArray(value) ? value.$value ?? value.value : value;
        tokens[name] = { type: value?.$type ?? value?.type ?? inherited ?? inferType(name, raw), value: raw };
      }
    }
  }
  visit(source, [], source.$type);
  if (Object.keys(tokens).length > 2000) throw new Error('A theme can contain at most 2,000 tokens.');
  const theme = { name: input.tokens ? input.name || 'Imported theme' : 'Imported theme', tokens };
  for (const key of Object.keys(tokens)) resolveToken(theme, key);
  return theme;
}

export function resolveToken(theme, name, trail = []) {
  const token = theme?.tokens?.[name];
  if (!token) throw new Error(`Missing theme token: ${name}`);
  if (trail.includes(name)) throw new Error(`Circular theme alias: ${[...trail, name].join(' → ')}`);
  let value = token.value;
  if (typeof value === 'string' && /^\{[^{}]+\}$/.test(value)) return resolveToken(theme, value.slice(1, -1), [...trail, name]);
  if (token.type === 'dimension' && value && typeof value === 'object') {
    if (!Number.isFinite(value.value) || !['px', 'rem', 'em', '%', 'vh', 'vw'].includes(value.unit)) throw new Error(`Invalid dimension: ${name}`);
    value = `${value.value}${value.unit}`;
  }
  if (token.type === 'color' && value && typeof value === 'object') {
    if (value.colorSpace !== 'srgb' || !Array.isArray(value.components) || value.components.length !== 3 || value.components.some(c => typeof c !== 'number' || c < 0 || c > 1)) throw new Error(`Only sRGB color objects are supported: ${name}`);
    value = `rgb(${value.components.map(c => Math.round(c * 255)).join(' ')} / ${value.alpha ?? 1})`;
  }
  if (token.type === 'fontFamily' && Array.isArray(value)) value = value.map(v => JSON.stringify(v)).join(', ');
  if (!['string', 'number'].includes(typeof value)) throw new Error(`Unsupported token value: ${name}`);
  if (/[;{}<>]|url\s*\(|expression\s*\(/i.test(String(value))) throw new Error(`Invalid CSS token value: ${name}`);
  return value;
}

export function parseThemeFile(text, filename = '') {
  if (text.length > 2_000_000) throw new Error('Theme file exceeds 2 MB.');
  if (/\.css$/i.test(filename) || text.trim().startsWith(':root')) {
    const clean = text.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const match = clean.match(/^:root\s*\{([^{}]*)\}\s*$/);
    if (!match) throw new Error('Use a single :root block containing CSS variables only.');
    const tokens = {};
    for (const declaration of match[1].split(';').filter(s => s.trim())) {
      const item = declaration.match(/^\s*(--[\w-]+)\s*:\s*(.+)\s*$/);
      if (!item) throw new Error('Theme CSS can contain custom property declarations only.');
      const [, key, value] = item;
      tokens[key] = { type: inferType(key, value), value: value.trim().replace(/var\((--[\w-]+)\)/g, '{$1}') };
    }
    return normalizeTheme({ name: filename || 'CSS theme', tokens });
  }
  return normalizeTheme(JSON.parse(text));
}

export function themeVariables(theme) {
  return Object.fromEntries(Object.keys(theme?.tokens || {}).flatMap(name => {
    const value = resolveToken(theme, name);
    return [[tokenVariable(name), value], ...(name.startsWith('--') ? [[name, value]] : [])];
  }));
}

export const themeCSS = (theme) => `.fw-page {${Object.entries(themeVariables(theme)).map(([key, value]) => `${key}:${value};`).join('')}}`;
export const defaultTheme = { name: 'Framewright', tokens: {
  'color.brand': { type: 'color', value: '#2563eb' },
  'color.text': { type: 'color', value: '#172033' },
  'color.surface': { type: 'color', value: '#ffffff' },
  'space.md': { type: 'dimension', value: '16px' },
  'space.lg': { type: 'dimension', value: '32px' },
  'radius.md': { type: 'dimension', value: '8px' },
  'font.body': { type: 'fontFamily', value: 'Inter, Segoe UI, sans-serif' },
  'font.size.body': { type: 'dimension', value: '16px' },
} };
