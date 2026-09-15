import bcrypt from 'bcryptjs';
import {
  getDb,
  getSiteContent,
  listSiteContent,
  ensureUser,
  getUserByEmail,
  createSession,
  getSessionUser,
  clearSession,
  saveJsonTable,
  removeRecord,
  updateJsonTable
} from '../../db.js';

const db = getDb();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@altistravels.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD must be set in production');
const ADMIN_TABLES = new Set(['destinations', 'packages', 'services', 'testimonials', 'gallery', 'site_content', 'inquiries']);

ensureUser(ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10));

function getSessionId(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').find((part) => part.trim().startsWith('altis_session='));
  return cookie ? cookie.trim().split('=').slice(1).join('=') : null;
}

function isAdmin(req) {
  const id = getSessionId(req);
  const user = id ? getSessionUser(id) : null;
  return Boolean(user && user.role === 'admin');
}

function createSessionId() {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

export default async function handler(req, res) {
  const segments = (req.query.path || []).map((segment) => decodeURIComponent(segment));
  const [resource, actionOrId] = segments;

  if (resource === 'content') {
    if (!actionOrId) {
      const rows = listSiteContent();
      return res.status(200).json(rows.map((row) => ({ id: row.id, key: row.key, value: JSON.parse(row.value || '{}') })));
    }
    const content = getSiteContent(actionOrId);
    return content ? res.status(200).json(content) : sendError(res, 404, 'Not found');
  }

  if (['destinations', 'packages', 'services', 'testimonials', 'gallery'].includes(resource) && req.method === 'GET') {
    return res.status(200).json(db.prepare(`SELECT * FROM ${resource} ORDER BY created_at DESC`).all());
  }

  if (resource === 'inquiries' && req.method === 'POST') {
    const payload = req.body || {};
    db.prepare('INSERT INTO inquiries (name, email, phone, interest, message, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(payload.name || '', payload.email || '', payload.phone || '', payload.interest || '', payload.message || '', 'new');
    return res.status(200).json({ success: true, message: 'Inquiry saved successfully' });
  }

  if (resource !== 'admin') return sendError(res, 404, 'Not found');

  if (actionOrId === 'login' && req.method === 'POST') {
    const payload = req.body || {};
    const user = getUserByEmail(payload.email || '');
    if (!user || !bcrypt.compareSync(payload.password || '', user.password_hash)) return sendError(res, 401, 'Invalid credentials');
    const id = createSessionId();
    createSession(id, user.id);
    res.setHeader('Set-Cookie', `altis_session=${id}; Path=/; HttpOnly; SameSite=Lax`);
    return res.status(200).json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
  }

  if (actionOrId === 'logout' && req.method === 'POST') {
    const id = getSessionId(req);
    if (id) clearSession(id);
    res.setHeader('Set-Cookie', 'altis_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return res.status(200).json({ success: true });
  }

  if (actionOrId === 'session' && req.method === 'GET') {
    const id = getSessionId(req);
    const user = id ? getSessionUser(id) : null;
    return user ? res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } }) : sendError(res, 401, 'Unauthorized');
  }

  const tableName = actionOrId;
  if (!isAdmin(req) || !ADMIN_TABLES.has(tableName)) return sendError(res, 401, 'Unauthorized');

  const id = segments[2] ? Number(segments[2]) : null;
  if (req.method === 'GET') return res.status(200).json(db.prepare(`SELECT * FROM ${tableName} ORDER BY created_at DESC`).all());
  if (req.method === 'POST') {
    const savedId = saveJsonTable(tableName, req.body || {});
    return res.status(200).json(db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(savedId));
  }
  if (req.method === 'PUT' && id) {
    const payload = { ...(req.body || {}) };
    delete payload.id;
    updateJsonTable(tableName, id, payload);
    return res.status(200).json(db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id));
  }
  if (req.method === 'DELETE' && id) {
    removeRecord(tableName, id);
    return res.status(200).json({ success: true });
  }

  return sendError(res, 405, 'Method not allowed');
}