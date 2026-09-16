import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { appRoot } from './load-env.js';
import { SQLITE_SCHEMA, SQLITE_TABLES } from './sqlite-schema.js';

const require = createRequire(import.meta.url);

const dataDir = path.resolve(process.env.DATA_DIR || path.join(appRoot, 'data'));
const databasePath = path.join(dataDir, 'altis-voyage.sqlite');

let database = null;

export function getSqlitePath() {
  return databasePath;
}

export function isSqliteReady() {
  return database !== null;
}

export function getDb() {
  if (database) return database;

  fs.mkdirSync(dataDir, { recursive: true });

  const Database = require('better-sqlite3');
  const created = new Database(databasePath);
  created.pragma('journal_mode = WAL');
  created.exec(SQLITE_SCHEMA);

  database = created;
  console.log(`[db] SQLite ready - ${databasePath}`);
  return database;
}

function assertTable(tableName) {
  if (!SQLITE_TABLES.has(tableName)) throw new Error(`Invalid table: ${tableName}`);
  return tableName;
}

export function getAllRecords(tableName) {
  return getDb().prepare(`SELECT * FROM ${assertTable(tableName)} ORDER BY created_at DESC`).all();
}

export function getRecordById(tableName, id) {
  return getDb().prepare(`SELECT * FROM ${assertTable(tableName)} WHERE id = ?`).get(id) || null;
}

export function countRecords(tableName) {
  return getDb().prepare(`SELECT COUNT(*) AS count FROM ${assertTable(tableName)}`).get().count;
}

export function upsertSiteContent(key, value) {
  const jsonValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  getDb().prepare(`
    INSERT INTO site_content(key, value, updated_at)
    VALUES(@key, @value, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
  `).run({ key, value: jsonValue });
}

export function getSiteContent(key) {
  const row = getDb().prepare('SELECT value FROM site_content WHERE key = ?').get(key);
  if (!row) return null;

  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

export function listSiteContent() {
  return getDb().prepare('SELECT * FROM site_content ORDER BY key ASC').all();
}

export function ensureUser(email, passwordHash) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO users(email, password_hash, role)
    VALUES(?, ?, 'admin')
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      role = excluded.role,
      created_at = CURRENT_TIMESTAMP
  `).run(email, passwordHash);

  return result.lastInsertRowid || db.prepare('SELECT id FROM users WHERE email = ?').get(email)?.id;
}

export function getUserByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function createSession(sessionId, userId) {
  getDb().prepare('INSERT INTO sessions(id, user_id) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, created_at=CURRENT_TIMESTAMP').run(sessionId, userId);
}

export function getSessionUser(sessionId) {
  const db = getDb();
  const session = db.prepare('SELECT user_id FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return null;
  return db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
}

export function clearSession(sessionId) {
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function saveJsonTable(tableName, row) {
  const table = assertTable(tableName);
  const columns = Object.keys(row);
  if (!columns.length) throw new Error('No values supplied');

  const placeholders = columns.map(() => '?').join(', ');
  const result = getDb()
    .prepare(`INSERT INTO ${table}(${columns.join(', ')}) VALUES(${placeholders})`)
    .run(...columns.map((column) => row[column]));

  return result.lastInsertRowid;
}

export function updateJsonTable(tableName, id, row) {
  const table = assertTable(tableName);
  const columns = Object.keys(row);
  if (!columns.length) return;

  const assignments = columns.map((column) => `${column} = ?`).join(', ');
  getDb()
    .prepare(`UPDATE ${table} SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...columns.map((column) => row[column]), id);
}

export function removeRecord(tableName, id) {
  getDb().prepare(`DELETE FROM ${assertTable(tableName)} WHERE id = ?`).run(id);
}

const lazyDatabase = new Proxy({}, {
  get(_target, property) {
    const active = getDb();
    const value = active[property];
    return typeof value === 'function' ? value.bind(active) : value;
  }
});

export default lazyDatabase;
