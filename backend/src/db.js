const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DATA_ROOT = process.env.DATA_ROOT || path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_ROOT, 'altis.db');
const IMAGES_ROOT = process.env.IMAGES_ROOT || path.join(__dirname, '..', 'images');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  filename TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  caption TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, filename)
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  destination TEXT,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  read INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  meta TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Add slot support to databases created before image replacement was added.
const imageColumns = db.prepare('PRAGMA table_info(images)').all().map((column) => column.name);
if (!imageColumns.includes('slot')) db.exec('ALTER TABLE images ADD COLUMN slot TEXT DEFAULT NULL');

// Seed a default admin account if none exists (change on first login).
const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admins').get().c;
if (adminCount === 0) {
  const defaultUser = process.env.ADMIN_USER || 'admin';
  const defaultPass = process.env.ADMIN_PASS || 'altisvoyage2026';
  const hash = bcrypt.hashSync(defaultPass, 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(defaultUser, hash);
  console.log(`[setup] Created default admin user "${defaultUser}" — change the password after first login.`);
}

// Keep the DB in sync with whatever is actually sitting in the image folders.
// Dropping a file into images/<category>/ is enough for it to show up here
// (inactive by default) even without using the admin UI.
function syncImagesFromDisk() {
  if (!fs.existsSync(IMAGES_ROOT)) return;
  const categories = fs.readdirSync(IMAGES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const existing = db.prepare('SELECT category, filename FROM images').all();
  const existingSet = new Set(existing.map((r) => `${r.category}/${r.filename}`));

  const insert = db.prepare(
    'INSERT INTO images (category, filename, active, sort_order) VALUES (?, ?, 1, ?)'
  );
  const validExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

  for (const category of categories) {
    const dir = path.join(IMAGES_ROOT, category);
    const files = fs.readdirSync(dir).filter((f) => validExt.has(path.extname(f).toLowerCase()));
    files.forEach((filename, idx) => {
      const key = `${category}/${filename}`;
      if (!existingSet.has(key)) {
        insert.run(category, filename, idx);
      }
    });

    const hasActive = db.prepare('SELECT 1 FROM images WHERE category = ? AND active = 1 LIMIT 1').get(category);
    if (!hasActive && files.length) {
      db.prepare('UPDATE images SET active = 1 WHERE category = ?').run(category);
    }
  }

  // Remove DB rows whose file no longer exists on disk.
  const all = db.prepare('SELECT id, category, filename FROM images').all();
  const del = db.prepare('DELETE FROM images WHERE id = ?');
  for (const row of all) {
    const p = path.join(IMAGES_ROOT, row.category, row.filename);
    if (!fs.existsSync(p)) del.run(row.id);
  }
}

module.exports = { db, syncImagesFromDisk, IMAGES_ROOT };
