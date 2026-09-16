import bcrypt from 'bcryptjs';
import { getDb, ensureUser, upsertSiteContent, saveJsonTable } from './db.js';
import { getAdminCredentials, resolveAdminPassword } from './db-config.js';
import { SEED_TABLES, SITE_CONTENT } from './seed-data.js';

function countRows(tableName) {
  return getDb().prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function seedTable(tableName, rows, force) {
  if (!force && countRows(tableName) > 0) return false;
  for (const row of rows) saveJsonTable(tableName, row);
  return true;
}

export function seedSqlite({ force = false } = {}) {
  getDb();

  const { email } = getAdminCredentials();
  ensureUser(email, bcrypt.hashSync(resolveAdminPassword(), 10));

  for (const entry of SITE_CONTENT) {
    upsertSiteContent(entry.key, entry.value);
  }

  const seededTables = [];
  for (const entry of SEED_TABLES) {
    if (seedTable(entry.table, entry.rows, force)) seededTables.push(entry.table);
  }

  return { driver: 'sqlite', adminEmail: email, seededTables };
}
