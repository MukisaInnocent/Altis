# Render deployment

The repository includes a `render.yaml` Blueprint for a backend web service and a frontend static site.

1. In Render, create a Blueprint from this repository and review the two services before applying it.
2. Set `ADMIN_USER` and a strong `ADMIN_PASS` for `altis-voyage-api`.
3. After the services are created, set `VITE_API_URL` on `altis-voyage-frontend` to the backend service URL, for example `https://altis-voyage-api.onrender.com`.
4. Redeploy the frontend after setting `VITE_API_URL`, because Vite embeds it during the build.
5. Change the admin password after the first login if the database was seeded with an initial account.

The backend disk keeps SQLite data across deploys. Uploaded images remain in the service image directory; keep source images in `backend/images` and use the admin upload area for test production only unless object storage is added later.