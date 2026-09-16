import mysql from 'mysql2/promise';
import { getMissingMysqlSettings, getMysqlConfig } from './db-config.js';
import { SCHEMA_STATEMENTS } from './mysql-schema.js';

const CONNECT_TIMEOUT_MS = 15000;
const CONNECTION_LIMIT = 5;

const ERROR_HINTS = {
  ER_ACCESS_DENIED_ERROR:
    'Check DB_USER and DB_PASSWORD in the Hostinger environment variables, and make sure the database user is attached to the database in hPanel.',
  ER_DBACCESS_DENIED_ERROR:
    'The database user exists but has no access to this database. Open hPanel > Databases and attach the user to the database.',
  ER_BAD_DB_ERROR:
    'The database does not exist and the app could not create it. Create it in hPanel > Databases > MySQL Databases, then redeploy.',
  ENOTFOUND:
    'DB_HOST does not resolve. Copy the exact hostname from hPanel > Databases (it looks like auth-dbXXXX.hstgr.io).',
  ECONNREFUSED:
    'Nothing is listening on that host/port. If the database is on a different host, update DB_HOST and DB_PORT.',
  ETIMEDOUT:
    'The connection timed out. The app and the database must be in the same Hostinger account and region.',
  ER_NOT_SUPPORTED_AUTH_MODE:
    'The MySQL user uses an authentication plugin this driver cannot negotiate. Recreate the database user in hPanel.'
};

export function describeMysqlError(error) {
  const code = error?.code || 'UNKNOWN';
  return {
    code,
    message: error?.message || String(error),
    hint: ERROR_HINTS[code] || null
  };
}

let pool = null;
let readyPromise = null;
let lastBootstrapReport = null;

function createPool(config) {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: CONNECTION_LIMIT,
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: CONNECT_TIMEOUT_MS,
    enableKeepAlive: true
  });
}

async function createDatabaseIfMissing(config) {
  const admin = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    connectTimeout: CONNECT_TIMEOUT_MS
  });

  try {
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    return 'created-or-present';
  } finally {
    await admin.end();
  }
}

async function bootstrap() {
  const missing = getMissingMysqlSettings();
  if (missing.length > 0) {
    throw new Error(
      `MySQL is selected because DB_HOST is set, but these variables are missing or still placeholders: ${missing.join(', ')}. Set them in the Hostinger environment variables and restart the app.`
    );
  }

  const config = getMysqlConfig();
  let databaseStep = 'skipped';

  try {
    databaseStep = await createDatabaseIfMissing(config);
  } catch (error) {
    const described = describeMysqlError(error);
    console.warn(
      `[db] Could not create database "${config.database}" (${described.code}). Continuing in case it already exists. ${described.hint || ''}`
    );
    databaseStep = `failed:${described.code}`;
  }

  const created = createPool(config);

  try {
    await Promise.all(SCHEMA_STATEMENTS.map((statement) => created.query(statement)));
  } catch (error) {
    await created.end().catch(() => {});
    throw error;
  }

  pool = created;
  lastBootstrapReport = {
    database: config.database,
    user: config.user,
    host: config.host,
    databaseStep,
    tables: SCHEMA_STATEMENTS.length
  };

  console.log(
    `[db] MySQL ready - host=${config.host} database=${config.database} user=${config.user} tables=${SCHEMA_STATEMENTS.length} (${databaseStep})`
  );

  return created;
}

export async function ensureMysqlReady() {
  if (pool) return pool;
  if (!readyPromise) {
    readyPromise = bootstrap().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}

export async function getMysqlPool() {
  await ensureMysqlReady();
  return pool;
}

export async function pingMysql() {
  const active = await ensureMysqlReady();
  const [rows] = await active.query('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}

export function getMysqlBootstrapReport() {
  return lastBootstrapReport;
}

export async function closeMysql() {
  if (pool) {
    const active = pool;
    pool = null;
    readyPromise = null;
    await active.end().catch(() => {});
  }
}
