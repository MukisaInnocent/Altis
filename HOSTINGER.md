# Hostinger deployment — Single service (backend serves frontend)

The app runs as a **single Node.js service** at `altistravels.com`.
The Express backend serves the built React frontend as static files,
so you only need one Hostinger Node.js application.

---

## 1. Deploy the backend

1. Upload the entire repository root (or at minimum the `backend` directory) to a private folder, for example `~/apps/altis-voyage`.
2. In hPanel, open **Advanced > Node.js** and create an application with:
   - **Node version:** 20.x or 22.x
   - **Application mode:** Production
   - **Application root:** `~/apps/altis-voyage/backend`
   - **Application startup file:** `src/server.js`
   - **Application URL:** `https://altistravels.com`
3. Install dependencies from the backend directory:

   ```bash
   npm ci --omit=dev --loglevel=error
   ```

4. Add these environment variables in the Node.js application settings:

   ```env
   NODE_ENV=production
   HOST=0.0.0.0
   JWT_SECRET=generate-a-long-random-secret
   ADMIN_USER=choose-an-admin-username
   ADMIN_PASS=choose-a-strong-password
   CLIENT_ORIGIN=https://altistravels.com
   DATA_ROOT=/home/USERNAME/apps/altis-voyage/backend/data
   IMAGES_ROOT=/home/USERNAME/apps/altis-voyage/backend/images
   DB_PATH=/home/USERNAME/apps/altis-voyage/backend/data/altis.db
   STATIC_ROOT=/home/USERNAME/apps/altis-voyage/backend/frontend/dist
   ```

   > Replace `USERNAME` with your actual Hostinger SSH username.
   > Leave `PORT` unset — Hostinger injects it automatically.

5. Restart the Node.js application and verify:

   ```text
   https://altistravels.com/health   → {"ok":true}
   https://altistravels.com          → React site loads
   https://altistravels.com/admin    → Admin login page
   ```

---

## 2. Build the frontend locally

The frontend must be built **before uploading**, because `VITE_API_URL`
is embedded at build time. With the single-service setup, leave it empty:

```powershell
cd backend/frontend
npm ci
npm run build
```

The output is `backend/frontend/dist`. Upload this entire folder to the server at
the path set in `STATIC_ROOT` above.

---

## 3. Upload

Upload to Hostinger via SSH, SFTP, or the File Manager:

```text
~/apps/altis-voyage/
  backend/          ← Node.js app root (server.js, package.json, src/, data/, images/)
    frontend/
      dist/           ← Built React app (index.html, assets/, .htaccess, etc.)
```

> **Important:** The `.htaccess` file in `backend/frontend/dist` is only needed when serving
> via Apache. With the Node.js SPA fallback in `server.js`, it is not required —
> but leaving it there does no harm.

---

## 4. Final checks

- `https://altistravels.com/health` returns `{"ok":true}`.
- `https://altistravels.com` shows the Altis Voyage React site.
- `https://altistravels.com/admin` shows the admin login.
- Submit a test enquiry and confirm it appears in the admin panel.
- Change the admin password immediately after the first login.
- Keep backups of `data/altis.db` and the `images/` directory.

---

## Troubleshooting

### Site shows "Cannot GET /"
- The `STATIC_ROOT` env var path is wrong, or `backend/frontend/dist` was not uploaded.
- Check the Node.js app logs in hPanel.

### API calls fail (CORS or 404)
- Ensure `CLIENT_ORIGIN=https://altistravels.com` is set.
- Check that `STATIC_ROOT` points to the correct `dist` folder.

### better-sqlite3 install warning
The `prebuild-install` deprecation warning is non-fatal. These lines confirm success:
```
added 130 packages
found 0 vulnerabilities
```

### Node.js app still marked failed
- Startup file must be exactly `src/server.js` (not `index.js`).
- Node version must be 20.x or 22.x.
- `PORT` must be **unset** so Hostinger injects it.
