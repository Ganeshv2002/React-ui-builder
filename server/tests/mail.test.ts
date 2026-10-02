import { afterEach, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config.js';
import { createMailer } from '../src/shared/mail.js';

afterEach(() => vi.unstubAllGlobals());
const config = () => loadConfig({ MAIL_MODE: 'resend', RESEND_API_KEY: 'test-key', MAIL_FROM: 'sender@example.test' });
it('sends verification and reset links over HTTPS with a bounded request', async () => {
  const send = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', send);
  for (const purpose of ['verify', 'reset'] as const) {
    await createMailer(config()).send({ to: 'user@example.test', purpose, url: 'https://app.example/#/verify?token=test' });
    const [url, options] = send.mock.calls.at(-1)!;
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.headers.Authorization).toBe('Bearer test-key');
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(options.body)).toMatchObject({ from: 'sender@example.test', to: ['user@example.test'],
      subject: purpose === 'verify' ? 'Verify your Framewright email' : 'Reset your Framewright password' });
  }
});
it('fails on provider rejection without exposing its response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private recipient details', { status: 403 })));
  await expect(createMailer(config()).send({ to: 'user@example.test', purpose: 'reset', url: 'https://app.example' })).rejects.toThrow('Account email delivery failed.');
});
it('requires an API key and accepts HTTPS delivery in production', () => {
  expect(() => loadConfig({ MAIL_MODE: 'resend' })).toThrow('RESEND_API_KEY');
  expect(loadConfig({ NODE_ENV: 'production', APP_ORIGIN: 'https://app.example', DATABASE_URL: 'postgresql://db/app',
    RATE_LIMIT_SECRET: 'x'.repeat(32), MAIL_MODE: 'resend', RESEND_API_KEY: 'test-key' }).MAIL_MODE).toBe('resend');
});
