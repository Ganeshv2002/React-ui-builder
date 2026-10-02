import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { Config } from '../config.js';
export type AccountMail = { to: string; purpose: 'verify' | 'reset'; url: string };
export interface Mailer { send(message: AccountMail): Promise<void> }
export function createMailer(config: Config): Mailer {
  if (config.MAIL_MODE === 'file') return { async send(message) {
    await mkdir('.data/mail', { recursive: true });
    await writeFile(`.data/mail/${randomUUID()}.json`, JSON.stringify(message, null, 2), { mode: 0o600 });
  } };
  if (config.MAIL_MODE === 'resend') return { async send(message) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ from: config.MAIL_FROM, to: [message.to],
        subject: message.purpose === 'verify' ? 'Verify your Framewright email' : 'Reset your Framewright password',
        text: `${message.purpose === 'verify' ? 'Verify your email' : 'Reset your password'} using this single-use link:\n\n${message.url}\n\nIf you did not request this, ignore this email.` }),
    });
    // Never log provider response bodies: they can contain recipient or token data.
    if (!response.ok) { await response.body?.cancel(); throw new Error('Account email delivery failed.'); }
    await response.body?.cancel();
  } };
  const transport = nodemailer.createTransport({ host: config.SMTP_HOST, port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465, requireTLS: true,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
    connectionTimeout: 10000, socketTimeout: 15000, disableFileAccess: true, disableUrlAccess: true });
  return { async send(message) {
    await transport.sendMail({ from: config.MAIL_FROM, to: message.to,
      subject: message.purpose === 'verify' ? 'Verify your Framewright email' : 'Reset your Framewright password',
      text: `${message.purpose === 'verify' ? 'Verify your email' : 'Reset your password'} using this single-use link:\n\n${message.url}\n\nIf you did not request this, ignore this email.`,
    });
  } };
}
