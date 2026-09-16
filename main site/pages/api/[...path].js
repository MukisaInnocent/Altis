import bcrypt from 'bcryptjs';
import sqliteDb, {
  getSiteContent as getSqliteContent,
  listSiteContent as listSqliteContent,
  ensureUser as ensureSqliteUser,
  getUserByEmail as getSqliteUser,
  createSession as createSqliteSession,
  getSessionUser as getSqliteSessionUser,
  clearSession as clearSqliteSession,
  saveJsonTable as saveSqliteRow,
  removeRecord as removeSqliteRow,
  updateJsonTable as updateSqliteRow
} from '../../db.js';

const useMysql = Boolean(process.env.DB_HOST);
const mysqlDb = useMysql ? await import('../../mysql-db.js') : null;
if (useMysql) await mysqlDb.initializeMysql();

const adminEmail = process.env.ADMIN_EMAIL || 'admin@altistravels.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const adminTables = new Set(['destinations', 'packages', 'services', 'testimonials', 'gallery', 'site_content', 'inquiries']);

if (useMysql) {
  await mysqlDb.ensureUser(adminEmail, bcrypt.hashSync(adminPassword, 10));
} else {
  ensureSqliteUser(adminEmail, bcrypt.hashSync(adminPassword, 10));
}

async function listRows(tableName) {
  return useMysql ? mysqlDb.listRows(tableName) : sqliteDb.prepare(`SELECT * FROM ${tableName} ORDER BY created_at DESC`).all();
}

async function getRow(tableName, id) {
  return useMysql ? mysqlDb.getRow(tableName, id) : sqliteDb.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
}

async function getUserByEmail(email) {
  return useMysql ? mysqlDb.getUserByEmail(email) : getSqliteUser(email);
}

async function getSessionUser(sessionId) {
  if (!sessionId) return null;
  return useMysql ? mysqlDb.getSessionUser(sessionId) : getSqliteSessionUser(sessionId);
}

function getSessionId(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').find((part) => part.trim().startsWith('altis_session='));
  return cookie ? cookie.trim().split('=').slice(1).join('=') : null;
}

async function isAdmin(req) {
  const user = await getSessionUser(getSessionId(req));
  return Boolean(user && user.role === 'admin');
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

export default async function handler(req, res) {
  const segments = (req.query.path || []).map((segment) => decodeURIComponent(segment));
  const [resource, actionOrId] = segments;

  if (resource === 'content') {
    if (!actionOrId) {
      const rows = useMysql ? await mysqlDb.listSiteContent() : listSqliteContent();
      return res.status(200).json(rows.map((row) => ({ id: row.id, key: row.key, value: JSON.parse(row.value || '{}') })));
    }
    const content = useMysql ? await mysqlDb.getSiteContent(actionOrId) : getSqliteContent(actionOrId);
    return content ? res.status(200).json(content) : sendError(res, 404, 'Not found');
  }

  if (['destinations', 'packages', 'services', 'testimonials', 'gallery'].includes(resource) && req.method === 'GET') {
    return res.status(200).json(await listRows(resource));
  }

  if (resource === 'inquiries' && req.method === 'POST') {
    const payload = req.body || {};
    const row = { name: payload.name || '', email: payload.email || '', phone: payload.phone || '', interest: payload.interest || '', message: payload.message || '', status: 'new' };
    if (useMysql) await mysqlDb.insertRow('inquiries', row);
    else sqliteDb.prepare('INSERT INTO inquiries (name, email, phone, interest, message, status) VALUES (?, ?, ?, ?, ?, ?)').run(row.name, row.email, row.phone, row.interest, row.message, row.status);
    return res.status(200).json({ success: true, message: 'Inquiry saved successfully' });
  }

  if (resource !== 'admin') return sendError(res, 404, 'Not found');

  if (actionOrId === 'login' && req.method === 'POST') {
    const payload = req.body || {};
    const user = await getUserByEmail(payload.email || '');
    if (!user || !bcrypt.compareSync(payload.password || '', user.password_hash)) return sendError(res, 401, 'Invalid credentials');
    const sessionId = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    if (useMysql) await mysqlDb.createSession(sessionId, user.id); else createSqliteSession(sessionId, user.id);
    res.setHeader('Set-Cookie', `altis_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
    return res.status(200).json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
  }

  if (actionOrId === 'logout' && req.method === 'POST') {
    const sessionId = getSessionId(req);
    if (sessionId) {
      if (useMysql) await mysqlDb.clearSession(sessionId);
      else clearSqliteSession(sessionId);
    }
    res.setHeader('Set-Cookie', 'altis_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return res.status(200).json({ success: true });
  }

  if (actionOrId === 'session' && req.method === 'GET') {
    const user = await getSessionUser(getSessionId(req));
    return user ? res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } }) : sendError(res, 401, 'Unauthorized');
  }

  const tableName = actionOrId;
  if (!(await isAdmin(req)) || !adminTables.has(tableName)) return sendError(res, 401, 'Unauthorized');

  const id = segments[2] ? Number(segments[2]) : null;
  if (req.method === 'GET') return res.status(200).json(await listRows(tableName));
  if (req.method === 'POST') {
    const savedId = useMysql ? await mysqlDb.insertRow(tableName, req.body || {}) : saveSqliteRow(tableName, req.body || {});
    return res.status(200).json(await getRow(tableName, savedId));
  }
  if (req.method === 'PUT' && id) {
    const payload = { ...(req.body || {}) };
    delete payload.id;
    if (useMysql) await mysqlDb.updateRow(tableName, id, payload);
    else updateSqliteRow(tableName, id, payload);
    return res.status(200).json(await getRow(tableName, id));
  }
  if (req.method === 'DELETE' && id) {
    if (useMysql) await mysqlDb.deleteRow(tableName, id);
    else removeSqliteRow(tableName, id);
    return res.status(200).json({ success: true });
  }

  return sendError(res, 405, 'Method not allowed');
}
