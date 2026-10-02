import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection.js';
import { rateLimits } from '../db/schema.js';
import { privateKey } from './crypto.js';
import { AppError } from './errors.js';
export function createRateLimiter(db: Database, secret: string, now = () => new Date()) {
  return async (subject: string, limit: number, windowSeconds = 900) => {
    const time = +now(), bucket = Math.floor(time / (windowSeconds * 1000));
    const key = privateKey(`${subject}:${bucket}`, secret);
    const [record] = await db.insert(rateLimits).values({ key, count: 1, expiresAt: new Date((bucket + 1) * windowSeconds * 1000) })
      .onConflictDoUpdate({ target: rateLimits.key, set: { count: sql`${rateLimits.count} + 1` } }).returning({ count: rateLimits.count });
    if (!record || record.count > limit) throw new AppError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.');
  };
}
