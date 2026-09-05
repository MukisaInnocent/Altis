Build the complete frontend for the "Altis Voyage Travel" website. The backend
already exists and is running at http://localhost:4000 — do not modify it,
only consume its API.

## Backend API reference (already built, do not change)
- GET  /api/images                      → { category: [{ id, url, caption }] }, ACTIVE images only, grouped by category (hero, about, destinations, tours, gallery)
- POST /api/inquiries                   → body { name, email, phone, destination, message }
- POST /api/stats/ping                  → body { event, meta }  (fire-and-forget page/event tracking)
- POST /api/admin/login                 → body { username, password } → { token, username }
- POST /api/admin/change-password       → auth required, body { newPassword }
- GET  /api/admin/images                → auth required → { categories: [...], images: { category: [...] } } (ALL images, active + inactive)
- PATCH /api/admin/images/:id/toggle    → auth required, flips active/inactive
- DELETE /api/admin/images/:id          → auth required
- POST /api/admin/images                → auth required, multipart/form-data: category, image (file), caption
- GET  /api/admin/inquiries             → auth required, all inquiries newest first
- PATCH /api/admin/inquiries/:id/read   → auth required
- GET  /api/admin/stats                 → auth required → { totalInquiries, unreadInquiries, totalImages, activeImages, recentEvents }

Auth: send JWT as `Authorization: Bearer <token>` header, obtained from /api/admin/login. Store it in memory/localStorage on the client after login.

## 1. Project setup
Create a `frontend/` folder (sibling to `backend/`) with Vite + React.
- Add `vite-plugin-pwa`: installable PWA, manifest name "Altis Voyage Travel", short_name "Altis Voyage", theme_color #0F3D3E, background_color #FAF7F2, registerType 'autoUpdate', icons (generate simple placeholder 192x192 and 512x512 PNG icons if none provided).
- Add `react-router-dom`: route "/" is the single-page public site, route "/admin" is the admin panel.
- Add `.env` with `VITE_API_URL=http://localhost:4000`.
- All fetches to the backend use `${import.meta.env.VITE_API_URL}` as the base.

## 2. Design system
Create shared CSS variables/tokens:
- Colors: primary deep teal #0F3D3E, accent warm amber #E08E45, background off-white #FAF7F2, text dark #1C2B2A, muted #6B7B79.
- Headings: serif display font (Fraunces or Playfair Display via Google Fonts) — travel-journal feel.
- Body: humanist sans-serif (Inter or Work Sans).
- Editorial/magazine-spread layout — asymmetric image/text blocks, not centered-hero-with-generic-gradient. No default rounded-card-with-drop-shadow look everywhere.
- Mobile-first: this is the primary way most visitors will view it. Every section must work cleanly at 375px width first, then scale up.

## 3. Public site — single scrolling page with anchor nav, in this order
Build one section/component at a time, each fetching its own images from GET /api/images and reading the relevant category key.

1. **Nav bar**: logo/site name, links scrolling to each section, WhatsApp icon button, sticky on scroll, collapses to a mobile hamburger menu under ~768px.
2. **Hero** (category: "hero"): full-bleed background image (rotate/carousel through active hero images if more than one), business name, one-line value proposition, primary CTA button scrolling to Contact, secondary CTA scrolling to Destinations.
3. **About** (category: "about"): company profile placeholder paragraph (mark clearly as placeholder text to be swapped for real client copy later), one supporting image.
4. **Destinations** (category: "destinations"): responsive card grid, one image per card, destination name + 1–2 sentence description (use placeholder Ugandan destinations: Bwindi, Queen Elizabeth NP, Jinja/Source of the Nile, Ssese Islands — mark as placeholder).
5. **Tours & Packages** (category: "tours"): cards with tour name, duration, price placeholder ("From UGX —"), short description, image, "Enquire" button that scrolls to Contact and pre-fills the destination field.
6. **Services**: short list/grid of travel services (visa support, airport transfer, custom itineraries, group bookings) — no images needed, icon + short text each.
7. **Gallery** (category: "gallery"): responsive masonry or grid of images, lightbox on click.
8. **Contact**: form fields — name, email, phone, destination (pre-fillable from Tours section), message. On submit, POST to /api/inquiries, show a success/error state, clear the form on success. Below the form: WhatsApp click-to-chat button linking to `https://wa.me/<placeholder-number>` (mark number as placeholder), and an embedded Google Maps iframe (use a placeholder Kampala location, mark as placeholder pending real address).
9. **Footer**: business name, quick links, social placeholders, copyright.

Fire a POST to /api/stats/ping with event "page_view" once when the page loads, and event "cta_click" with meta = button name whenever a CTA button is clicked (fire and forget, don't block UI on it).

## 4. Admin panel (route: /admin)
- **Login screen**: username + password form → POST /api/admin/login, store JWT, redirect to dashboard on success, show error message on failure.
- **Dashboard**, once authenticated:
  - Stats summary cards at the top from GET /api/admin/stats (total inquiries, unread inquiries, total images, active images).
  - **Image manager**: tabs or sections per category (hero, about, destinations, tours, gallery). For each image: thumbnail, an active/inactive toggle switch (PATCH .../toggle), a delete button with confirm (DELETE), and a caption field if editable. A per-category upload form (file input + optional caption → POST multipart/form-data to /api/admin/images with the right `category`).
  - **Inquiries list**: table from GET /api/admin/inquiries — name, contact info, destination, message, date, read/unread status. Clicking a row marks it read (PATCH .../read).
  - **Change password** form → POST /api/admin/change-password.
  - Logout button that clears the stored JWT and redirects to login.
- Protect the dashboard: if there's no valid token, redirect to the login screen. If any admin API call returns 401, clear the token and redirect to login.

## 5. Finish and verify
- Run `npm run build && npm run preview`, confirm no build errors.
- Check Chrome DevTools → Application → Manifest to confirm the PWA is installable, and that the service worker is registered.
- Test the whole flow manually: submit the contact form and confirm it shows up in admin → Inquiries; toggle an image off in admin and confirm it disappears from the public site; upload a new image in admin and confirm it appears on the public site.
- Report back what you built, any placeholders I still need to replace with real client content (logo, real photos, real copy, real WhatsApp number, real address, real prices), and any errors encountered.
