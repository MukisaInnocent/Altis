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

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

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

const SITE_URL = 'https://www.altistravels.com';
const PUBLIC_PATHS = ['/', '/about', '/services', '/destinations', '/tours', '/honeymoon', '/corporate-travel', '/airport-transfers', '/travel-insurance', '/family-reunification', '/why-choose-us', '/gallery', '/faq', '/travel-resources', '/resources', '/privacy-policy', '/terms-and-conditions', '/contact'];
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});
app.get('/sitemap.xml', (req, res) => {
  const servicePaths = ['flight-reservations', 'visa-assistance', 'hotel-reservations', 'tour-packages', 'travel-insurance', 'airport-transfers', 'corporate-travel', 'family-reunification', 'cargo-shopping', 'university-admissions-scholarships', 'multi-country-itineraries'].map((slug) => `/services/${slug}`);
  const destinationPaths = ['bwindi', 'queen-elizabeth', 'jinja', 'ssese-islands', 'bali', 'dubai', 'paris', 'santorini'].map((slug) => `/destinations/${slug}`);
  const tourPaths = ['gorilla-trek', 'nile-source-adventure', 'classic-savanna-safari', 'dubai-desert-coast', 'bali-wellness-escape', 'european-classics', 'island-honeymoon'].map((slug) => `/tours/${slug}`);
  const urls = [...PUBLIC_PATHS, ...servicePaths, ...destinationPaths, ...tourPaths];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${SITE_URL}${url}</loc></url>`).join('')}</urlset>`;
  res.type('application/xml').send(body);
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

function settingsObject() {
  const rows = db.prepare('SELECT setting_key, setting_value FROM site_settings').all();
  return Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
}

function isUploadedImagePath(value) {
  if (!value) return true;
  const match = /^\/images\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9._-]+)$/.exec(value);
  if (!match) return false;
  return Boolean(db.prepare('SELECT 1 FROM images WHERE category = ? AND filename = ?').get(match[1], match[2]));
}

function validText(value, max = 10000) {
  return typeof value === 'string' && value.length <= max;
}

app.get('/api/site-data', (req, res) => {
  const sections = db.prepare("SELECT section_key, page_name, section_name, eyebrow, title, summary, body, image_path, seo_title, seo_description, updated_at FROM site_sections WHERE status = 'published'").all();
  const catalog = db.prepare("SELECT id, item_type, slug, title, summary, country, duration, image_path, seo_title, seo_description, sort_order FROM catalog_items WHERE status = 'published' ORDER BY item_type, sort_order, id").all();
  res.json({ settings: settingsObject(), sections, catalog });
});

app.get('/api/posts', (req, res) => {
  const posts = db.prepare("SELECT id, slug, title, excerpt, body, image_path, seo_title, seo_description, published_at FROM posts WHERE status = 'published' ORDER BY published_at DESC, id DESC").all();
  res.json(posts);
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

app.patch('/api/admin/images/:id', requireAuth, (req, res) => {
  const caption = req.body?.caption;
  if (!validText(caption, 250)) return res.status(400).json({ error: 'Alt text must be 250 characters or fewer.' });
  const result = db.prepare('UPDATE images SET caption = ? WHERE id = ?').run(caption.trim(), req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Image not found.' });
  res.json({ ok: true });
});

app.delete('/api/admin/images/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Image not found.' });
  const imagePath = `/images/${row.category}/${row.filename}`;
  const inUse = db.prepare('SELECT (SELECT COUNT(*) FROM site_sections WHERE image_path = ?) + (SELECT COUNT(*) FROM catalog_items WHERE image_path = ?) + (SELECT COUNT(*) FROM posts WHERE image_path = ?) AS count').get(imagePath, imagePath, imagePath).count;
  if (inUse) return res.status(409).json({ error: 'This image is in use by published or draft content. Replace it there before deleting.' });
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
  const totalPosts = db.prepare('SELECT COUNT(*) AS c FROM posts').get().c;
  const draftPosts = db.prepare("SELECT COUNT(*) AS c FROM posts WHERE status = 'draft'").get().c;
  const totalSections = db.prepare('SELECT COUNT(*) AS c FROM site_sections').get().c;
  res.json({ totalInquiries, unreadInquiries, totalImages, activeImages, totalPosts, draftPosts, totalSections, recentEvents });
});

// ---------- Admin: content management ----------
app.get('/api/admin/settings', requireAuth, (req, res) => {
  res.json(settingsObject());
});

app.put('/api/admin/settings', requireAuth, (req, res) => {
  const settings = req.body?.settings;
  if (!settings || Array.isArray(settings) || typeof settings !== 'object') return res.status(400).json({ error: 'Settings must be an object.' });
  const save = db.prepare("INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP");
  try {
    db.transaction(() => Object.entries(settings).forEach(([key, value]) => {
      if (!/^[a-z0-9_]{2,80}$/.test(key) || !validText(value, 5000)) throw new Error('One or more settings are invalid.');
      save.run(key, value.trim());
    }))();
    res.json({ ok: true });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/admin/sections', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM site_sections ORDER BY page_name, id').all());
});

