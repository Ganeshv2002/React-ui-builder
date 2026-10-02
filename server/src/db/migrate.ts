import 'dotenv/config';
import { loadConfig } from '../config.js';
import { connectDatabase } from './connection.js';
const connection = await connectDatabase(loadConfig().DATABASE_URL);
try { await connection.migrate(); console.log('Database migrations applied.'); }
finally { await connection.close(); }
