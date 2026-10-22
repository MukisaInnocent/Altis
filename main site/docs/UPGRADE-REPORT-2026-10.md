# Altis Voyage website upgrade – October 2026

Status: implemented and tested locally on a copy of the data. **Not deployed.** Deployment steps and rollback are in `HOSTINGER.md`.

## Urgent findings

1. **The live site is down.** On 22 October 2026, `https://altistravels.com/` returned Hostinger's `403 Forbidden` page and every other URL (including `/api/health`) returned `404`. This is unrelated to this upgrade. Check in hPanel that the Node.js app is running, with application root `main site`, build `npm run build` and start `npm start`.
2. **Database password exposed.** `main site/tmp-db-check.mjs` was committed with the live MySQL password in plain text, and an earlier commit contained a `DB_HOST=…env` credential file. Both stay in git history. **Change the database password in hPanel** and update `DB_PASSWORD` in the app's environment variables. The file has been removed from the repository.
3. The local `main site/.env` points at the production database, so running the site locally writes to live data. For local work, set `DATABASE_DRIVER=sqlite`.

## Architecture (unchanged stack)

Next.js 15 + one API route + MySQL on Hostinger (SQLite locally). Public pages are now rendered on the server by the existing API route (`src/site/`), which gives every page its own title, description, canonical URL and structured data, and pulls contact details from the database. Browser JavaScript (`public/js/app.js`) only adds interactivity; the admin dashboard has its own script (`public/js/admin.js`). No new paid services or npm dependencies.

## Requirement status

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Homepage headline and CTAs | Done | "Your Journey Begins with Altis Voyage"; Explore Travel Packages → `/packages`, Request a Quote → `/request-quote`. Editable under Site content → `hero`. |
| 2 | Cart → Request a Quote / Book Now | Done | Cart replaced by **My Trip** (`/my-trip`): saved packages plus sent requests. Existing cart contents in visitors' browsers are migrated automatically. Every request gets a reference (e.g. `AV-261022-7EXWL`), is stored, and is clearly "not a booking" until staff confirm. Customers can check the status with reference + email/phone. No payments. |
| 3 | Flight booking enquiries | Done | `/flights`: trip type, route, dates, travellers by age, class, flexibility. States clearly that fares are not live prices. |
| 4 | Visa services | Done | `/visa-services`: services, no-guarantee disclaimer, document checklist, official-source links (editable: Site content → `visa_sources`), enquiry form. |
| 5 | Study abroad & scholarships | Done (no listings yet) | `/study-abroad`: how we help, disclaimer, enquiry form. Scholarships/programmes are managed under **Study opportunities** with source link, "verified on" date and deadline; expired items hide automatically. None are published, because none have been verified yet. |
| 6 | WhatsApp buttons | Done | +256 774 497 295 (confirmed by the owner). Click-to-chat with a prefilled message naming the page or package only. Floating button on every page, plus buttons on packages, flights, visa, study, offers, articles and contact. |
| 7 | Why Choose Altis Voyage | Done – owner review | Six points based on the services and process stated on the existing site. Editable: Site content → `why_choose`. |
| 8 | Customer reviews | Done | Existing reviews kept (owner confirmed they are genuine). New: approve/hide, and "Verified booking" is shown **only** when a review is linked to an enquiry whose status is Confirmed or Completed. |
| 9 | About Us | Done – owner input | `/about`: company description, services, process, stats. Team and credentials sections appear only once supplied (Site content → `about` → `team`, `credentials`). |
| 10 | Contact + Google Maps | Done | `/contact`: phone, WhatsApp, email, hours, address with free Google Maps embed and directions link (no API key), validated form. |
| 11 | Privacy, Terms, Refund pages | Drafted – needs approval | `/privacy-policy`, `/terms`, `/refund-policy`. Each shows a "Draft under review" notice until `approved` is set to true in Site content. Bracketed items need owner/legal input; refund percentages and timelines were deliberately not invented. Drafted with reference to Uganda's Data Protection and Privacy Act, 2019, but a lawyer must review. |
| 12 | FAQ | Done | `/faq` plus FAQ sections on the flight, visa, study and contact pages. 14 starter answers, managed under **FAQs**. FAQPage structured data on `/faq` only. |
| 13 | Travel offers | Done (none published) | **Offers** in the dashboard: dates, price/currency, terms, image, publish switch. Expired offers move automatically to a collapsed "expired" list and cannot be enquired about. |
| 14 | Blog / travel advice | Done – drafts await review | `/blog`, `/blog/<slug>`, categories, tags, dates, author, sources, "last checked" date, related packages. Two starter articles are seeded **unpublished** for review. |
| 15 | SEO | Done | Unique titles/descriptions, canonical URLs, Open Graph, clean URLs with 301/308 redirects from the old `.html` pages, breadcrumbs, `TravelAgency`/`TouristTrip`/`BlogPosting`/`BreadcrumbList` data (no ratings or prices in markup), dynamic `sitemap.xml`, `robots.txt`, noindex on admin, API, My Trip and confirmation pages. Lighthouse SEO 100. |
| 16 | GA4 + Search Console | Ready – needs IDs | Set `GA_MEASUREMENT_ID` and `GOOGLE_SITE_VERIFICATION`. Events: `view_item`, `search`, `form_start`, `generate_lead`, `whatsapp_click`, `planner_search`; none carry personal data (tested). |
| 17 | Meta Pixel | Ready – needs ID | Set `META_PIXEL_ID`. Events: PageView, ViewContent, Search, Lead, Contact. Loaded only after cookie consent. |
| 18 | Mobile-first | Done | Tested at 390px: no horizontal scroll on any page (an off-screen menu drawer was widening the page and has been corrected), tap targets enlarged, zoom no longer disabled, 16px inputs (no iOS zoom), keyboard skip link, focus styles, ARIA on menu. Lighthouse accessibility 100. |
| 19 | Page speed | Improved – see below | |
| 20 | Every page leads to an action | Done | Each page ends in its specific CTA (as listed in the brief) plus WhatsApp. |
| + | Trip planner | Done | `/trip-planner`: rule-based matching on region, budget, length and interests against the real packages, with reasons, links to package pages and a prefilled quote. No AI service is connected; nothing invents prices or availability. |

