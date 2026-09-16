import mysql from 'mysql2/promise';

const hostingerPrefix = process.env.DB_ACCOUNT_PREFIX || 'u989298385';
const configuredUser = process.env.DB_USER || 'mukisa';
const configuredDatabase = process.env.DB_NAME || 'Altis';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'auth-db657.hstgr.io',
  port: Number(process.env.DB_PORT || 3306),
  user: configuredUser.includes('_') ? configuredUser : `${hostingerPrefix}_${configuredUser}`,
  password: process.env.DB_PASSWORD,
  database: configuredDatabase.includes('_') ? configuredDatabase : `${hostingerPrefix}_${configuredDatabase}`,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  charset: 'utf8mb4'
});

const tables = new Set(['users', 'site_content', 'destinations', 'packages', 'services', 'testimonials', 'gallery', 'inquiries', 'media', 'sessions']);

const schema = [
  `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role VARCHAR(32) DEFAULT 'admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS site_content (id INT AUTO_INCREMENT PRIMARY KEY, \`key\` VARCHAR(100) NOT NULL UNIQUE, value LONGTEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS destinations (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), country VARCHAR(255), region VARCHAR(100), tagline TEXT, description TEXT, image TEXT, price_from BIGINT DEFAULT 0, featured TINYINT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS packages (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), destination VARCHAR(255), days INT DEFAULT 0, price BIGINT DEFAULT 0, image TEXT, description TEXT, featured TINYINT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS services (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), summary TEXT, description TEXT, icon VARCHAR(100), image TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS testimonials (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), location VARCHAR(255), quote TEXT, trip VARCHAR(255), rating INT DEFAULT 5, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS gallery (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), image TEXT, category VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS inquiries (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), phone VARCHAR(100), interest VARCHAR(255), message TEXT, status VARCHAR(50) DEFAULT 'new', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS media (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), file_name VARCHAR(255), mime_type VARCHAR(100), path TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(255) PRIMARY KEY, user_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX sessions_user_id_idx (user_id))`
];

let schemaReady;

export function getMysqlDb() {
  if (!schemaReady) {
    schemaReady = Promise.all(schema.map((statement) => pool.query(statement)));
  }
  return pool;
}

export async function initializeMysql() {
  await getMysqlDb();
}

function assertTable(tableName) {
  if (!tables.has(tableName)) throw new Error(`Invalid table: ${tableName}`);
  return `\`${tableName}\``;
}

export async function listRows(tableName) {
  const table = assertTable(tableName);
  const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
  return rows;
}

export async function getSiteContent(key) {
  const [rows] = await pool.execute('SELECT value FROM `site_content` WHERE `key` = ?', [key]);
  if (!rows[0]) return null;
  try {
    return JSON.parse(rows[0].value);
  } catch {
    return rows[0].value;
  }
}

export async function listSiteContent() {
  const [rows] = await pool.query('SELECT * FROM `site_content` ORDER BY `key` ASC');
  return rows;
}

export async function upsertSiteContent(key, value) {
  const jsonValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  await pool.execute('INSERT INTO `site_content` (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [key, jsonValue]);
}

export async function ensureUser(email, passwordHash) {
  await pool.execute('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)', [email, passwordHash, 'admin']);
  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  return rows[0]?.id;
}

export async function getUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

export async function createSession(sessionId, userId) {
  await pool.execute('INSERT INTO sessions (id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), created_at = CURRENT_TIMESTAMP', [sessionId, userId]);
}

export async function getSessionUser(sessionId) {
  const [rows] = await pool.execute('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?', [sessionId]);
  return rows[0] || null;
}

export async function clearSession(sessionId) {
  await pool.execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

export async function insertRow(tableName, row) {
  const table = assertTable(tableName);
  const columns = Object.keys(row);
  if (!columns.length) throw new Error('No values supplied');
  const names = columns.map((column) => `\`${column}\``).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const [result] = await pool.execute(`INSERT INTO ${table} (${names}) VALUES (${placeholders})`, columns.map((column) => row[column]));
  return result.insertId;
}

export async function updateRow(tableName, id, row) {
  const table = assertTable(tableName);
  const columns = Object.keys(row);
  if (!columns.length) return;
  const assignments = columns.map((column) => `\`${column}\` = ?`).join(', ');
  await pool.execute(`UPDATE ${table} SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...columns.map((column) => row[column]), id]);
}

export async function deleteRow(tableName, id) {
  const table = assertTable(tableName);
  await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

export async function getRow(tableName, id) {
  const table = assertTable(tableName);
  const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return rows[0] || null;
}

export async function countRows(tableName) {
  const table = assertTable(tableName);
  const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
  return Number(rows[0].count);
}
