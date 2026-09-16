import { TABLES } from './mysql-schema.js';
import { ensureMysqlReady, getMysqlPool, pingMysql } from './mysql-connection.js';

export { ensureMysqlReady, getMysqlPool, pingMysql };

function assertTable(tableName) {
  if (!TABLES.has(tableName)) throw new Error(`Invalid table: ${tableName}`);
  return `\`${tableName}\``;
}

function placeholders(count) {
  return Array.from({ length: count }, () => '?').join(', ');
}

export function getMysqlDb() {
  return getMysqlPool();
}

export async function initializeMysql() {
  await ensureMysqlReady();
}

export async function listRows(tableName) {
  const pool = await getMysqlPool();
  const table = assertTable(tableName);
  const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
  return rows;
}

export async function getSiteContent(key) {
  const pool = await getMysqlPool();
  const [rows] = await pool.execute('SELECT value FROM `site_content` WHERE `key` = ?', [key]);
  if (!rows[0]) return null;

  try {
    return JSON.parse(rows[0].value);
  } catch {
    return rows[0].value;
  }
}

export async function listSiteContent() {
  const pool = await getMysqlPool();
  const [rows] = await pool.query('SELECT * FROM `site_content` ORDER BY `key` ASC');
  return rows;
}

export async function upsertSiteContent(key, value) {
  const pool = await getMysqlPool();
  const jsonValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  await pool.execute(
    'INSERT INTO `site_content` (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
    [key, jsonValue]
  );
}

export async function ensureUser(email, passwordHash) {
  const pool = await getMysqlPool();
  await pool.execute(
    "INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'admin') ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)",
    [email, passwordHash]
  );
  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  return rows[0]?.id;
}

export async function getUserByEmail(email) {
  const pool = await getMysqlPool();
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

export async function createSession(sessionId, userId) {
  const pool = await getMysqlPool();
  await pool.execute(
    'INSERT INTO sessions (id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), created_at = CURRENT_TIMESTAMP',
    [sessionId, userId]
  );
}

export async function getSessionUser(sessionId) {
  const pool = await getMysqlPool();
  const [rows] = await pool.execute(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?',
    [sessionId]
  );
  return rows[0] || null;
}

export async function clearSession(sessionId) {
  const pool = await getMysqlPool();
  await pool.execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

export async function insertRow(tableName, row) {
  const pool = await getMysqlPool();
  const table = assertTable(tableName);
  const columns = Object.keys(row);
  if (!columns.length) throw new Error('No values supplied');

  const names = columns.map((column) => `\`${column}\``).join(', ');
  const [result] = await pool.execute(
    `INSERT INTO ${table} (${names}) VALUES (${placeholders(columns.length)})`,
    columns.map((column) => row[column])
  );
  return result.insertId;
}

export async function updateRow(tableName, id, row) {
  const pool = await getMysqlPool();
  const table = assertTable(tableName);
  const columns = Object.keys(row);
  if (!columns.length) return;

  const assignments = columns.map((column) => `\`${column}\` = ?`).join(', ');
  await pool.execute(
    `UPDATE ${table} SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [...columns.map((column) => row[column]), id]
  );
}

export async function deleteRow(tableName, id) {
  const pool = await getMysqlPool();
  const table = assertTable(tableName);
  await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

export async function getRow(tableName, id) {
  const pool = await getMysqlPool();
  const table = assertTable(tableName);
  const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return rows[0] || null;
}

export async function countRows(tableName) {
  const pool = await getMysqlPool();
  const table = assertTable(tableName);
  const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
  return Number(rows[0].count);
}
