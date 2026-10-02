import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle as embeddedDrizzle } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import { migrate as migratePostgres } from 'drizzle-orm/node-postgres/migrator';
import { migrate as migrateEmbedded } from 'drizzle-orm/pglite/migrator';
import { fileURLToPath } from 'node:url';
import * as schema from './schema.js';
export type Database = NodePgDatabase<typeof schema>;
// SQL schemas and services are shared; only the connection adapter differs in local development.
export async function connectDatabase(url: string) {
  const migrationsFolder = fileURLToPath(new URL('../../../migrations', import.meta.url));
  // tsx source runs one directory closer to the package root than compiled output.
  const sourceFolder = fileURLToPath(new URL('../../migrations', import.meta.url));
  const { existsSync } = await import('node:fs');
  const folder = existsSync(sourceFolder) ? sourceFolder : migrationsFolder;
  if (url.startsWith('pglite://')) {
    const directory = url.slice('pglite://'.length);
    if (directory) await (await import('node:fs/promises')).mkdir(directory, { recursive: true });
    const client = new PGlite(directory || undefined);
    await client.waitReady;
    const db = embeddedDrizzle(client, { schema });
    return { db: db as unknown as Database, migrate: () => migrateEmbedded(db, { migrationsFolder: folder }), close: () => client.close() };
  }
  const client = new Pool({ connectionString: url, max: 10 });
  const db = drizzle(client, { schema });
  return { db, migrate: async () => {
    const lock = await client.connect();
    try { await lock.query("SELECT pg_advisory_lock(824081)"); await migratePostgres(db, { migrationsFolder: folder }); }
    finally { await lock.query('SELECT pg_advisory_unlock(824081)'); lock.release(); }
  }, close: () => client.end() };
}
