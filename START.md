# Start Altis Voyage

Open two terminals in VS Code.

## Backend

```powershell
cd "C:\Users\MUKISA\Music\Altis Voyage\backend"
npm run dev
```

Backend URL: http://localhost:4000

## Frontend

Open a second terminal:

```powershell
cd "C:\Users\MUKISA\Music\Altis Voyage\backend\frontend"
npm run dev
```

Frontend URL: http://localhost:5173

Open the frontend URL in your browser. The admin dashboard is available at:

```text
http://localhost:5173/admin
```

## If `npm` is not recognized

Run this once in each terminal, then repeat the command:

```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
```

## LAN access

Find your computer's IPv4 address with:

```powershell
ipconfig
```

On another device connected to the same network, open:

```text
http://YOUR-IP-ADDRESS:5173
```

Example:

```text
http://192.168.1.25:5173
```

Keep both terminals running while using the site.
