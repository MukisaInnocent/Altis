import bcrypt from 'bcryptjs';
import { ensureDatabaseReady, getDatabaseStatus } from '../../bootstrap.js';
import { describeDatabaseTarget, getAdminCredentials, isMysql } from '../../db-config.js';
import { describeMysqlError } from '../../mysql-connection.js';
import {
  clearSession,
  createSession,
  deleteRow,
  getRow,
  getSessionUser,
  getSiteContent,
  getUserByEmail,
  insertRow,
  listRows,
  listSiteContent,
  updateRow
} from '../../src/data-access.js';

const PUBLIC_RESOURCES = new Set(['destinations', 'packages', 'services', 'testimonials', 'gallery']);
const ADMIN_TABLES = new Set(['destinations', 'packages', 'services', 'testimonials', 'gallery', 'site_content', 'inquiries', 'media']);
const SESSION_COOKIE = 'altis_session';

function readSessionId(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').find((part) => part.trim().startsWith(`${SESSION_COOKIE}=`));
  return match ? decodeURIComponent(match.trim().slice(SESSION_COOKIE.length + 1)) : null;
}

function createSessionId() {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

async function isAdmin(req) {
  const user = await getSessionUser(readSessionId(req));
  return Boolean(user && user.role === 'admin');
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

async function handleContent(res, key) {
  if (!key) {
    const rows = await listSiteContent();
    return res.status(200).json(rows.map((row) => ({ id: row.id, key: row.key, value: parseContentValue(row.value) })));
  }

  const content = await getSiteContent(key);
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
  await insertRow('inquiries', {
    name: payload.name || '',
    email: payload.email || '',
    phone: payload.phone || '',
    interest: payload.interest || '',
    message: payload.message || '',
    status: 'new'
  });
  return res.status(200).json({ success: true, message: 'Inquiry saved successfully' });
}

async function handleLogin(req, res) {
  const payload = req.body || {};
  const user = await getUserByEmail(payload.email || '');
  if (!user || !bcrypt.compareSync(payload.password || '', user.password_hash)) {
    return sendError(res, 401, 'Invalid credentials');
  }

  const sessionId = createSessionId();
  await createSession(sessionId, user.id);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
  return res.status(200).json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
}

async function handleLogout(req, res) {
  const sessionId = readSessionId(req);
  if (sessionId) await clearSession(sessionId);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res.status(200).json({ success: true });
}

async function handleAdminTable(req, res, tableName, segments) {
  if (!(await isAdmin(req)) || !ADMIN_TABLES.has(tableName)) return sendError(res, 401, 'Unauthorized');

  const id = segments[2] ? Number(segments[2]) : null;

  if (req.method === 'GET') return res.status(200).json(await listRows(tableName));

  if (req.method === 'POST') {
    const savedId = await insertRow(tableName, req.body || {});
    return res.status(200).json(await getRow(tableName, savedId));
  }

  if (req.method === 'PUT' && id) {
    const payload = { ...(req.body || {}) };
    delete payload.id;
    await updateRow(tableName, id, payload);
    return res.status(200).json(await getRow(tableName, id));
  }

  if (req.method === 'DELETE' && id) {
    await deleteRow(tableName, id);
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
      return res.status(status.ok ? 200 : 503).json(status);
    }

    // Guarantees the database, its tables and the seed rows exist before any query runs.
    await ensureDatabaseReady();

    if (resource === 'content') return await handleContent(res, actionOrId);

    if (PUBLIC_RESOURCES.has(resource) && req.method === 'GET') {
      return res.status(200).json(await listRows(resource));
    }

    if (resource === 'inquiries' && req.method === 'POST') return await handleInquiry(req, res);

    if (resource !== 'admin') return sendError(res, 404, 'Not found');

    if (actionOrId === 'login' && req.method === 'POST') return await handleLogin(req, res);
    if (actionOrId === 'logout' && req.method === 'POST') return await handleLogout(req, res);
    if (actionOrId === 'session' && req.method === 'GET') {
      const user = await getSessionUser(readSessionId(req));
      return user
        ? res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } })
        : sendError(res, 401, 'Unauthorized');
    }

    return await handleAdminTable(req, res, actionOrId, segments);
  } catch (error) {
    const described = describeMysqlError(error);
    const driver = isMysql() ? 'mysql' : 'sqlite';
    const admin = getAdminCredentials();

    console.error(`[api] ${driver} error on /api/${segments.join('/')} (${described.code}): ${described.message}`);
    if (described.hint) console.error(`[api] Hint: ${described.hint}`);

    return res.status(503).json({
      error: 'Database unavailable.',
      detail: described.message,
      code: described.code,
      hint: described.hint,
      driver,
      target: describeDatabaseTarget(),
      adminEmail: admin.email,
      adminPasswordIsFallback: admin.usingFallbackPassword
    });
  }
}
