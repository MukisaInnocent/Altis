import bcrypt from 'bcryptjs';
import { getDb, ensureUser, getSiteContent, insertSiteContentIfMissing, upsertSiteContent, saveJsonTable } from './db.js';
import { getAdminCredentials, resolveAdminPassword } from './db-config.js';
import { CONTENT_UPGRADES, SEED_TABLES, SITE_CONTENT } from './seed-data.js';
import { sanitizeRow } from './table-columns.js';

const UPGRADES_KEY = '_applied_upgrades';

function countRows(tableName) {
  return getDb().prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function seedTable(tableName, rows, force) {
  if (!force && countRows(tableName) > 0) return false;
  for (const row of rows) saveJsonTable(tableName, sanitizeRow(tableName, row));
  return true;
}

function applyContentUpgrades() {
  const applied = getSiteContent(UPGRADES_KEY) || [];
  const done = new Set(Array.isArray(applied) ? applied : []);
  const newlyApplied = [];

  for (const upgrade of CONTENT_UPGRADES) {
    if (done.has(upgrade.id)) continue;
    const next = upgrade.apply(getSiteContent(upgrade.key));
    if (next) upsertSiteContent(upgrade.key, next);
    done.add(upgrade.id);
    newlyApplied.push(upgrade.id);
  }

  if (newlyApplied.length) upsertSiteContent(UPGRADES_KEY, [...done]);
  return newlyApplied;
}

export function seedSqlite({ force = false } = {}) {
  getDb();

  const { email } = getAdminCredentials();
  ensureUser(email, bcrypt.hashSync(resolveAdminPassword(), 10));

  for (const entry of SITE_CONTENT) {
    if (force) upsertSiteContent(entry.key, entry.value);
    else insertSiteContentIfMissing(entry.key, entry.value);
  }
  const contentUpgrades = applyContentUpgrades();

  const seededTables = [];
  for (const entry of SEED_TABLES) {
    if (seedTable(entry.table, entry.rows, force)) seededTables.push(entry.table);
  }

  return { driver: 'sqlite', adminEmail: email, seededTables, contentUpgrades };
}
