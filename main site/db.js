import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'altis-voyage.sqlite');

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    country TEXT,
    region TEXT,
    tagline TEXT,
    description TEXT,
    image TEXT,
    price_from INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    destination TEXT,
    days INTEGER DEFAULT 0,
    price INTEGER DEFAULT 0,
    image TEXT,
    description TEXT,
    featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    summary TEXT,
    description TEXT,
    icon TEXT,
    image TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    location TEXT,
    quote TEXT,
    trip TEXT,
    rating INTEGER DEFAULT 5,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    image TEXT,
    category TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    interest TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    file_name TEXT,
    mime_type TEXT,
    path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export function getDb() {
  return db;
}

export function getAllRecords(tableName) {
  return db.prepare(`SELECT * FROM ${tableName} ORDER BY created_at DESC`).all();
}

export function upsertSiteContent(key, value) {
  const jsonValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const stmt = db.prepare(`
    INSERT INTO site_content(key, value, updated_at)
    VALUES(@key, @value, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
  `);
  stmt.run({ key, value: jsonValue });
}

export function getSiteContent(key) {
  const row = db.prepare('SELECT value FROM site_content WHERE key = ?').get(key);
  if (!row) return null;

  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

export function listSiteContent() {
  return db.prepare('SELECT * FROM site_content ORDER BY key ASC').all();
}

export function ensureUser(email, passwordHash) {
  const stmt = db.prepare(`
    INSERT INTO users(email, password_hash, role)
    VALUES(?, ?, 'admin')
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      role = excluded.role,
      created_at = CURRENT_TIMESTAMP
  `);

  const result = stmt.run(email, passwordHash);
  return result.lastInsertRowid || db.prepare('SELECT id FROM users WHERE email = ?').get(email)?.id;
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function createSession(sessionId, userId) {
  db.prepare('INSERT INTO sessions(id, user_id) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, created_at=CURRENT_TIMESTAMP').run(sessionId, userId);
}

export function getSessionUser(sessionId) {
  const session = db.prepare('SELECT user_id FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return null;
  return db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
}

export function clearSession(sessionId) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function saveJsonTable(tableName, row) {
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(',');
  const sql = `INSERT INTO ${tableName}(${columns.join(', ')}) VALUES(${placeholders})`;
  const values = columns.map((column) => row[column]);
  const result = db.prepare(sql).run(...values);
  return result.lastInsertRowid;
}

export function updateJsonTable(tableName, id, row) {
  const assignments = Object.keys(row).map((column) => `${column} = ?`).join(', ');
  const values = Object.values(row);
  db.prepare(`UPDATE ${tableName} SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, id);
}

export function removeRecord(tableName, id) {
  db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
}

export default db;
