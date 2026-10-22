import bcrypt from 'bcryptjs';
import {
  countRows,
  ensureMysqlReady,
  ensureUser,
  getSiteContent,
  insertRow,
  insertSiteContentIfMissing,
  upsertSiteContent
} from './mysql-db.js';
import { getAdminCredentials, resolveAdminPassword } from './db-config.js';
import { CONTENT_UPGRADES, SEED_TABLES, SITE_CONTENT } from './seed-data.js';
import { sanitizeRow } from './table-columns.js';

const UPGRADES_KEY = '_applied_upgrades';

async function seedTable(tableName, rows, force) {
  if (!force && (await countRows(tableName)) > 0) return false;
  for (const row of rows) await insertRow(tableName, sanitizeRow(tableName, row));
  return true;
}

async function applyContentUpgrades() {
  const applied = (await getSiteContent(UPGRADES_KEY)) || [];
  const done = new Set(Array.isArray(applied) ? applied : []);
  const newlyApplied = [];

  for (const upgrade of CONTENT_UPGRADES) {
    if (done.has(upgrade.id)) continue;
    const next = upgrade.apply(await getSiteContent(upgrade.key));
    if (next) await upsertSiteContent(upgrade.key, next);
    done.add(upgrade.id);
    newlyApplied.push(upgrade.id);
  }

  if (newlyApplied.length) await upsertSiteContent(UPGRADES_KEY, [...done]);
  return newlyApplied;
}

export async function seedMysql({ force = false } = {}) {
  await ensureMysqlReady();

  const { email } = getAdminCredentials();
  await ensureUser(email, bcrypt.hashSync(resolveAdminPassword(), 10));

  for (const entry of SITE_CONTENT) {
    if (force) await upsertSiteContent(entry.key, entry.value);
    else await insertSiteContentIfMissing(entry.key, entry.value);
  }
  const contentUpgrades = await applyContentUpgrades();

  const seededTables = [];
  for (const entry of SEED_TABLES) {
    if (await seedTable(entry.table, entry.rows, force)) seededTables.push(entry.table);
  }

  return { driver: 'mysql', adminEmail: email, seededTables, contentUpgrades };
}
