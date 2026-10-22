import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { ensureDatabaseReady, getDatabaseStatus } from '../../bootstrap.js';
import { describeDatabaseTarget, getAdminCredentials, isMysql } from '../../db-config.js';
import { describeMysqlError } from '../../mysql-connection.js';
import {
  clearSession,
  createSession,
  deleteRow,
  findRows,
  getRow,
  getSessionUser,
  getSiteContent,
  getUserByEmail,
  insertRow,
  listRows,
  listSiteContent,
  updateRow
} from '../../src/data-access.js';
import { ValidationError, buildInquiry, clientIp, createReference, matchesContact, publicStatus, rateLimit } from '../../src/enquiries.js';
import { slugify } from '../../src/site/html.js';
import {
  invalidateSiteCache,
  publicFaqs,
  publicOffers,
  publicOpportunities,
  publicPosts,
  publicTestimonials,
  renderPage,
  renderSitemap
} from '../../src/site/router.js';

const PUBLIC_TABLES = new Set(['destinations', 'packages', 'services', 'gallery']);
const PUBLIC_LOADERS = {
  testimonials: publicTestimonials,
  offers: publicOffers,
  posts: publicPosts,
  opportunities: publicOpportunities,
  faqs: () => publicFaqs()
};
const ADMIN_TABLES = new Set([
  'destinations', 'packages', 'services', 'testimonials', 'gallery', 'site_content', 'inquiries', 'media',
  'offers', 'posts', 'opportunities', 'faqs'
]);
const SESSION_COOKIE = 'altis_session';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const TEN_MINUTES = 10 * 60 * 1000;

function readSessionId(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').find((part) => part.trim().startsWith(`${SESSION_COOKIE}=`));
  return match ? decodeURIComponent(match.trim().slice(SESSION_COOKIE.length + 1)) : null;
}

function createSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function isHttps(req) {
  return String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' || Boolean(req.socket?.encrypted);
}

function sessionCookie(req, value, maxAge) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;
}

async function isAdmin(req) {
  const user = await getSessionUser(readSessionId(req));
  return Boolean(user && user.role === 'admin');
}

function sendError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

function isFormPost(req) {
  return String(req.headers['content-type'] || '').includes('application/x-www-form-urlencoded');
}

async function handleContent(res, key) {
  if (!key) {
    const rows = await listSiteContent();
    return res.status(200).json(
      rows.filter((row) => !String(row.key).startsWith('_')).map((row) => ({ id: row.id, key: row.key, value: parseContentValue(row.value) }))
    );
  }

  const content = String(key).startsWith('_') ? null : await getSiteContent(key);
  return content ? res.status(200).json(content) : sendError(res, 404, 'Not found');
}

