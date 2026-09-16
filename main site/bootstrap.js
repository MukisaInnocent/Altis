import { describeDatabaseTarget, getAdminCredentials, getDriver, getMissingMysqlSettings } from './db-config.js';
import { describeMysqlError } from './mysql-connection.js';

const TABLE_PROBES = ['destinations', 'packages', 'services', 'testimonials', 'gallery'];

let readyPromise = null;
let lastReport = null;

function warnAboutFallbackAdminPassword() {
  const { usingFallbackPassword, email } = getAdminCredentials();
  if (!usingFallbackPassword) return;
  console.warn(
    `[db] ADMIN_PASSWORD is not set, so the admin account ${email} uses the built-in fallback password. Set ADMIN_PASSWORD in the hosting environment variables.`
  );
}

async function runMysqlBootstrap() {
  const missing = getMissingMysqlSettings();
  if (missing.length > 0) {
    throw new Error(
      `MySQL is selected because DB_HOST is set, but these variables are missing or are still the template placeholders: ${missing.join(', ')}.`
    );
  }

  const { seedMysql } = await import('./seed-mysql.js');
  return seedMysql();
}

async function runSqliteBootstrap() {
  const { seedSqlite } = await import('./seed-sqlite.js');
  return seedSqlite();
}

async function runBootstrap() {
  warnAboutFallbackAdminPassword();
  const report = getDriver() === 'mysql' ? await runMysqlBootstrap() : await runSqliteBootstrap();
  lastReport = report;
  return report;
}

export async function ensureDatabaseReady() {
  if (lastReport) return lastReport;
  if (!readyPromise) {
    readyPromise = runBootstrap().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}

export async function seedDatabase({ force = false } = {}) {
  const driver = getDriver();
  if (driver === 'mysql') {
    const { seedMysql } = await import('./seed-mysql.js');
    lastReport = await seedMysql({ force });
    return lastReport;
  }

  const { seedSqlite } = await import('./seed-sqlite.js');
  lastReport = seedSqlite({ force });
  return lastReport;
}

export function getLastBootstrapReport() {
  return lastReport;
}

async function countTableRows(driver, tableName) {
  if (driver === 'mysql') {
    const { countRows } = await import('./mysql-db.js');
    return countRows(tableName);
  }

  const { getDb } = await import('./db.js');
  return getDb().prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

export async function getDatabaseStatus() {
  const driver = getDriver();
  const target = describeDatabaseTarget();

  try {
    const counts = {};
    for (const table of TABLE_PROBES) {
      counts[table] = await countTableRows(driver, table);
    }

    const total = Object.values(counts).reduce((sum, value) => sum + Number(value), 0);
    return { ok: true, driver, target, counts, totalRows: total, lastBootstrap: lastReport };
  } catch (error) {
    const described = describeMysqlError(error);
    return {
      ok: false,
      driver,
      target,
      error: described,
      lastBootstrap: lastReport,
      hints: [
        'Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD and DB_ACCOUNT_PREFIX in the hosting environment variables, then restart the app.',
        'In hPanel, open Databases and confirm the MySQL database exists and the database user is attached to it.',
        'If the database server and the app are in different regions, move them into the same account/region.'
      ]
    };
  }
}
