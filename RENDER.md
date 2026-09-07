# Render deployment

The repository includes a free-tier test Blueprint for a backend web service and a frontend static site.

1. In Render, create a Blueprint from this repository and review the two services before applying it.
2. Set `ADMIN_USER` and a strong `ADMIN_PASS` for `altis-voyage-api` before the first deploy.
3. Deploy the backend and wait for `/health` to return `{"ok":true}`.
4. Set `VITE_API_URL` on `altis-voyage-frontend` to the backend service URL, for example `https://altis-voyage-api.onrender.com`.
5. Redeploy the frontend after setting `VITE_API_URL`, because Vite embeds it during the build.
6. Set `CLIENT_ORIGIN` on the backend to the exact frontend URL, for example `https://altis-voyage-frontend.onrender.com`.
7. Change the admin password after the first login.

The free tier has ephemeral storage. SQLite data and admin-uploaded images can disappear after a redeploy or instance replacement. This is suitable for testing only. For persistent production data, use a paid Render disk or move SQLite/uploads to managed storage/object storage.

Test URLs:

- Frontend: `https://altis-voyage-frontend.onrender.com`
- Admin: `https://altis-voyage-frontend.onrender.com/admin`
- Backend health: `https://altis-voyage-api.onrender.com/health`