function parseContentValue(rawValue) {
  if (typeof rawValue !== 'string') return rawValue || {};
  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

async function handleInquiry(req, res) {
  const payload = req.body || {};
  const formPost = isFormPost(req);

  if (!rateLimit(`inquiry:${clientIp(req)}`, 6, TEN_MINUTES)) {
    return formPost
      ? res.redirect(303, '/request-received?error=1')
      : sendError(res, 429, 'Too many requests. Please wait a few minutes, or contact us on WhatsApp.');
  }
  // Bots fill every field; people never see this one.
  if (payload.company_website) return formPost ? res.redirect(303, '/request-received?error=1') : sendError(res, 400, 'Submission rejected.');

  let row;
  try {
    row = buildInquiry(payload);
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    return formPost ? res.redirect(303, '/request-received?error=1') : sendError(res, 422, error.message, { errors: error.errors });
  }

  await insertRow('inquiries', row);

  if (formPost) return res.redirect(303, `/request-received?reference=${encodeURIComponent(row.reference)}`);
  return res.status(200).json({
    success: true,
    reference: row.reference,
    service: row.service,
    message: `Thank you. Your request ${row.reference} has been received. This is not a confirmed booking yet; a consultant will contact you within one working day.`
  });
}

async function handleStatusLookup(req, res) {
  if (!rateLimit(`status:${clientIp(req)}`, 20, TEN_MINUTES)) return sendError(res, 429, 'Too many attempts. Please try again later.');
  const reference = String(req.query.reference || '').trim().toUpperCase();
  const contact = String(req.query.contact || '');
  if (!/^AV-\d{6}-[A-Z0-9]{5}$/.test(reference) || !contact) return sendError(res, 400, 'Enter your reference and the email or phone you used.');

  const [inquiry] = await findRows('inquiries', 'reference', reference);
  // The same answer is given for an unknown reference and a wrong contact, so references cannot be probed.
  if (!inquiry || !matchesContact(inquiry, contact)) return sendError(res, 404, 'We could not find a request with those details.');
  return res.status(200).json(publicStatus(inquiry));
}

async function handleLogin(req, res) {
  if (!rateLimit(`login:${clientIp(req)}`, 10, TEN_MINUTES)) return sendError(res, 429, 'Too many sign-in attempts. Try again in a few minutes.');

  const payload = req.body || {};
  const user = await getUserByEmail(String(payload.email || '').trim());
  if (!user || !bcrypt.compareSync(String(payload.password || ''), user.password_hash)) {
    return sendError(res, 401, 'Invalid credentials');
  }

  const sessionId = createSessionId();
  await createSession(sessionId, user.id);
  res.setHeader('Set-Cookie', sessionCookie(req, sessionId, SESSION_MAX_AGE_SECONDS));
  return res.status(200).json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
}

async function handleLogout(req, res) {
  const sessionId = readSessionId(req);
  if (sessionId) await clearSession(sessionId);
  res.setHeader('Set-Cookie', sessionCookie(req, '', 0));
  return res.status(200).json({ success: true });
}

async function uniqueSlug(base, ignoreId) {
  const root = slugify(base) || 'article';
  for (let attempt = 1; attempt < 50; attempt += 1) {
    const candidate = attempt === 1 ? root : `${root}-${attempt}`;
    const [existing] = await findRows('posts', 'slug', candidate);
    if (!existing || Number(existing.id) === Number(ignoreId)) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

// Fills in values the dashboard should not have to type: enquiry references, article slugs and
// publication dates.
async function prepareAdminPayload(tableName, payload, id) {
  if (tableName === 'inquiries' && !id && !payload.reference) payload.reference = createReference();
  if (tableName === 'inquiries' && !id && !payload.status) payload.status = 'new';
  if (tableName === 'posts') {
    if (!id || 'slug' in payload) payload.slug = await uniqueSlug(payload.slug || payload.title, id);
    if (Number(payload.published) === 1 && !payload.published_at) payload.published_at = new Date().toISOString().slice(0, 10);
  }
  return payload;
}

async function handleAdminTable(req, res, tableName, segments) {
  if (!(await isAdmin(req))) return sendError(res, 401, 'Unauthorized');
  if (!ADMIN_TABLES.has(tableName)) return sendError(res, 404, 'Not found');

  const id = segments[2] ? Number(segments[2]) : null;

  if (req.method === 'GET') return res.status(200).json(id ? await getRow(tableName, id) : await listRows(tableName));

  if (req.method === 'POST') {
    const payload = await prepareAdminPayload(tableName, { ...(req.body || {}) }, null);
    delete payload.id;
    const savedId = await insertRow(tableName, payload);
    invalidateSiteCache();
    return res.status(200).json(await getRow(tableName, savedId));
  }

  if (req.method === 'PUT' && id) {
    const payload = await prepareAdminPayload(tableName, { ...(req.body || {}) }, id);
    delete payload.id;
    await updateRow(tableName, id, payload);
    invalidateSiteCache();
    return res.status(200).json(await getRow(tableName, id));
  }

  if (req.method === 'DELETE' && id) {
    await deleteRow(tableName, id);
    invalidateSiteCache();
    return res.status(200).json({ success: true });
  }

  return sendError(res, 405, 'Method not allowed');
}

export default async function handler(req, res) {
  const segments = (req.query.path || []).map((segment) => decodeURIComponent(String(segment)));
  const [resource, actionOrId] = segments;

  try {
    if (resource === 'health') {
      const status = await getDatabaseStatus();
      // Connection details are only for signed-in staff; the public sees whether the site is up.
      const detailed = status.ok ? await isAdmin(req).catch(() => false) : false;
      const body = detailed ? status : { ok: status.ok, driver: status.driver, counts: status.counts };
      return res.status(status.ok ? 200 : 503).json(body);
    }

    // Guarantees the database, its tables and the seed rows exist before any query runs. Pages
    // still render if it fails, so visitors see the site rather than an error.
    if (resource === 'render' || resource === 'sitemap') {
      await ensureDatabaseReady().catch((error) => console.error(`[site] Database not ready: ${describeMysqlError(error).message}`));
      return resource === 'sitemap' ? await renderSitemap(req, res) : await renderPage(req, res, segments.slice(1));
    }

    await ensureDatabaseReady();

    if (resource === 'content') return await handleContent(res, actionOrId);

    if (req.method === 'GET' && PUBLIC_TABLES.has(resource) && !actionOrId) return res.status(200).json(await listRows(resource));
    if (req.method === 'GET' && PUBLIC_LOADERS[resource] && !actionOrId) return res.status(200).json(await PUBLIC_LOADERS[resource]());

    if (resource === 'inquiries' && req.method === 'POST') return await handleInquiry(req, res);
    if (resource === 'requests' && actionOrId === 'status' && req.method === 'GET') return await handleStatusLookup(req, res);

    if (resource !== 'admin') return sendError(res, 404, 'Not found');

    res.setHeader('Cache-Control', 'no-store');
    if (actionOrId === 'login' && req.method === 'POST') return await handleLogin(req, res);
    if (actionOrId === 'logout' && req.method === 'POST') return await handleLogout(req, res);
    if (actionOrId === 'session' && req.method === 'GET') {
      const user = await getSessionUser(readSessionId(req));
      if (user) return res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } });
      // The sign-in page asks with ?soft=1 so being signed out is not logged as a browser error.
      return req.query.soft ? res.status(200).json({ user: null }) : sendError(res, 401, 'Unauthorized');
    }

    return await handleAdminTable(req, res, actionOrId, segments);
  } catch (error) {
    const described = describeMysqlError(error);
    const driver = isMysql() ? 'mysql' : 'sqlite';

    console.error(`[api] ${driver} error on /api/${segments.join('/')} (${described.code}): ${described.message}`);
    if (described.hint) console.error(`[api] Hint: ${described.hint}`);

    // Diagnostic details are logged and shown to signed-in staff only.
    const detailed = await isAdmin(req).catch(() => false);
    const admin = getAdminCredentials();
    return res.status(503).json({
      error: 'Service temporarily unavailable. Please try again, or contact us by phone or WhatsApp.',
      ...(detailed
        ? { detail: described.message, code: described.code, hint: described.hint, driver, target: describeDatabaseTarget(), adminPasswordIsFallback: admin.usingFallbackPassword }
        : {})
    });
  }
}
