import { createHash, createHmac, randomBytes } from 'node:crypto';
export const randomToken = () => randomBytes(32).toString('base64url');
export const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export const privateKey = (value: string, secret: string) => createHmac('sha256', secret).update(value).digest('hex');
