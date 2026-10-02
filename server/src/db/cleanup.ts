import 'dotenv/config';
import { lt } from 'drizzle-orm';
import { loadConfig } from '../config.js';
import { connectDatabase } from './connection.js';
import { accountTokens, oauthTransactions, rateLimits, sessions } from './schema.js';
const c = await connectDatabase(loadConfig().DATABASE_URL);
try {
  const now = new Date();
  await c.db.transaction(async tx => {
    await tx.delete(accountTokens).where(lt(accountTokens.expiresAt, now));
    await tx.delete(oauthTransactions).where(lt(oauthTransactions.expiresAt, now));
    await tx.delete(rateLimits).where(lt(rateLimits.expiresAt, now));
    await tx.delete(sessions).where(lt(sessions.expiresAt, now));
  });
  console.log('Expired authentication records removed.');
} finally { await c.close(); }
