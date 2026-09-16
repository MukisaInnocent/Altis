import { ensureDatabaseReady } from './bootstrap.js';
import { describeDatabaseTarget } from './db-config.js';
import { describeMysqlError } from './mysql-connection.js';

try {
  const report = await ensureDatabaseReady();
  const seeded = report.seededTables.length > 0 ? report.seededTables.join(', ') : 'nothing new (already populated)';
  console.log(`[db] ${report.driver} database ready. Seeded tables: ${seeded}. Admin account: ${report.adminEmail}`);
} catch (error) {
  const described = describeMysqlError(error);
  const target = describeDatabaseTarget();

  console.error(`[db] Database bootstrap failed (${described.code}): ${described.message}`);
  if (described.hint) console.error(`[db] Hint: ${described.hint}`);
  console.error(`[db] Active driver: ${target.driver}. Open /api/health for a full report.`);
  console.error('[db] The web server will still start so the site stays reachable while you fix the database settings.');
}