## Performance (Lighthouse mobile, same machine, original code vs upgrade)

The live site could not be measured (it returns 403), so the original code was run locally for a fair comparison.

| Page | Perf | Accessibility | Best practices | SEO | LCP | Page weight |
|---|---|---|---|---|---|---|
| Home – before | 82 | 85 | 96 | 100 | 3.4 s | 936 KB |
| Home – after | 84–86 | 100 | 100 | 100 | 3.0–3.2 s | 196 KB |
| Packages (`store.html`) – before | 69 | 84 | 96 | 100 | 5.9 s | 782 KB |
| Packages – after | 75 | 100 | 100 | 100 | 4.5 s | 441 KB |
| Quote (`inquiry.html`) – before | 74 | 85 | 96 | 100 | 4.9 s | 478 KB |
| Quote – after | 80 | 100 | 100 | 100 | 3.8 s | 279 KB |

Remaining speed limits: package and gallery photos are large PNG files hosted on `images.hostinger.com` (re-upload as compressed JPG/WebP around 1200px wide), and Google Fonts delay first paint by roughly a second on slow mobile connections.

## Database changes

All additive, applied automatically at startup, safe to repeat (`schema-migrations.js`, `mysql-schema.js`, `sqlite-schema.js`):

- New tables: `offers`, `posts`, `opportunities`, `faqs`.
- New columns: `inquiries` (`reference`, `service`, `details`, `package_id`, `admin_notes`), `testimonials` (`approved` default 1, `verified_booking`, `inquiry_id`).
- Site content is no longer overwritten on every restart. Two one-off content upgrades (confirmed contact details; new headline) run once.
- Tested against a copy of the existing SQLite data. **Not yet run against MySQL** – take a phpMyAdmin backup before deploying.

## Security fixes

- Session tokens now use `crypto.randomBytes` (previously `Math.random`), expire after 7 days, and use the `Secure` cookie flag on HTTPS.
- Login and enquiry forms are rate-limited; forms have a spam honeypot and server-side validation.
- Writes are limited to known columns per table (an admin request could previously inject a column name).
- Public pages escape all database content.
- Error responses no longer expose the admin email or database details to the public.
- The pre-filled admin email was removed from the login form.

## Tests run

- `npm run build`: passes. The project has no automated test suite or linter configured.
- Route checks for all 18 pages, redirects, 404, sitemap, robots and API endpoints.
- API: valid and invalid enquiries for each service, honeypot, form post without JavaScript, status lookup (right/wrong contact), admin authorisation, CRUD for every table, unknown-column rejection, verified-review logic, offer and scholarship expiry, article slug generation.
- Browser (headless Chrome at 390px): menu, search filters, save to My Trip, legacy cart migration, inline form errors, successful submission with reference, status check, trip planner, one-way flights, cookie consent with GA/Meta (nothing loads before consent; no personal data in events).

Not tested: MySQL migration on the real database, real GA4/Meta/Search Console accounts, iOS Safari on a physical device.

## What the owner needs to provide

1. Fix the Hostinger app so the site is back online, and **rotate the database password**.
2. Review and approve the three policies (set `approved: true`), including retention period, service-fee refunds, refund timelines and liability.
3. Review the "Why choose us" points, FAQs and the two draft articles, then publish them.
4. Optional: team members and registrations/memberships for the About page.
5. Genuine offers and verified scholarships, when available.
6. GA4 measurement ID, Meta Pixel ID and Search Console token; then submit `https://altistravels.com/sitemap.xml` in Search Console.
7. Whether the other numbers (+256 788 748 128, +256 756 037 524) should still be shown anywhere.
8. Compressed images for packages and the gallery.

