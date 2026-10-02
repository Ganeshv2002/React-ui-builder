# Deploy Framewright on Render

Deploy the repository branch `editor-revamp-json-projects`. The root `render.yaml` creates a **free** Node web service and **free, 30-day** PostgreSQL database in Singapore. Confirm both resources show Free before deploying. The Node service serves both the built React app and `/api/v1`; no separate static site is needed.

## 1. Prepare account email delivery

Create a Resend account at https://resend.com and create a sending API key. Set `RESEND_API_KEY` to that key and `MAIL_FROM` to a sender on your verified domain. Email is sent over HTTPS, which works on Render's free tier. Keep the key in Render's environment, never in Git or frontend variables.

For a personal test without a domain, set `MAIL_FROM=onboarding@resend.dev` and use your Resend account's own email when testing registration/reset. Resend's test domain only sends to the account owner; verify a domain before sending to other people. Google sign-in configuration is unchanged. Production still rejects file-based mail.

## 2. Create the Render deployment

1. Sign in at https://dashboard.render.com and select **New → Blueprint**.
2. Connect GitHub and select `Ganeshv2002/React-ui-builder`.
3. Select branch **editor-revamp-json-projects**, with **render.yaml** as the Blueprint path. Leave Root Directory empty.
4. Enter `RESEND_API_KEY` and `MAIL_FROM`. Confirm the web service and database both show **Free**, then deploy. If the previous paid Blueprint setup is still open, restart its setup so it reads the latest file. Changing this file alone does not downgrade already-created paid resources.
5. Render builds both packages, applies database migrations, and starts the web service. The database URL and rate-limit secret are supplied automatically.
6. Open the web service's assigned HTTPS URL. The server automatically uses Render's `RENDER_EXTERNAL_URL` as its app origin. Do not set an invented URL or add a trailing slash.
7. Confirm `/api/ready` returns `{"data":{"status":"ready"}}`. Register a test account, check its verification email, sign in, reload, open the editor, and sign out. Test password reset with a disposable account.

The Blueprint supplies these commands (also usable for manual Web Service setup):

```sh
# Build
npm ci --include=dev && npm run build && npm ci --prefix server --include=dev && npm run build --prefix server
# Start (free services have no pre-deploy command)
node server/dist/src/db/migrate.js && node server/dist/src/index.js
```

Manual setup additionally needs `NODE_VERSION=22`, `NODE_ENV=production`, `HOST=0.0.0.0`, `TRUST_PROXY=true`, `MAIL_MODE=resend`, `RESEND_API_KEY`, `MAIL_FROM`, a random secret of at least 32 characters as `RATE_LIMIT_SECRET`, and the database's internal connection URL as `DATABASE_URL`. Health check: `/api/ready`. Render supplies `PORT`. Leave the Pre-deploy Command empty.

Render's free web services sleep after inactivity, so the first request can be slow. Free PostgreSQL expires 30 days after creation. Export database data before that deadline if you want to preserve accounts. The Blueprint uses no paid compute plans. SMTP remains available for other hosting, but free Render blocks standard SMTP ports.

## 3. Configure Google OAuth

1. Open https://console.cloud.google.com/ and create/select a project for Framewright.
2. Open **Google Auth Platform** (or **APIs & Services → OAuth consent screen**). Configure Branding with app name **Framewright**, your support email and developer contact email. Configure **Audience → External** for public accounts, or Internal only for a Workspace-only app.
3. While testing, add your Google account under **Audience → Test users**. For public use, publish the app and complete any branding/domain checks Google requests. Use real homepage, privacy policy and terms URLs when requested; the repository does not supply production legal policies.
4. Under **Data Access**, request only `openid`, `email`, and `profile`. No Google Drive, Gmail, or other API permissions are needed.
5. Under **Clients → Create client**, choose **Web application** and name it **Framewright Web**.
6. Set the **Authorized redirect URI** to the exact assigned Render URL followed by `/api/v1/auth/google/callback`. Example (replace the hostname):

   ```text
   https://YOUR-SERVICE.onrender.com/api/v1/auth/google/callback
   ```

   The server uses the authorization-code flow. JavaScript origins are not required by this implementation. If you configure one, use only `https://YOUR-SERVICE.onrender.com`, without a path.

7. Copy the Client ID and Client Secret into the Render **web service → Environment**:

   ```text
   GOOGLE_CLIENT_ID=<client ID from Google>
   GOOGLE_CLIENT_SECRET=<client secret from Google>
   ```

   Save and redeploy. Never use a `VITE_` prefix for these secrets or commit them to Git.
8. Open Framewright and click **Continue with Google**. Confirm that it returns to the dashboard and that reload and sign-out work. Google sign-in stays disabled until both variables are configured.

For local development, preferably create a separate OAuth client with redirect URI `http://localhost:5173/api/v1/auth/google/callback`. Put its credentials in `server/.env`, set `APP_ORIGIN=http://localhost:5173`, and run Vite plus the server. Do not use `127.0.0.1` interchangeably with `localhost`.

For a custom domain, configure it and HTTPS in Render first, set `APP_ORIGIN=https://your-domain.example` (no trailing slash), and add that domain's exact callback URI in Google. Use that same domain for login, email links and the app. Export local projects before changing domains: browser storage is origin-specific.

### OAuth troubleshooting

- `redirect_uri_mismatch`: Google's saved URI must exactly match `APP_ORIGIN + /api/v1/auth/google/callback`, including scheme, hostname, path and slash usage.
- Access blocked while testing: add the signing-in Google account to the consent screen's test users and check the audience.
- Existing email/password account: sign in with password, verify its email, then connect Google in Account settings. Matching email addresses are deliberately not linked automatically.
- CSRF/origin error: access the canonical app origin; remove any stale `APP_ORIGIN` override or update it to your custom domain.
- Email missing: check the Resend API key, sender verification and recipient restrictions. Registration intentionally gives a generic response; inspect server delivery error logs and use resend verification.

## Data, operations and limits

- PostgreSQL stores accounts, identities, sessions and auth tokens. Projects and variants remain scoped to each account **in that browser**. They are not yet synced between devices. Back them up with JSON export.
- Deploy `server/`, not the older `backend/` prototype. The old prototype has no production account ownership model and is not exposed by this service.
- Free PostgreSQL does not provide managed backups: export it manually before expiry. On a paid plan, enable backups. Run `node server/dist/src/db/cleanup.js` periodically from an environment with database access to remove expired auth records; never delete unexpired refresh-token history because it detects replay.
- The CSP permits dynamic evaluation for the existing ONNX browser inference dependency and HTTPS model/API connections. A stricter policy requires isolating that feature first.
- Live Google, Resend delivery and Render PostgreSQL must be smoke-tested after credentials are supplied; local tests do not verify those external services.

References: [Render Blueprints](https://render.com/docs/blueprint-spec), [Render environment variables](https://render.com/docs/environment-variables), [free tier limits](https://render.com/docs/free), [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).
