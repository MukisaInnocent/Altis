# Altis Voyage

Altis Voyage is a React/Vite travel website with an Express/SQLite backend, an admin image library, and installable PWA support.

## Requirements

- Node.js 20 or newer
- npm
- Windows PowerShell, macOS Terminal, or Linux shell

Check the installed tools:

```powershell
node --version
npm --version
```

On Windows, if `npm` is not recognized but Node.js is installed, add `C:\Program Files\nodejs` to PATH or run this in the current PowerShell terminal:

```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
```

## First-time setup

Install dependencies once in each application folder:

```powershell
cd "C:\Users\MUKISA\Music\Altis Voyage\backend"
npm ci

cd "C:\Users\MUKISA\Music\Altis Voyage\backend\frontend"
npm ci
```

## Start locally

Run the backend and frontend in two separate terminals.

### Terminal 1: backend API

```powershell
cd "C:\Users\MUKISA\Music\Altis Voyage\backend"
npm run dev
```

The API runs at `http://localhost:4000`.

### Terminal 2: frontend

```powershell
cd "C:\Users\MUKISA\Music\Altis Voyage\backend\frontend"
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

Useful local URLs:

- Website: `http://localhost:5173`
- Admin: `http://localhost:5173/admin`
- API health: `http://localhost:4000/health`
- Public images: `http://localhost:4000/api/images`

The development admin credentials are controlled by the backend environment. The defaults are `admin` and `altisvoyage2026` when no `.env` values are set. Change them before sharing the app.

## Start on a local network

The backend listens on all interfaces and Vite exposes the development server to the network.

1. Find the computer's LAN IPv4 address:

```powershell
ipconfig
```

Look for the active adapter's `IPv4 Address`, for example `192.168.1.25`.

2. Start both servers using the commands above.

3. On another device connected to the same network, open:

```text
http://192.168.1.25:5173
```

The frontend automatically uses the browser's hostname with port `4000`, so the other device calls `http://192.168.1.25:4000`.

If the other device cannot connect, allow Node.js through Windows Defender Firewall on private networks and confirm both devices are on the same Wi-Fi or LAN. Do not expose the development server to the public internet.

For a LAN production-style preview after building:

```powershell
cd "C:\Users\MUKISA\Music\Altis Voyage\backend\frontend"
npm run build
npm run preview -- --host 0.0.0.0
```

The preview server normally uses port `4173`.

## Environment variables

### Backend

Copy `backend/.env.example` to `backend/.env` and adjust values when needed:

```env
PORT=4000
HOST=0.0.0.0
JWT_SECRET=use-a-long-random-secret
ADMIN_USER=admin
ADMIN_PASS=use-a-strong-password
CLIENT_ORIGIN=http://localhost:5173
```

`DATA_ROOT`, `DB_PATH`, and `IMAGES_ROOT` can be set when the database or uploaded images need to live elsewhere. Never commit real passwords or JWT secrets.

### Frontend

Copy `backend/frontend/.env.example` to `backend/frontend/.env` if you need to override the API URL:

```env
VITE_API_URL=
```

Leave it blank for local development and LAN testing. The app then uses the current browser hostname on port `4000`.

For a separately hosted frontend, set the complete backend URL before building:

```env
VITE_API_URL=https://your-backend.example.com
```

Vite embeds this value into the frontend at build time, so rebuild after changing it.

## Admin image management

Open `/admin`, sign in, and use **Image library** to upload, show, hide, or delete images. Public pages read active images from `/api/images`.

For hero, destination, and tour replacements, use the matching standard filename when uploading, such as `lake-bunyonyi.jpg`, `bwindi.jpg`, or `gorilla-trek.jpg`. The backend assigns the matching image slot and hides the previous image without deleting it.

The free Render setup uses ephemeral storage. SQLite data and admin-uploaded files can be lost after a redeploy or instance replacement. Keep source images in `backend/images` for test deployments. Use persistent storage before production use.

## PWA

The frontend uses `vite-plugin-pwa` with automatic service-worker updates. A production build generates:

- `dist/sw.js`
- `dist/registerSW.js`
- `dist/manifest.webmanifest`

Build and preview it locally:

```powershell
cd "C:\Users\MUKISA\Music\Altis Voyage\backend\frontend"
npm run build
npm run preview -- --host 0.0.0.0
```

PWA installation and service workers work reliably on HTTPS. `http://localhost` is treated as a secure development origin by modern browsers. Plain HTTP on a LAN IP may not show the install prompt or enable all service-worker behavior; use HTTPS for LAN PWA testing or test the PWA on `localhost`.

The manifest currently has no custom icon files. Add production PNG icons in `backend/frontend/public` and configure them in `backend/frontend/vite.config.js` before publishing a branded install experience.

## Checks

Run the frontend checks before deployment:

```powershell
cd "C:\Users\MUKISA\Music\Altis Voyage\backend\frontend"
npm run lint
npm run build
```

Check backend syntax:

```powershell
cd "C:\Users\MUKISA\Music\Altis Voyage"
node --check backend/src/server.js
node --check backend/src/db.js
```

## Render test deployment

The root `render.yaml` defines a free-tier backend web service and frontend static site. Follow [RENDER.md](RENDER.md).

The important order is:

1. Deploy the backend and check `/health`.
2. Set the frontend `VITE_API_URL` to the backend Render URL.
3. Set backend `CLIENT_ORIGIN` to the frontend Render URL.
4. Redeploy the frontend because Vite embeds environment values during its build.

Free Render services can sleep and free-tier storage is not durable. This deployment is for testing until persistent database and image storage are added.

## Hostinger deployment

For production hosting on Hostinger, deploy the frontend static build to `public_html` and run the Express API as a Hostinger Node.js application on an API subdomain. Follow [HOSTINGER.md](HOSTINGER.md) for the required environment variables, build command, Apache SPA rewrite, and verification steps.