## Not done / future work

- Email notifications to staff or customers on new enquiries (needs Hostinger SMTP credentials and approval; until then staff check the dashboard).
- Optional AI assistant for the planner: not built. It must stay off until the provider, data handling and costs are approved.
- Image upload in the dashboard (images are still added by URL).

## Design refresh (added 23 October 2026)

- **Logo:** new `public/logo-header.jpg` (the original with its empty margin cropped, so the mark is about 40% larger at any height). Shown at 72px tall in the desktop header (56px once scrolled), 60px on phones and 96px in the footer, on a rounded navy plate that works in both themes. `logo.jpg` is unchanged and still used by the manifest and structured data.
- **Two themes:** Midnight (dark, the default brand look) and Daylight (light). The header toggle saves the choice; on a first visit the site follows the device's light/dark setting. Hero, CTA band and footer stay dark in both themes so their text is always legible. The admin dashboard stays dark.
- **2026 styling:** floating glass header that compacts on scroll, rounded panel-style heroes, quick-links panel in the home hero, scrolling destinations ticker, bento services grid, animated counters, staggered reveal and cursor glow on cards, scroll progress bar and page-to-page view transitions. All motion switches off for visitors who ask for reduced motion.
- **Fonts:** Bricolage Grotesque (headings) and Manrope (body), replacing Bitter and Archivo.
- **Cache busting:** CSS/JS versions now come from file modification time, so browsers get new styles after each deploy automatically.
- **Fixed:** the mobile menu overlay sat above the menu panel and blocked taps on its links.
- **Checks:** Lighthouse mobile in both themes: accessibility 100, best practices 100, SEO 100, performance 75 to 85 (unchanged from before the redesign). No horizontal scrolling on any page at 390px in either theme.

## Admin dashboard redesign (added 23 October 2026)

**Audit findings fixed**
- The **Site content** tab returned an error: the list query sorted by a `created_at` column that table does not have. This affected the live MySQL setup as well (`db.js`, `mysql-db.js`).
- Every edit form was permanently open: the public stylesheet rewrite had removed the helper the old dashboard relied on to hide them.
- The sidebar filled the top of the screen on phones, with no menu button.
- No overview, search or sorting, and customer messages could only be read inside raw form fields.
- Missing favicon (404) on admin pages; sign-in page logged a 401 when signed out; the pre-filled admin email was already removed earlier.

**What is new** (`public/admin/*.html`, `public/css/admin.css`, `public/js/admin.js`, `admin-login.js`)
- **Sign-in:** split layout, show/hide password, clear error messages, redirects straight to the dashboard if already signed in. Rate limiting is unchanged (10 attempts per 10 minutes).
- **Overview:** greeting, key figures (new enquiries, this week vs last, live offers, drafts), a 14-day enquiries chart, a by-service chart, recent enquiries, and a "needs attention" list (enquiries waiting over 24 hours, policies still in draft, expired offers or deadlines still published, unreviewed articles, hidden reviews).
- **Enquiries:** list and board views (drag a card between status columns, or use its status menu), status chips with counts, service filter, search, overdue flag, undo after a status change. The detail panel shows contact buttons (call, WhatsApp, email, copy), the request details laid out clearly, the customer's message, status buttons showing what the customer will see, and internal notes. Staff can also log phone-in enquiries.
- **All content sections:** searchable, sortable tables with one-click Published/Featured switches, a slide-over editor with image preview, required-field checks, "view on site" links, unsaved-changes protection and a confirmation before deleting. Tables turn into cards on phones.
- **Site content:** a structured editor instead of raw JSON, with add, remove and reorder for lists such as "Why choose us" and "How booking works"; policies keep their approval switch and "last updated" date is set on save.
- **Live behaviour:** the dashboard checks for new enquiries every minute and shows a notification and a sidebar count.
- **Look:** the same Midnight / Daylight themes as the public site, deep navy sidebar with the large logo, mobile menu, toasts and dialogs. All customer-supplied text is escaped (tested with a hostile enquiry).

**Checks:** 40 of 41 automated browser checks pass; the 41st is the test's own expected wrong-password response plus photos from external hosts that cannot be reached from the test machine. Lighthouse on the dashboard and sign-in page: accessibility 100 and best practices 100 in both themes. SEO scores are intentionally low because the admin area is blocked from search engines.

**Not changed:** staff accounts. The password still comes from the `ADMIN_PASSWORD` environment variable, because the app re-applies it at every start; a "change password" screen needs that behaviour changed first, so it is listed as future work.