app.put('/api/admin/sections/:id', requireAuth, (req, res) => {
  const item = req.body || {};
  if (!validText(item.eyebrow, 300) || !validText(item.title, 300) || !validText(item.summary, 3000) || !validText(item.body, 12000) || !validText(item.seo_title, 300) || !validText(item.seo_description, 1000) || !isUploadedImagePath(item.image_path || '')) return res.status(400).json({ error: 'Use text within the field limits and select an uploaded image.' });
  const status = item.status === 'draft' ? 'draft' : 'published';
  const result = db.prepare('UPDATE site_sections SET eyebrow=?, title=?, summary=?, body=?, image_path=?, seo_title=?, seo_description=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(item.eyebrow.trim(), item.title.trim(), item.summary.trim(), item.body.trim(), item.image_path || '', item.seo_title.trim(), item.seo_description.trim(), status, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Section not found.' });
  res.json({ ok: true });
});

app.get('/api/admin/catalog', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM catalog_items ORDER BY item_type, sort_order, id').all());
});

function saveCatalog(req, res, isNew) {
  const item = req.body || {};
  if (!['service', 'destination', 'tour'].includes(item.item_type) || !/^[a-z0-9-]{2,120}$/.test(item.slug || '') || !validText(item.title, 300) || !validText(item.summary, 3000) || !validText(item.country, 300) || !validText(item.duration, 100) || !validText(item.seo_title, 300) || !validText(item.seo_description, 1000) || !isUploadedImagePath(item.image_path || '') || (['destination', 'tour'].includes(item.item_type) && !item.image_path)) return res.status(400).json({ error: 'Complete the required fields and choose an uploaded image for every destination or tour.' });
  const status = item.status === 'draft' ? 'draft' : 'published';
  try {
    if (isNew) {
      const result = db.prepare('INSERT INTO catalog_items (item_type, slug, title, summary, country, duration, image_path, seo_title, seo_description, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(item.item_type, item.slug, item.title.trim(), item.summary.trim(), item.country.trim(), item.duration.trim(), item.image_path || '', item.seo_title.trim(), item.seo_description.trim(), status, Number(item.sort_order) || 0);
      return res.status(201).json({ id: result.lastInsertRowid });
    }
    const result = db.prepare('UPDATE catalog_items SET slug=?, title=?, summary=?, country=?, duration=?, image_path=?, seo_title=?, seo_description=?, status=?, sort_order=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(item.slug, item.title.trim(), item.summary.trim(), item.country.trim(), item.duration.trim(), item.image_path || '', item.seo_title.trim(), item.seo_description.trim(), status, Number(item.sort_order) || 0, req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Catalog item not found.' });
    res.json({ ok: true });
  } catch { res.status(409).json({ error: 'That URL slug is already in use for this item type.' }); }
}
app.post('/api/admin/catalog', requireAuth, (req, res) => saveCatalog(req, res, true));
app.put('/api/admin/catalog/:id', requireAuth, (req, res) => saveCatalog(req, res, false));

app.get('/api/admin/posts', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM posts ORDER BY updated_at DESC, id DESC').all());
});

function savePost(req, res, isNew) {
  const post = req.body || {};
  if (!/^[a-z0-9-]{3,120}$/.test(post.slug || '') || !validText(post.title, 300) || !validText(post.excerpt, 3000) || !validText(post.body, 20000) || !validText(post.seo_title, 300) || !validText(post.seo_description, 1000) || !isUploadedImagePath(post.image_path || '')) return res.status(400).json({ error: 'Use a lowercase URL slug, valid text and an uploaded image.' });
  const status = post.status === 'published' ? 'published' : 'draft';
  try {
    if (isNew) {
      const result = db.prepare('INSERT INTO posts (slug, title, excerpt, body, image_path, seo_title, seo_description, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(post.slug, post.title.trim(), post.excerpt.trim(), post.body.trim(), post.image_path || '', post.seo_title.trim(), post.seo_description.trim(), status, status === 'published' ? new Date().toISOString() : null);
      return res.status(201).json({ id: result.lastInsertRowid });
    }
    const result = db.prepare("UPDATE posts SET slug=?, title=?, excerpt=?, body=?, image_path=?, seo_title=?, seo_description=?, status=?, published_at=CASE WHEN ?='published' AND published_at IS NULL THEN CURRENT_TIMESTAMP WHEN ?='draft' THEN NULL ELSE published_at END, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(post.slug, post.title.trim(), post.excerpt.trim(), post.body.trim(), post.image_path || '', post.seo_title.trim(), post.seo_description.trim(), status, status, status, req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Post not found.' });
    res.json({ ok: true });
  } catch { res.status(409).json({ error: 'That post URL is already in use.' }); }
}
app.post('/api/admin/posts', requireAuth, (req, res) => savePost(req, res, true));
app.put('/api/admin/posts/:id', requireAuth, (req, res) => savePost(req, res, false));

// ---------- Serve built React frontend (SPA) ----------
// Must come AFTER all API routes so /api/* routes are matched first.
if (fs.existsSync(STATIC_ROOT)) {
  app.use(express.static(STATIC_ROOT, { maxAge: '7d' }));
  // SPA fallback: send index.html for any route not matched above.
  // Express 5 uses path-to-regexp v8, where a wildcard must be named.
  // This form also matches the site root, so SPA routes such as /admin work.
  app.get('/{*splat}', (req, res) => {
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
