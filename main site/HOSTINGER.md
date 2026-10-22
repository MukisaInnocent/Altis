# Hostinger deployment

Create a Hostinger Node.js application with these settings:

```text
Application root: main site
Node.js version: 20 or newer
Build command: npm run build
Start command: npm start
Application port: use the PORT value provided by Hostinger
```

If Hostinger shows a separate **Application startup file** field, set it to `src/server.js` or `hostinger-start.cjs`. Both files now launch the Next.js app. If Hostinger provides a start-command field, use `npm start` instead.

Set these environment variables in Hostinger before the first start. The repository includes `.env.example` as a template; copy its names into Hostinger and replace the values there:

```text
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=use-a-long-random-password
DB_HOST=auth-db657.hstgr.io
DB_PORT=3306
DB_ACCOUNT_PREFIX=u989298385
DB_NAME=Altis
DB_USER=mukisa
DB_PASSWORD=your-hostinger-database-password
```

Use `DB_HOST=auth-db657.hstgr.io`. The earlier `Access denied` response proved this is the reachable MySQL server. The prefixed database and user names remain required: `u989298385_Altis` and `u989298385_mukisa`.

The app expands `DB_NAME=Altis` and `DB_USER=mukisa` to Hostinger's prefixed names `u989298385_Altis` and `u989298385_mukisa`. You can also enter the fully prefixed names directly.

When `DB_HOST` is present, the application uses MySQL, creates the tables automatically, and seeds the database when the destinations table is empty. When `DB_HOST` is absent, it falls back to SQLite for local development. The MySQL application and database should use the same Hostinger account/region. The `uploads/` directory must be writable if media uploads are enabled later.

Database access is intentionally not attempted during `npm install`. After correcting the environment variables, rebuild and restart the application; startup will then create the tables and seed the records. Rotate the database password if it has been shared anywhere outside Hostinger.

After deployment, open `/admin/login.html` and sign in with the configured credentials. Do not use the local fallback credentials in production.

For later content changes, use the admin dashboard. Run `npm run seed` only when intentionally restoring the initial seed content.

## Optional variables (October 2026 upgrade)

```text
SITE_URL=https://altistravels.com
GA_MEASUREMENT_ID=G-XXXXXXXXXX        # Google Analytics 4, leave empty until the property exists
META_PIXEL_ID=123456789012345          # Meta Pixel, leave empty until needed
GOOGLE_SITE_VERIFICATION=abc123...     # Search Console "HTML tag" token (content value only)
```

Tracking scripts load only after a visitor accepts the cookie banner, and the banner only appears once an ID is set. Events never include names, phone numbers, emails or enquiry text.

## How pages are served

Public pages are rendered on the server by `pages/api/[...path].js` (code in `src/site/`). `next.config.mjs` rewrites clean URLs such as `/packages`, `/flights` and `/blog/<slug>` to it, and permanently redirects the old `/store.html`, `/inquiry.html`, `/destinations.html` and `/index.html` addresses. `/sitemap.xml` is generated from the database; `/robots.txt` is in `public/`.

`/api/health` now shows only `ok`, the driver and row counts to the public. Sign in to the dashboard first to see connection details there.

## Database changes on first start

Startup is additive and safe to repeat. No existing table, column or row is modified or removed.

- New tables: `offers`, `posts`, `opportunities`, `faqs`.
- New columns: `inquiries.reference`, `service`, `details`, `package_id`, `admin_notes`; `testimonials.approved` (default 1, so existing reviews stay visible), `verified_booking`, `inquiry_id`.
- Starter FAQs are inserted if `faqs` is empty; two blog articles are inserted **unpublished** if `posts` is empty.
- Site content is now inserted only when a key is missing, so dashboard edits survive restarts (previously the seed overwrote `hero`, `about` and `contact` on every start). Two one-off upgrades run once and are recorded in the `_applied_upgrades` key: the confirmed contact details (+256 774 497 295, Room 342 address) and the new homepage headline (only if the old starter headline was still in place).

## Deploying this upgrade safely

1. In hPanel > Databases > phpMyAdmin, export a full backup of `u989298385_Altis`.
2. Deploy the code, run `npm run build`, then restart the app.
3. Check the startup log for `added columns: ...`, then open `/api/health`, `/`, `/packages`, `/flights`, `/sitemap.xml` and the dashboard.
4. Submit one test enquiry, find it under **Enquiries** in the dashboard, then delete it.

## Rollback

1. Redeploy the previous commit (`cbd6afb`) and restart. The old code ignores the new tables and columns, so it runs against the upgraded database unchanged. Note that the old code rewrites the `hero`, `about` and `contact` site content on every start, so the old contact numbers return until the upgrade is redeployed.
2. Restore the database backup only if data was damaged; the upgrade itself does not change existing rows apart from the two content upgrades above, which can be re-edited in the dashboard.