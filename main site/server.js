import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { getDb, getSiteContent, listSiteContent, ensureUser, getUserByEmail, createSession, getSessionUser, clearSession, saveJsonTable, removeRecord, updateJsonTable } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(__dirname, 'uploads');
const db = getDb();

fs.mkdirSync(uploadsDir, { recursive: true });

const PORT = Number(process.env.PORT || 4000);
const SESSION_COOKIE = 'altis_session';
const ADMIN_EMAIL = 'admin@altistravels.com';

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function getSessionFromRequest(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').find((part) => part.trim().startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  return match.split('=')[1];
}

function isAdminRequest(req) {
  const sessionId = getSessionFromRequest(req);
  if (!sessionId) return false;
  const user = getSessionUser(sessionId);
  return Boolean(user && user.role === 'admin');
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return reject(new Error('Missing multipart boundary'));

    let raw = Buffer.alloc(0);
    req.on('data', (chunk) => {
      raw = Buffer.concat([raw, chunk]);
    });

    req.on('end', () => {
      const boundaryMarker = `--${boundary}`;
      const parts = raw.toString('binary').split(boundaryMarker);
      const result = { fields: {}, files: [] };

      for (const part of parts) {
        if (!part.includes('Content-Disposition')) continue;
        const section = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
        const match = section.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?\r\n\r\n([\s\S]*?)\r\n$/);
        if (!match) continue;

        const [, name, filename, valueRaw] = match;
        const value = Buffer.from(valueRaw, 'binary');

        if (filename) {
          const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
          const filePath = path.join(uploadsDir, safeName);
          fs.writeFileSync(filePath, value);
          result.files.push({ name, filename: safeName, path: filePath });
        } else {
          result.fields[name] = value.toString('utf8').replace(/\r\n$/, '');
        }
      }

      resolve(result);
    });

    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  const segments = pathname.split('/').filter(Boolean);

  if (req.method === 'OPTIONS') {
    return res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }).end();
  }

  if (segments[0] === 'api' && segments[1] === 'content') {
    const key = segments[2];
    if (!key) {
      const rows = listSiteContent();
      return json(res, 200, rows.map((row) => ({ id: row.id, key: row.key, value: JSON.parse(row.value || '{}') })));
    }
    const content = getSiteContent(key);
    return json(res, content ? 200 : 404, content || { code: 404, message: 'Not found' });
  }

  if (segments[0] === 'api' && segments[1] === 'destinations') {
    const rows = db.prepare('SELECT * FROM destinations ORDER BY created_at DESC').all();
    return json(res, 200, rows);
  }

  if (segments[0] === 'api' && segments[1] === 'packages') {
    const rows = db.prepare('SELECT * FROM packages ORDER BY created_at DESC').all();
    return json(res, 200, rows);
  }

  if (segments[0] === 'api' && segments[1] === 'services') {
    const rows = db.prepare('SELECT * FROM services ORDER BY created_at DESC').all();
    return json(res, 200, rows);
  }

  if (segments[0] === 'api' && segments[1] === 'testimonials') {
    const rows = db.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all();
    return json(res, 200, rows);
  }

  if (segments[0] === 'api' && segments[1] === 'gallery') {
    const rows = db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
    return json(res, 200, rows);
  }

  if (segments[0] === 'api' && segments[1] === 'inquiries' && req.method === 'POST') {
    const payload = await readBody(req);
    const record = {
      name: payload.name || '',
      email: payload.email || '',
      phone: payload.phone || '',
      interest: payload.interest || '',
      message: payload.message || '',
      status: 'new'
    };
    const stmt = db.prepare(`INSERT INTO inquiries (name, email, phone, interest, message, status) VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run(record.name, record.email, record.phone, record.interest, record.message, record.status);
    return json(res, 200, { success: true, message: 'Inquiry saved successfully' });
  }

  if (segments[0] === 'api' && segments[1] === 'admin' && segments[2] === 'login' && req.method === 'POST') {
    const payload = await readBody(req);
    const user = getUserByEmail(payload.email || '');
    if (!user || !bcrypt.compareSync(payload.password || '', user.password_hash)) {
      return json(res, 401, { error: 'Invalid credentials' });
    }

    const sessionId = cryptoRandom();
    createSession(sessionId, user.id);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ success: true, user: { id: user.id, email: user.email, role: user.role } }));
    return;
  }

  if (segments[0] === 'api' && segments[1] === 'admin' && segments[2] === 'logout' && req.method === 'POST') {
    const sessionId = getSessionFromRequest(req);
    if (sessionId) clearSession(sessionId);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (segments[0] === 'api' && segments[1] === 'admin' && segments[2] === 'session') {
    const sessionId = getSessionFromRequest(req);
    const user = sessionId ? getSessionUser(sessionId) : null;
    if (!user) return json(res, 401, { error: 'Unauthorized' });
    return json(res, 200, { user: { id: user.id, email: user.email, role: user.role } });
  }

  if (segments[0] === 'api' && segments[1] === 'admin' && segments[2] && segments[2] !== 'login' && segments[2] !== 'session' && segments[2] !== 'logout') {
    if (!isAdminRequest(req)) return json(res, 401, { error: 'Unauthorized' });
    const tableName = segments[2];
    const id = segments[3] ? Number(segments[3]) : null;

    if (req.method === 'GET') {
      const rows = db.prepare(`SELECT * FROM ${tableName} ORDER BY created_at DESC`).all();
      return json(res, 200, rows);
    }

    if (req.method === 'POST') {
      const payload = await readBody(req);
      const savedId = saveJsonTable(tableName, payload);
      const created = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(savedId);
      return json(res, 200, created);
    }

    if (req.method === 'PUT' && id) {
      const payload = await readBody(req);
      delete payload.id;
      updateJsonTable(tableName, id, payload);
      const updated = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
      return json(res, 200, updated);
    }

    if (req.method === 'DELETE' && id) {
      removeRecord(tableName, id);
      return json(res, 200, { success: true });
    }
  }

  return json(res, 404, { error: 'Not found' });
}

function serveStatic(req, res, pathname) {
  const rawPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = rawPath.endsWith('/') ? `${rawPath}index.html` : rawPath;
  const filePath = path.join(publicDir, safePath);
  const normalized = path.normalize(filePath);

  if (!normalized.startsWith(publicDir)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  const resolvedPath = fs.existsSync(normalized) && fs.statSync(normalized).isDirectory()
    ? path.join(normalized, 'index.html')
    : normalized;

  if (!fs.existsSync(resolvedPath)) {
    const fallback = path.join(publicDir, 'index.html');
    if (fs.existsSync(fallback)) {
      const stream = fs.createReadStream(fallback);
      stream.pipe(res);
      return;
    }
    res.writeHead(404); res.end('Not found'); return;
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
  }[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(resolvedPath).pipe(res);
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    try {
      await handleApi(req, res, pathname);
    } catch (error) {
      console.error(error);
      json(res, 500, { error: error.message || 'Server error' });
    }
    return;
  }

  serveStatic(req, res, pathname);
});

const adminEmail = ADMIN_EMAIL;
const adminPassword = 'admin123';
const adminHash = bcrypt.hashSync(adminPassword, 10);
ensureUser(adminEmail, adminHash);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Altis Voyage vanilla server running on http://0.0.0.0:${PORT}`);
  console.log(`Admin login: ${ADMIN_EMAIL} / admin123`);
});
