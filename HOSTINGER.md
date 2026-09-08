# Hostinger deployment

This project is deployed as two Hostinger services:

- **Frontend:** Vite static build uploaded to the domain's `public_html` directory.
- **Backend:** Express Node.js application created in Hostinger's Node.js App section, preferably on an API subdomain such as `api.example.com`.

Hostinger's Node.js application feature must be available on the selected hosting plan. If it is not available, use a VPS or host the backend on a Node-compatible service.

## 1. Deploy the backend

1. Upload the `backend` directory to a private folder outside `public_html`, for example `~/apps/altis-voyage-backend`.
2. In hPanel, open **Advanced > Node.js** and create an application with:
   - **Node version:** 20.x or 22.x
   - **Application mode:** Production
   - **Application root:** the uploaded `backend` directory
   - **Application startup file:** `src/server.js`
   - **Application URL:** an API subdomain such as `https://api.example.com`
3. Install dependencies from the backend directory:

   ```bash
   npm ci --omit=dev
   ```

   The backend pins `better-sqlite3` to a release with Linux prebuilt binaries for the supported Node versions. This avoids Hostinger's unavailable Python/node-gyp compiler path. npm may print a `prebuild-install@7.1.3` deprecation warning because that package is a transitive dependency of `better-sqlite3`; it is non-fatal and there is no newer maintained drop-in release to install separately.

   Do not upgrade to `better-sqlite3` 13 just to remove that warning. Its install path uses native compilation and can bring back the original missing-Python failure.

   If a previous deployment failed, remove the failed build or cached `node_modules` when the panel offers that option, and deploy again. Do not run `npm rebuild better-sqlite3` on this shared environment; that deliberately invokes the Python-based compiler that produced the original error.

4. Add these environment variables in the Node.js application settings. Replace every placeholder:

   ```env
   NODE_ENV=production
   PORT=         # Let Hostinger provide PORT when the panel requires it.
   HOST=0.0.0.0
   JWT_SECRET=generate-a-long-random-secret
   ADMIN_USER=choose-an-admin-username
   ADMIN_PASS=choose-a-strong-password
   CLIENT_ORIGIN=https://example.com
   DATA_ROOT=/home/USERNAME/apps/altis-voyage-backend/data
   IMAGES_ROOT=/home/USERNAME/apps/altis-voyage-backend/images
   DB_PATH=/home/USERNAME/apps/altis-voyage-backend/data/altis.db
   ```

   Leave `PORT` unset if Hostinger injects it automatically. Do not commit real secrets.

5. Restart the Node.js application and verify:

   ```text
   https://api.example.com/health
   ```

   It should return `{"ok":true}`.

The backend writes SQLite data and admin-uploaded images to the configured paths. Those paths must be writable by the Node application user and must not be inside a temporary deployment directory.

### If Hostinger still reports a failed build

The `prebuild-install` deprecation message is only a warning. These lines confirm that dependency installation succeeded:

```text
added 130 packages
found 0 vulnerabilities
```

If the application is still marked failed, inspect the next log section for the startup error. Confirm the Node.js application settings are:

- Application root: the uploaded `backend` directory
- Startup file: `src/server.js`
- Node version: 20.x or 22.x
- Build command: `npm ci --omit=dev`
- `PORT`: unset, so Hostinger can inject its assigned port
- `HOST`: `0.0.0.0`

From the Hostinger terminal, run this from the application root:

```bash
node -e "const db=require('better-sqlite3'); const x=new db(':memory:'); console.log(x.prepare('select sqlite_version() v').get())"
npm start
```

The first command must print a SQLite version. The second should print the Altis Voyage backend startup message. If either command fails, copy the error after the npm installation summary; the installation warnings themselves are not the cause.

## 2. Build the frontend

Before building, create `frontend/.env.production` with the public API URL and no trailing slash:

```env
VITE_API_URL=https://api.example.com
```

Then build locally:

```powershell
cd frontend
npm ci
npm run build
```

The build output is `frontend/dist`. The included `frontend/public/.htaccess` is copied into `dist` and keeps direct React routes working on Apache.

## 3. Upload the frontend

1. Back up any existing `public_html` contents.
2. Upload the **contents** of `frontend/dist` into `public_html`, including the hidden `.htaccess` file.
3. Point the main domain to `public_html`.
4. Enable SSL for the main domain and API subdomain.
5. Open the main domain, `/destinations`, `/admin`, and one direct destination URL to verify routing.

## 4. Final checks

- `https://api.example.com/health` returns `{"ok":true}`.
- Browser requests from the main domain reach `https://api.example.com` without CORS errors.
- Submit a test enquiry and confirm it appears under `/admin`.
- Change the admin password immediately after the first login.
- Keep a backup of `data/altis.db` and the `images` directory.
- Do not expose the backend directory through `public_html`.

The Render files remain available for the existing test deployment; they are not required for Hostinger.
