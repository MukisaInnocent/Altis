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
DB_HOST=your-hostinger-mysql-host
DB_PORT=3306
DB_NAME=u989298385_Altis
DB_USER=u989298385_mukisa
DB_PASSWORD=your-hostinger-database-password
```

The current Hostinger defaults for this account are `auth-db657.hstgr.io`, `u989298385_Altis`, and `u989298385_mukisa`; set them explicitly in Hostinger even though the application has matching fallbacks. The password must be the current password for that prefixed MySQL user.

The Hostinger account prefix is required for both the database name and database username. The error `Access denied for user 'mukisa'` means the username is missing that prefix. Use the exact names shown in Hostinger; they are commonly `u989298385_Altis` and `u989298385_mukisa`.

When `DB_HOST` is present, the application uses MySQL, creates the tables automatically, and seeds the database when the destinations table is empty. When `DB_HOST` is absent, it falls back to SQLite for local development. The MySQL application and database should use the same Hostinger account/region. The `uploads/` directory must be writable if media uploads are enabled later.

Database access is intentionally not attempted during `npm install`. After correcting the environment variables, rebuild and restart the application; startup will then create the tables and seed the records. Rotate the database password if it has been shared anywhere outside Hostinger.

After deployment, open `/admin/login.html` and sign in with the configured credentials. Do not use the local fallback credentials in production.

For later content changes, use the admin dashboard. Run `npm run seed` only when intentionally restoring the initial seed content.