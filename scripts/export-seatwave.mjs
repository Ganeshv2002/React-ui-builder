import { createServer } from 'vite';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '../framewright-ticket-demo');
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { generateConfigApp } = await server.ssrLoadModule('/src/utils/configAppGenerator.js');
  const config = JSON.parse(await readFile(path.join(root, 'src/demos/seatwave.json'), 'utf8'));
  const files = generateConfigApp(config);
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(output, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  await writeFile(path.join(root, 'docs/schema/app.schema.json'), files['app.schema.json']);
  console.log('Exported Seatwave to ' + output);
} finally { await server.close(); }
