require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Path to the built React frontend.
// __dirname = backend/src  →  '..' = backend/  →  '../frontend/dist' = backend/frontend/dist
const defaultStaticRoot = path.join(__dirname, '..', 'frontend', 'dist');
const STATIC_ROOT = fs.existsSync(defaultStaticRoot) 
  ? defaultStaticRoot 
  : (process.env.STATIC_ROOT || defaultStaticRoot);
const multer = require('multer');
const bcrypt = require('bcryptjs');

const { db, syncImagesFromDisk, IMAGES_ROOT } = require('./db');
const { signToken, requireAuth } = require('./auth');

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json());

syncImagesFromDisk();

app.get('/images/slot/:slot', (req, res) => {
  const row = db.prepare('SELECT category, filename FROM images WHERE slot = ? AND active = 1').get(req.params.slot);
  const fallback = String(req.query.fallback || '');
  const fallbackPath = /^((hero|about|destinations|tours)\/[a-zA-Z0-9._-]+|gallery\/[a-zA-Z0-9._-]+)$/.test(fallback)
    ? path.join(IMAGES_ROOT, fallback)
    : null;
  const filePath = row ? path.join(IMAGES_ROOT, row.category, row.filename) : fallbackPath;
  if (!filePath || !fs.existsSync(filePath)) return res.status(404).end();
  res.sendFile(filePath);
});

// Serve the actual image files straight from their category folders.
app.use('/images', express.static(IMAGES_ROOT, { maxAge: '7d' }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

const VALID_CATEGORIES = fs.readdirSync(IMAGES_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

function inferSlot(category, filename) {
  const name = path.basename(filename, path.extname(filename)).toLowerCase();
  if (category === 'hero') return name === 'sunset-savanna' ? 'hero-secondary' : 'hero';
  if (category === 'about') return 'about';
  if (category === 'destinations' && ['bwindi', 'queen-elizabeth', 'jinja', 'ssese-islands'].includes(name)) return `destination:${name}`;
  if (category === 'tours' && ['gorilla-trek', 'nile-adventure', 'savanna-safari'].includes(name)) return `tour:${name}`;
  return null;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const category = req.params.category || req.body.category;
      if (!VALID_CATEGORIES.includes(category)) {
        return cb(new Error('Unknown image category.'));
      }
      cb(null, path.join(IMAGES_ROOT, category));
    },
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-').toLowerCase();
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only image files are allowed.'), ok);
  },
});

// Keep the old endpoint working for already-open or cached admin pages.
const legacyUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only image files are allowed.'), ok);
  },
});

// ---------- Public: images ----------
// Returns only ACTIVE images, grouped by category, in sort order.
app.get('/api/images', (req, res) => {
  syncImagesFromDisk();
  const rows = db
    .prepare('SELECT id, category, filename, caption, slot FROM images WHERE active = 1 ORDER BY category, sort_order, id')
    .all();
  const grouped = {};
  const slots = {};
  for (const r of rows) {
    grouped[r.category] = grouped[r.category] || [];
    const image = { id: r.id, url: `/images/${r.category}/${r.filename}`, caption: r.caption, slot: r.slot };
    grouped[r.category].push(image);
    if (r.slot) slots[r.slot] = image;
  }
  res.json({ ...grouped, slots });
});

// ---------- Public: inquiries ----------
app.post('/api/inquiries', (req, res) => {
  const { name, email, phone, destination, message } = req.body || {};
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required.' });
  }
  db.prepare(
    'INSERT INTO inquiries (name, email, phone, destination, message) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email || '', phone || '', destination || '', message);
  db.prepare('INSERT INTO stats (event, meta) VALUES (?, ?)').run('inquiry_submitted', destination || '');
  res.status(201).json({ ok: true });
});

// ---------- Public: lightweight stats ping (e.g. page views) ----------
app.post('/api/stats/ping', (req, res) => {
  const { event, meta } = req.body || {};
  if (!event) return res.status(400).json({ error: 'event is required.' });
  db.prepare('INSERT INTO stats (event, meta) VALUES (?, ?)').run(event, meta || '');
  res.status(201).json({ ok: true });
});

// ---------- Admin: auth ----------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }
  const token = signToken({ id: admin.id, username: admin.username });
  res.json({ token, username: admin.username });
});

app.post('/api/admin/change-password', requireAuth, (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, req.admin.id);
  res.json({ ok: true });
});

