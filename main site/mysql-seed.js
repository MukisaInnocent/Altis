import { getMissingMysqlSettings } from './db-config.js';
import { seedMysql } from './seed-mysql.js';

const missing = getMissingMysqlSettings();
if (missing.length > 0) {
  console.error(
    `[seed] Cannot seed MySQL: these environment variables are missing or still placeholders: ${missing.join(', ')}.`
  );
  process.exit(1);
}

const force = process.argv.includes('--force') || process.env.SEED_FORCE === '1';
const report = await seedMysql({ force });
const seeded = report.seededTables.length > 0
  ? report.seededTables.join(', ')
  : 'nothing (pass --force to re-insert the starter rows)';

console.log(`[seed] MySQL database seeded. Tables: ${seeded}. Admin account: ${report.adminEmail}`);
