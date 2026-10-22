import fs from 'node:fs';
import path from 'node:path';
import { getRow, listRows, listSiteContent } from '../data-access.js';
import { escapeHtml, isoDate, todayIso } from './html.js';
import { layout } from './layout.js';
import { NotFound, PAGES, Redirect, SITEMAP_PATHS, article, notFound, packageDetail } from './pages.js';
import { packagePath, postPath } from './components.js';

const CACHE_TTL_MS = 30 * 1000;
const VERIFIED_STATUSES = new Set(['confirmed', 'completed']);
// Cache-busting token for /css and /js: the newest modification time of the shipped assets, so
// browsers fetch fresh files after every deploy without anyone bumping a number by hand.
const ASSET_VERSION = (() => {
  try {
    const times = ['css/main.css', 'js/app.js'].map((file) => fs.statSync(path.join(process.cwd(), 'public', file)).mtimeMs);
    return Math.floor(Math.max(...times)).toString(36);
  } catch {
    return '20261023';
  }
})();
const DEFAULT_CONTACT = {
  phone: '+256 774 497 295',
  whatsapp: '+256774497295',
  email: 'info@altistravels.com',
  address: 'Equatorial Mall, Level 3, Room 342, Bombo Road, Kampala, Uganda',
  hours: 'Mon-Sat, 8:30-18:00 EAT'
};

// Public pages read the same few small tables on every request, so results are cached briefly.
// Admin writes call invalidateSiteCache() so changes appear immediately in this process.
const cache = new Map();

export function invalidateSiteCache() {
  cache.clear();
}

async function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < CACHE_TTL_MS) return hit.value;
  const value = await loader();
  cache.set(key, { time: Date.now(), value });
  return value;
}

function parseValue(value) {
  if (typeof value !== 'string') return value || {};
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function safeList(table) {
  try {
    return await cached(table, () => listRows(table));
  } catch (error) {
    // Pages still render (with empty sections) when the database is briefly unavailable.
    console.error(`[site] Could not load ${table}: ${error.message}`);
    return [];
  }
}

async function loadContent() {
  try {
    return await cached('site_content', async () => {
      const rows = await listSiteContent();
      return Object.fromEntries(rows.filter((row) => !String(row.key).startsWith('_')).map((row) => [row.key, parseValue(row.value)]));
    });
  } catch (error) {
    console.error(`[site] Could not load site content: ${error.message}`);
    return {};
  }
}

function isPublished(row) {
  return Number(row.published) === 1;
}

export async function publicTestimonials() {
  const rows = (await safeList('testimonials')).filter((row) => row.approved === undefined || row.approved === null || Number(row.approved) === 1);
  // "Verified booking" is shown only when the review is linked to an enquiry that our team
  // actually confirmed or completed. The flag alone is not enough.
  return Promise.all(rows.map(async (row) => {
    let verified = false;
    if (Number(row.verified_booking) === 1 && row.inquiry_id) {
      const inquiry = await getRow('inquiries', row.inquiry_id).catch(() => null);
      verified = Boolean(inquiry && VERIFIED_STATUSES.has(inquiry.status));
    }
    return { id: row.id, name: row.name, location: row.location, quote: row.quote, trip: row.trip, rating: row.rating, verified };
  }));
}

function offerWindow(offer, today) {
  const from = isoDate(offer.valid_from);
  const until = isoDate(offer.valid_until);
  if (until && until < today) return 'expired';
  if (from && from > today) return 'upcoming';
  return 'current';
}

export async function publicOffers() {
  const today = todayIso();
  return (await safeList('offers')).filter(isPublished).map((offer) => ({ ...offer, window: offerWindow(offer, today) }));
}

export async function publicPosts() {
  const today = todayIso();
  return (await safeList('posts'))
    .filter((post) => isPublished(post) && (!isoDate(post.published_at) || isoDate(post.published_at) <= today))
    .sort((a, b) => String(b.published_at || b.created_at).localeCompare(String(a.published_at || a.created_at)));
}

export async function publicOpportunities() {
  const today = todayIso();
  return (await safeList('opportunities')).filter((item) => isPublished(item) && (!isoDate(item.deadline) || isoDate(item.deadline) >= today));
}

export async function publicFaqs(category) {
  const rows = (await safeList('faqs')).filter(isPublished);
  return rows
    .filter((row) => !category || row.category === category)
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || Number(a.id) - Number(b.id));
}