// ---------- Admin: all images (active + inactive) ----------
app.get('/api/admin/images', requireAuth, (req, res) => {
  syncImagesFromDisk();
  const rows = db.prepare('SELECT * FROM images ORDER BY category, sort_order, id').all();
  const grouped = {};
  for (const r of rows) {
    grouped[r.category] = grouped[r.category] || [];
    grouped[r.category].push({ ...r, url: `/images/${r.category}/${r.filename}` });
  }
  res.json({ categories: VALID_CATEGORIES, images: grouped });
});

app.post('/api/admin/images', requireAuth, legacyUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
  const category = req.body.category;
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Unknown image category.' });
  }
  const safe = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-').toLowerCase();
  const filename = `${Date.now()}-${safe}`;
  const slot = (req.body.slot || '').trim() || inferSlot(category, req.file.originalname);
  if (slot) db.prepare('UPDATE images SET active = 0 WHERE category = ? AND slot = ?').run(category, slot);
  fs.writeFileSync(path.join(IMAGES_ROOT, category, filename), req.file.buffer);
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM images WHERE category = ?')
    .get(category).m;
  const info = db
    .prepare('INSERT INTO images (category, filename, active, sort_order, caption, slot) VALUES (?, ?, 1, ?, ?, ?)')
    .run(category, filename, maxOrder + 1, req.body.caption || '', slot);
  res.status(201).json({ id: info.lastInsertRowid, url: `/images/${category}/${filename}`, slot });
});

app.patch('/api/admin/images/:id/toggle', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Image not found.' });
  db.prepare('UPDATE images SET active = ? WHERE id = ?').run(row.active ? 0 : 1, row.id);
  res.json({ ok: true, active: !row.active });
});

app.delete('/api/admin/images/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Image not found.' });
  const filePath = path.join(IMAGES_ROOT, row.category, row.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM images WHERE id = ?').run(row.id);
  res.json({ ok: true });
});

app.post('/api/admin/images/:category', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
  const category = req.params.category;
  const slot = (req.body.slot || '').trim() || inferSlot(category, req.file.originalname);
  if (slot) db.prepare('UPDATE images SET active = 0 WHERE category = ? AND slot = ?').run(category, slot);
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM images WHERE category = ?')
    .get(category).m;
  const info = db
    .prepare('INSERT INTO images (category, filename, active, sort_order, caption, slot) VALUES (?, ?, 1, ?, ?, ?)')
    .run(category, req.file.filename, maxOrder + 1, req.body.caption || '', slot);
  res.status(201).json({ id: info.lastInsertRowid, url: `/images/${category}/${req.file.filename}`, slot });
});

// ---------- Admin: inquiries + stats dashboard ----------
app.get('/api/admin/inquiries', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
  res.json(rows);
});

app.patch('/api/admin/inquiries/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE inquiries SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/stats', requireAuth, (req, res) => {
  const totalInquiries = db.prepare('SELECT COUNT(*) AS c FROM inquiries').get().c;
  const unreadInquiries = db.prepare('SELECT COUNT(*) AS c FROM inquiries WHERE read = 0').get().c;
  const totalImages = db.prepare('SELECT COUNT(*) AS c FROM images').get().c;
  const activeImages = db.prepare('SELECT COUNT(*) AS c FROM images WHERE active = 1').get().c;
  const recentEvents = db.prepare('SELECT event, COUNT(*) AS c FROM stats GROUP BY event ORDER BY c DESC').all();
  res.json({ totalInquiries, unreadInquiries, totalImages, activeImages, recentEvents });
});

// ---------- Serve built React frontend (SPA) ----------
// Must come AFTER all API routes so /api/* routes are matched first.
if (fs.existsSync(STATIC_ROOT)) {
  app.use(express.static(STATIC_ROOT, { maxAge: '7d' }));
  // SPA fallback: send index.html for any route not matched above.
  app.get('*', (req, res) => {
    res.sendFile(path.join(STATIC_ROOT, 'index.html'));
  });
  console.log(`[static] Serving frontend from: ${STATIC_ROOT}`);
} else {
  console.warn(`[static] Frontend dist not found at: ${STATIC_ROOT}`);
  console.warn('[static] Run: cd frontend && npm ci && npm run build');
}

app.listen(PORT, HOST, () => {
  console.log(`Altis Voyage backend running on http://${HOST}:${PORT}`);
});
