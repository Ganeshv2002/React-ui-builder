import { parseProject, projectJSONSchema } from '../runtime/project.js';
const sources = import.meta.glob(['../runtime/*.{js,jsx,css}', '../components/*/*.{jsx,css}', '../utils/theme.css'], { query: '?raw', import: 'default', eager: true });

export function generateConfigApp(input) {
  const project = parseProject(input);
  const files = {};
  for (const [path, source] of Object.entries(sources)) {
    if (path.includes('/CustomComponentRenderer/') || path.includes('/ConditionBuilder/')) continue;
    if (/\/(Button|Input|Form|NavigationLink|Checkbox)\/[^/]+\.jsx$/.test(path)) continue;
    files[path === './theme.css' ? 'src/utils/theme.css' : `src/${path.replace(/^\.\.\//, '')}`] = source;
  }
  files['src/app.config.json'] = JSON.stringify(project, null, 2);
  files['app.schema.json'] = JSON.stringify(projectJSONSchema(), null, 2);
  files['package.json'] = JSON.stringify({ name: 'framewright-app', version: '1.0.0', private: true, type: 'module', scripts: { dev: 'vite --host 127.0.0.1', build: 'vite build', preview: 'vite preview' }, dependencies: { react: '^19.1.1', 'react-dom': '^19.1.1', zod: '^4.1.1', '@fortawesome/fontawesome-svg-core': '^7.0.0', '@fortawesome/free-solid-svg-icons': '^7.0.0', '@fortawesome/react-fontawesome': '^0.2.3' }, devDependencies: { vite: '^7.1.0', '@vitejs/plugin-react': '^4.7.0' } }, null, 2);
  files['index.html'] = '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Framewright App</title></head><body class="fw-artboard"><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>';
  files['vite.config.js'] = "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n";
  files['src/main.jsx'] = `import React from 'react';
import { createRoot } from 'react-dom/client';
import Runtime from './runtime/Runtime.jsx';
import { registry } from './runtime/registry.jsx';
import { parseProject } from './runtime/project.js';
import config from './app.config.json';
import { handlers } from './handlers.js';
import './utils/theme.css';
import './runtime/artboard.css';
import './app.css';
const project = parseProject(config);
createRoot(document.getElementById('root')).render(<Runtime project={project} registry={registry} handlers={handlers} />);
`;
  files['src/handlers.js'] = '// Register application-specific functions here. JSON refers to their IDs, never their code.\nexport const handlers = {};\n';
  files['src/app.css'] = 'body { margin: 0; font-family: Inter, "Segoe UI", sans-serif; }\n* { box-sizing: border-box; }\n.fw-page { min-height: 100vh; }\n.fw-runtime-error { padding: 12px; background: #fef2f2; color: #991b1b; }\n';
  files['README.md'] = `# ${project.name}\n\nRun npm install, then npm run dev. Build with npm run build.\n\n## Maintain the app\n\nReplace only src/app.config.json when you export JSON from Framewright. Keep your component implementations, src/runtime/registry.jsx adapters and src/handlers.js in this codebase. Do not overwrite your customized code with a new boilerplate ZIP.\n\nRoutes use URL hashes (#/about), so static hosting needs no rewrite rules. JSON includes all pages, theme tokens and declarative behavior. The runtime validates schema version 1 at startup.\n\nComponent IDs and public props form versioned contracts. Swap a component in registry.jsx without changing JSON. For a breaking prop change, increment the adapter version and implement migrate(props, fromVersion); keep migrations for supported versions. Missing adapters remain visible placeholders. Custom components and handlers must be implemented in code; imported JSON is never executed as JavaScript.\n\nResources run on explicit actions/effects. API URLs must be HTTP(S), relative URLs use the deployment origin, and CORS is enforced by the browser. Keep secrets and privileged API logic on your server.\n\nTheme import supports scalar tokens, dimensions, font families, sRGB objects and whole-token aliases. It is a documented subset, not full DTCG conformance.\n`;
  return files;
}
