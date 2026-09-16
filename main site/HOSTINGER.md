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
```

The `postinstall` script and application startup both initialize an empty SQLite database. Startup only seeds when the destinations table is empty, so normal restarts do not overwrite admin edits. The database is stored in `data/altis-voyage.sqlite`; make sure the `data/` directory is writable and persistent. The `uploads/` directory must also be writable if media uploads are enabled later.

After deployment, open `/admin/login.html` and sign in with the configured credentials. Do not use the local fallback credentials in production.

For later content changes, use the admin dashboard. Run `npm run seed` only when intentionally restoring the initial seed content.