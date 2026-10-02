# Framewright platform

TypeScript/Fastify modular backend. Node 22.12+ is required. Design, security decisions and migration stories are in [SAAS_FOUNDATION.md](../docs/SAAS_FOUNDATION.md).

## Run locally

From `server/`:

```powershell
npm ci
Copy-Item .env.example .env
npm run db:migrate
npm run dev
```

In another terminal, from the repository root:

```powershell
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api/v1` to port 3002. Use the exact origin in `APP_ORIGIN`; `localhost` and `127.0.0.1` are different origins. Restart the API after changing `.env`. The API binds to loopback by default.

Development uses a persistent embedded PostgreSQL database in `server/.data/postgres`. Only one process can own that development database. Registration works immediately. Account emails are written to ignored JSON files in `server/.data/mail`; open the `url` from the latest matching file to verify or reset an account. These files contain sensitive single-use links: keep them local and remove expired development mail. No email is transmitted in file mode. There is no built-in test login or authentication bypass.

## Google configuration

Create a Google OAuth **Web application** client with the callback:

`http://localhost:5173/api/v1/auth/google/callback`

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `server/.env`, configure the consent screen/test users, then restart the server. Production uses the same path under the HTTPS `APP_ORIGIN`. Google remains visibly disabled until configured. Secrets never belong in Vite-prefixed variables or frontend code.

The Google adapter uses discovery, authorization code, S256 PKCE, state, nonce and ID-token signature verification. Matching email alone never links accounts. Sign in using the existing method, verify the local email, then use **Account settings → Connect Google** within ten minutes of authenticating.

## Production

1. Provision PostgreSQL, backups and a TLS connection according to the database provider. Set `DATABASE_URL` and apply `npm run db:migrate` as a release step. SQL migrations are committed; startup does not mutate schemas. The migrator uses a PostgreSQL advisory lock.
2. Set `NODE_ENV=production`, an HTTPS `APP_ORIGIN`, a random `RATE_LIMIT_SECRET`, `MAIL_MODE=smtp`, `MAIL_FROM` and SMTP settings. SMTP requires TLS. Use a deployment secret manager. PGlite and file email are rejected in production.
3. Run `npm ci`, `npm run build`, then `npm start`. API listens on loopback unless `HOST` is deliberately changed. Route `/api/v1/*` from the SPA's HTTPS origin to this service. Expose `/api/health` and `/api/ready` only as required by your infrastructure.
4. Enable `TRUST_PROXY=true` only if the API is reachable exclusively through a trusted proxy that sanitizes forwarded headers. IP limits otherwise use the socket address. Apply edge request limits/body limits as well as the database-backed application limits.
5. Configure Google with the production callback and complete real-provider staging checks. Verify SMTP delivery, TLS/cookie flags, backup restoration and session rotation against the deployed origin before release.
6. Run `npm run db:cleanup` periodically to remove expired auth records. It retains refresh generations until their absolute session expiration so replay detection remains effective.
7. Serve the SPA with `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, HSTS after HTTPS rollout and a tested CSP. The existing editor uses workers, WebAssembly and an iframe preview, so test a report-only policy against those features before enforcement. Do not grant arbitrary remote scripts access to the application origin.

Do not deploy the old `backend/server.js` prototype or forward its routes. Its file data remains available for explicit migration. Active editor variants continue to work in per-user local caches; the public platform does not expose unowned legacy variants/projects/components. Projects remain browser-local in this delivery; authentication does not claim to provide cloud project sync. Existing device work is copied only when the signed-in user chooses **Copy existing projects**; the original browser key remains intact.

## Checks

```powershell
npm run build
npm test
npm audit --omit=dev
```

API tests use fresh in-memory embedded PostgreSQL and the actual SQL migrations. OIDC tests use generated signing keys and mocked provider HTTP responses; they do not contact Google. The frontend has additional auth-state, protected-route, refresh and storage migration tests. Run root `npm test` and `npm run build` as regressions.

Live Google, a real SMTP provider and a production PostgreSQL deployment require operator configuration. Local automated tests do not substitute for those staging checks or an independent security review.

## API overview

All responses use `{ data }` or `{ error: { code, message }, requestId }` and `Cache-Control: no-store`.

| Endpoint | Purpose |
|---|---|
| GET `/api/v1/auth/config` | Available providers and development mail mode |
| GET `/api/v1/auth/session` | Restore user from access cookie |
| POST `/api/v1/auth/register`, `/login`, `/logout`, `/refresh` | Account and session lifecycle |
| POST `/api/v1/auth/forgot-password`, `/reset-password`, `/verify-email`, `/resend-verification` | Expiring, single-use email actions |
| POST `/api/v1/auth/google/start`, `/google/link` | Initiate browser-bound Google login/link |
| GET `/api/v1/auth/google/callback` | Validate and consume OIDC callback |
| GET/PATCH `/api/v1/account` | Read/update public profile |
| POST `/api/v1/account/password` | Change password and revoke sessions |
| GET `/api/v1/account/sessions` | List owned devices |
| DELETE `/api/v1/account/sessions/:id` | Revoke owned session |
| POST `/api/v1/account/sessions/revoke-others` | Revoke all other devices |

Mutating browser calls require the configured Origin, `X-Framewright-CSRF: 1` and `Content-Type: application/json`, including an empty `{}` for actions without fields. No wildcard CORS is enabled. Authorization is enforced on the server; frontend route guards only provide the UI experience.

### Operational limits

- Email-send failures are logged as a generic event without addresses or links; users can resend. Add a transactional encrypted outbox and delivery monitoring before requiring reliable high-volume email delivery.
- Local accounts can log in before email verification. The verified-user middleware gates identity linking and is available for future sensitive APIs.
- Account email change, MFA, recovery codes and account deletion are separate future workflows. No unsafe placeholder endpoints are exposed.
- Simultaneous refresh with a reused old token fails closed and revokes that device session. The browser client uses single-flight plus Web Locks to avoid normal multi-tab races. Browsers without Web Locks can require signing in again under a cross-tab refresh race.
# Render deployment

Use the repository's `render.yaml` and [deployment guide](../docs/DEPLOY_RENDER.md). Production serves the built frontend and API together. `APP_ORIGIN` defaults to Render's assigned HTTPS URL; set it explicitly for a custom domain.