function siteUrl() {
  return (process.env.SITE_URL || 'https://altistravels.com').replace(/\/+$/, '');
}

function readId(name, pattern) {
  const value = String(process.env[name] || '').trim();
  return pattern.test(value) ? value : '';
}

async function buildSite() {
  const content = await loadContent();
  const contact = { ...DEFAULT_CONTACT, ...(content.contact || {}) };
  const gaId = readId('GA_MEASUREMENT_ID', /^G-[A-Z0-9]{4,20}$/);
  const pixelId = readId('META_PIXEL_ID', /^\d{8,20}$/);
  return {
    siteUrl: siteUrl(),
    contact,
    whatsappDigits: String(contact.whatsapp || contact.phone || '').replace(/\D/g, ''),
    gaId,
    pixelId,
    trackingEnabled: Boolean(gaId || pixelId),
    gscToken: readId('GOOGLE_SITE_VERIFICATION', /^[A-Za-z0-9_-]{10,100}$/),
    defaultImage: content.hero?.image || '',
    assetVersion: ASSET_VERSION
  };
}

function createContext(site, query) {
  return {
    site,
    query,
    content: loadContent,
    packages: () => safeList('packages'),
    destinations: () => safeList('destinations'),
    services: () => safeList('services'),
    gallery: () => safeList('gallery'),
    testimonials: publicTestimonials,
    currentOffers: async () => (await publicOffers()).filter((offer) => offer.window === 'current'),
    expiredOffers: async () => (await publicOffers()).filter((offer) => offer.window === 'expired').slice(0, 6),
    posts: publicPosts,
    openOpportunities: publicOpportunities,
    faqs: publicFaqs
  };
}

function send(res, status, body, { cache: cacheControl = 'public, max-age=60, stale-while-revalidate=300', type = 'text/html; charset=utf-8' } = {}) {
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res.status(status).send(body);
}

// Handles /api/render/<page>[/<slug>], which next.config.mjs rewrites the public URLs to.
export async function renderPage(req, res, segments) {
  const [pageKey, slug] = segments;
  const { path: _ignored, ...query } = req.query || {};
  const site = await buildSite();
  const ctx = createContext(site, query);

  try {
    let page;
    if (pageKey === 'package' && slug) page = await packageDetail(ctx, slug);
    else if (pageKey === 'article' && slug) page = await article(ctx, slug);
    else if (PAGES[pageKey] && !slug) page = await PAGES[pageKey](ctx);
    else throw new NotFound();

    const noStore = page.noindex || pageKey === 'my-trip';
    return send(res, page.status || 200, layout(site, page), noStore ? { cache: 'no-store' } : undefined);
  } catch (error) {
    if (error instanceof Redirect) {
      res.setHeader('Location', error.location);
      return res.status(error.status).end();
    }
    if (!(error instanceof NotFound)) console.error(`[site] Failed to render ${segments.join('/')}: ${error.stack || error.message}`);
    const page = await notFound(ctx);
    return send(res, error instanceof NotFound ? 404 : 500, layout(site, page), { cache: 'no-store' });
  }
}

export async function renderSitemap(req, res) {
  const base = siteUrl();
  const [packages, posts] = await Promise.all([safeList('packages'), publicPosts()]);
  const entries = [
    ...SITEMAP_PATHS.map((path) => ({ loc: `${base}${path}` })),
    ...packages.map((pkg) => ({ loc: `${base}${packagePath(pkg)}`, lastmod: isoDate(pkg.updated_at) })),
    ...posts.map((post) => ({ loc: `${base}${postPath(post)}`, lastmod: isoDate(post.updated_at) || isoDate(post.published_at) }))
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url><loc>${escapeHtml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;
  return send(res, 200, xml, { type: 'application/xml; charset=utf-8', cache: 'public, max-age=3600' });
}
