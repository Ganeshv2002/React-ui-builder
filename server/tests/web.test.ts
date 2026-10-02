import { expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { connectDatabase } from '../src/db/connection.js';

it('serves the built SPA and its assets alongside protected APIs', async () => {
  const connection = await connectDatabase('pglite://');
  await connection.migrate();
  const app = await buildApp(loadConfig({ NODE_ENV: 'test', SERVE_WEB: 'true' }), { db: connection.db });
  try {
    const page = await app.inject('/');
    expect(page.statusCode).toBe(200);
    expect(page.headers['content-type']).toContain('text/html');
    const asset = page.body.match(/src="(\/assets\/[^" ]+\.js)"/)?.[1];
    expect(asset).toBeTruthy();
    expect((await app.inject(asset!)).statusCode).toBe(200);
    expect((await app.inject('/api/v1/account')).statusCode).toBe(401);
    expect((await app.inject('/api/v1/missing')).statusCode).toBe(404);
    expect((await app.inject('/assets/missing.js')).statusCode).toBe(404);
    expect((await app.inject('/.env')).statusCode).toBe(403);
    expect((await app.inject('/api/ready')).statusCode).toBe(200);
  } finally { await app.close(); await connection.close(); }
});

it('uses Render origin unless a canonical custom origin is configured', () => {
  expect(loadConfig({ RENDER_EXTERNAL_URL: 'https://framewright-test.onrender.com' }).APP_ORIGIN).toBe('https://framewright-test.onrender.com');
  expect(loadConfig({ RENDER_EXTERNAL_URL: 'https://framewright-test.onrender.com', APP_ORIGIN: 'https://framewright.example' }).APP_ORIGIN).toBe('https://framewright.example');
});
