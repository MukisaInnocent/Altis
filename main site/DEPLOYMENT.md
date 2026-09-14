# Altis Voyage - Sample Site Deployment Guide

## Project Overview
This is a complete travel agency website for **Altis Voyage Travel Services Ltd**, built with React 18, PocketBase CMS, and Tailwind CSS.

**Company Profile:**
- Name: Altis Voyage Travel Services Ltd
- Phone: +256 788 748 128 / +256 756 037 524
- Email: info@altistravels.com | Bookings: bookings@altistravels.com
- Address: Equatorial Mall, Level 3, Room 342, Bombo Road, Kampala, Uganda
- Registration: 80034849146981

---

## Project Structure

```
sample site/
├── apps/
│   ├── web/                         # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/          # Reusable UI components
│   │   │   ├── pages/               # Page components
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── lib/                 # Utilities (CMS client, etc.)
│   │   │   ├── App.jsx              # Root component
│   │   │   ├── main.jsx             # Entry point
│   │   │   └── index.css            # Global styles & design tokens
│   │   ├── public/                  # Static assets
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── tailwind.config.js
│   │   └── index.html
│   │
│   └── pocketbase/                  # PocketBase CMS backend
│       ├── pocketbase               # Binary (Linux/Mac)
│       ├── pocketbase.exe           # Binary (Windows)
│       ├── pb_migrations/           # Database migrations
│       │   └── 1789261510_travel_cms.js  # Seeds Altis data
│       ├── pb_hooks/                # Custom backend logic
│       └── pb_data/                 # Database (created on first run)
│
├── package.json                     # Monorepo root
├── knip.json                        # Dependency lint config
└── README.md
```

---

## Installation & Local Development

### Prerequisites
- Node.js 20+
- npm or pnpm

### Setup

```bash
# Navigate to the repository root
cd "main site"

# Install dependencies
npm install

# Start development servers
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8090

### Frontend Only (Vite)

```bash
cd apps/web
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
```

### Backend Only (PocketBase)

```bash
cd apps/pocketbase

# Windows
set PB_ENCRYPTION_KEY=01234567890123456789012345678901
pocketbase.exe serve --http=0.0.0.0:8090

# Linux/Mac
export PB_ENCRYPTION_KEY=01234567890123456789012345678901
./pocketbase serve --http=0.0.0.0:8090
```

Access admin panel: http://localhost:8090/_/
- Email: admin@altistravels.com
- Password: (set on first login)

---

## Deployment Options

### Git-Connected Hostinger Deployment

Use this flow when Hostinger is connected to the GitHub repository.

#### Hostinger build settings

- **Repository**: the GitHub repository containing this `main site` directory
- **Root directory**: `main site`
- **Build command**: `npm install && npm run build`
- **Output directory**: `dist/apps/web`
- **Entry file**: `src/server.js`
- **Start command**: `npm start` (starts the server immediately; the build runs during the build phase)
- **Node.js**: 20 or newer
- **Environment variable**: `VITE_POCKETBASE_URL=https://cms.altistravels.com`

Replace `https://cms.altistravels.com` with the public HTTPS URL where PocketBase is deployed. If Hostinger provides the PocketBase service through `/hcgi/platform`, keep the value as `/hcgi/platform` instead.

The build copies `apps/web/public/.htaccess` into the output so BrowserRouter routes such as `/destinations` and `/admin/login` resolve correctly on Apache hosting.

#### Deploy the CMS separately

The frontend cannot deploy PocketBase by itself. Deploy PocketBase on a VPS or Node-capable service with:

- the PocketBase Linux binary
- `pb_migrations/`
- `pb_hooks/`
- a persistent data directory mounted at `/data`
- `PB_ENCRYPTION_KEY` set to a private 32-character value
- HTTPS and the public CMS URL used by `VITE_POCKETBASE_URL`

Create the first production superuser through PocketBase's setup flow. Do not reuse the local development password.

After the CMS is live, set its CORS/origin policy to allow the public Altis Voyage domain, then trigger a new frontend build so the configured CMS URL is embedded in the bundle.

### Option 1: Static Frontend Only

Perfect for Hostinger shared hosting. Uses pre-built HTML/CSS/JS.

**Build:**
```bash
cd "main site/apps/web"
npm run build
# Output: ../../dist/apps/web/
```

**Archive & Deploy:**
```bash
# Create zip of dist folder
zip -r altis-voyage-frontend.zip dist/apps/web/

# Upload to Hostinger via dashboard or use deployment tool
```

