import bcrypt from 'bcryptjs';
import { countRows, ensureMysqlReady, ensureUser, insertRow, upsertSiteContent } from './mysql-db.js';
import { getAdminCredentials, resolveAdminPassword } from './db-config.js';
import { SEED_TABLES, SITE_CONTENT } from './seed-data.js';

async function seedTable(tableName, rows, force) {
  if (!force && (await countRows(tableName)) > 0) return false;
  for (const row of rows) await insertRow(tableName, row);
  return true;
}

export async function seedMysql({ force = false } = {}) {
  await ensureMysqlReady();

  const { email } = getAdminCredentials();
  await ensureUser(email, bcrypt.hashSync(resolveAdminPassword(), 10));

  for (const entry of SITE_CONTENT) {
    await upsertSiteContent(entry.key, entry.value);
  }

  const seededTables = [];
  for (const entry of SEED_TABLES) {
    if (await seedTable(entry.table, entry.rows, force)) seededTables.push(entry.table);
  }

  return { driver: 'mysql', adminEmail: email, seededTables };
}
