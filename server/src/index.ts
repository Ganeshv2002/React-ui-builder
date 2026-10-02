import 'dotenv/config';
import { loadConfig } from './config.js';
import { connectDatabase } from './db/connection.js';
import { buildApp } from './app.js';
const config = loadConfig();
const connection = await connectDatabase(config.DATABASE_URL);
const app = await buildApp(config, { db: connection.db });
app.addHook('onClose', async () => { await connection.close(); });
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void app.close(); });
try { await app.listen({ host: config.HOST, port: config.PORT }); }
catch { app.log.error('Server startup failed. Check configuration, migrations and port availability.'); await app.close(); process.exitCode = 1; }