**Deploy via Hostinger CLI (if available):**
```bash
# Command will be provided by Hostinger API
mcp_hostinger-hos_hosting_deployStaticWebsite \
  --domain altistravels.com \
  --archivePath ./altis-voyage-frontend.zip
```

---

### Option 2: Full Stack (PocketBase + Frontend)

For VPS or dedicated server deployment.

**Prepare deployment package:**

```bash
# From the repository root
$deployDir = "main site/hostinger-deploy"

# Copy frontend build
xcopy "backend\frontend\dist\*" "$deployDir\public\" /S /Y

# Copy PocketBase
copy "sample site\apps\pocketbase\pocketbase.exe" "$deployDir\"

# Copy migrations
xcopy "sample site\apps\pocketbase\pb_migrations\*" "$deployDir\pb_migrations\" /S /Y

# Create archive
powershell -Command "Compress-Archive -Path '$deployDir\*' -DestinationPath 'altis-voyage-full.zip'"
```

---

## Customization Guide

### Update Company Info

Edit: `apps/pocketbase/pb_migrations/1789261510_travel_cms.js`

```javascript
{ key: "contact", value: { 
  phone: "+256 788 748 128",
  email: "info@altistravels.com",
  address: "Equatorial Mall, Level 3, Room 342, Bombo Road, Kampala, Uganda",
  // ... more fields
}}
```

### Update Colors & Branding

Edit: `apps/web/tailwind.config.js` and `apps/web/src/index.css`

**Current Altis Colors:**
- Primary (Navy): hsl(214, 76%, 10%)
- Accent (Gold): hsl(42, 64%, 54%)
- Secondary (Teal): hsl(174, 22%, 87%)

### Add Content

1. Start PocketBase: `cd apps/pocketbase && ./pocketbase serve`
2. Go to http://localhost:8090/_/
3. Log in and edit collections
4. Frontend automatically fetches via `getContent()` hook

---

## Features

✅ **Homepage** - Hero section with CTAs
✅ **Destinations** - Browse African destinations
✅ **Tours & Store** - Bookable packages with cart
✅ **Plan Your Trip** - Inquiry form
✅ **Admin Dashboard** - Manage content via CMS
✅ **Responsive Design** - Mobile, tablet, desktop
✅ **SPA Routing** - Smooth page transitions

---

## CMS Content Structure

The PocketBase database includes:

**Collections:**
- `site_content` - Key-value pairs (hero, contact, about, services)
- `destinations` - Travel destinations
- `packages` - Tour packages
- `inquiries` - User inquiries/bookings

**Seeded Data:**
- Hero section: "From Uganda to the World"
- Contact: Phone, email, address
- About: Mission, vision, company description
- Services: 8 travel services listed
- Why Us: 6 unique value propositions

---

## Production Checklist

- [ ] Build frontend: `npm run build`
- [ ] Test production build locally
- [ ] Verify all Altis branding in place
- [ ] Update CMS content (destinations, tours, gallery)
- [ ] Configure email notifications for inquiries
- [ ] Set up analytics tracking
- [ ] Test on mobile/tablet/desktop
- [ ] Test forms and cart functionality
- [ ] Verify .htaccess routing (SPA fallback)
- [ ] Create deployment archive
- [ ] Deploy to Hostinger
- [ ] Verify live site loads correctly
- [ ] Test all navigation links
- [ ] Monitor for errors

---

## Troubleshooting

**Frontend not loading:**
- Ensure .htaccess is included in deployment for SPA routing
- Clear browser cache
- Check Hostinger error logs

**PocketBase won't start:**
- Verify encryption key is 32 characters
- Check port 8090 is not in use
- Ensure pb_data directory has write permissions

**CMS content not showing:**
- Verify admin is logged in
- Check API URL in `apps/web/src/lib/cms.js`
- Inspect browser Network tab for API errors

---

## File Sizes (Production Build)

- Frontend bundle: ~150KB
- Assets (images, fonts): ~500KB
- Total: ~650KB

---

## Support Files

- `DEPLOYMENT_READY.md` - Deployment summary
- `package.json` - Dependencies and scripts
- `.gitignore` - Git exclusions
- `knip.json` - Unused dependency detection

---

## Next Steps

1. **Customize:** Edit company info, colors, content
2. **Test:** `npm run dev` and verify locally
3. **Build:** `npm run build`
4. **Deploy:** Create archive and deploy to Hostinger
5. **Monitor:** Check error logs and analytics

---

**Last Updated:** 2026-09-14
**Status:** Ready for Deployment
**Target Domain:** altistravels.com
