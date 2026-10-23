import mysql from 'mysql2/promise';
import { getMissingMysqlSettings, getMysqlConfig } from './db-config.js';
import { SCHEMA_STATEMENTS } from './mysql-schema.js';
import { applyMysqlMigrations } from './schema-migrations.js';

const CONNECT_TIMEOUT_MS = 15000;
const CONNECTION_LIMIT = 5;

const ERROR_HINTS = {
  ER_ACCESS_DENIED_ERROR:
    'The database rejected the sign-in. Check in this order: (1) DB_PASSWORD is the password of the database USER (not your Hostinger account password) and was pasted exactly; (2) the user name shown in hPanel > Databases is DB_ACCOUNT_PREFIX + "_" + DB_USER; (3) that user is assigned to this database; (4) DB_HOST is the host hPanel shows for this plan. On the same plan try DB_HOST=localhost; a remote host such as auth-dbNNN.hstgr.io also needs the IP of this app allowed under hPanel > Databases > Remote MySQL.',
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
    enableKeepAlive: true,
    // DATE columns (offer validity, deadlines) must come back exactly as stored, not shifted by
    // the server timezone into a JavaScript Date.
    dateStrings: true
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

async function connectAndMigrate(config) {
  const created = createPool(config);
  try {
    await Promise.all(SCHEMA_STATEMENTS.map((statement) => created.query(statement)));
    return { created, migratedColumns: await applyMysqlMigrations(created) };
  } catch (error) {
    await created.end().catch(() => {});
    throw error;
  }
}

// Connects to one host. A missing database is only created when the server says it does not exist
// (shared hosting users usually lack the privilege, so other errors are reported as they are).
async function connectToHost(config) {
  try {
    return { ...(await connectAndMigrate(config)), databaseStep: 'existing' };
  } catch (error) {
    if (error?.code !== 'ER_BAD_DB_ERROR') throw error;
    await createDatabaseIfMissing(config);
    return { ...(await connectAndMigrate(config)), databaseStep: 'created' };
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
  // DB_HOST may list several hosts separated by commas, e.g. "localhost,auth-db1800.hstgr.io". They
  // are tried in order and the first one that works is used. On Hostinger, "localhost" is the
  // one that is accepted automatically when the app and database share a plan.
  const hosts = String(config.host).split(',').map((host) => host.trim()).filter(Boolean);
  let result = null;
  let usedHost = hosts[0];
  let lastError = null;

  for (const host of hosts) {
    try {
      result = await connectToHost({ ...config, host });
      usedHost = host;
      break;
    } catch (error) {
      lastError = error;
      if (hosts.length > 1) console.warn(`[db] Host "${host}" failed (${error?.code || 'error'}).${host === hosts[hosts.length - 1] ? '' : ' Trying the next one.'}`);
    }
  }
  if (!result) throw lastError;

  const { created, migratedColumns, databaseStep } = result;
  pool = created;
  lastBootstrapReport = {
    database: config.database,
    user: config.user,
    host: usedHost,
    databaseStep,
    tables: SCHEMA_STATEMENTS.length,
    migratedColumns
  };

  console.log(
    `[db] MySQL ready - host=${usedHost} database=${config.database} user=${config.user} tables=${SCHEMA_STATEMENTS.length} (${databaseStep})${migratedColumns.length ? ` added columns: ${migratedColumns.join(', ')}` : ''}`
  );

  return created;
}

// After a failed start, further attempts within this window fail immediately with the same error,
// so a broken password does not trigger a new connection (and a new log line) for every request.
const FAILURE_BACKOFF_MS = 30000;
let lastFailure = null;

export async function ensureMysqlReady() {
  if (pool) return pool;
  if (lastFailure && Date.now() - lastFailure.at < FAILURE_BACKOFF_MS) throw lastFailure.error;
  if (!readyPromise) {
    readyPromise = bootstrap()
      .then((created) => {
        lastFailure = null;
        return created;
      })
      .catch((error) => {
        readyPromise = null;
        lastFailure = { error, at: Date.now() };
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
