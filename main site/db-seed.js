import { seedSqlite } from './seed-sqlite.js';

const force = process.argv.includes('--force') || process.env.SEED_FORCE === '1';
const report = seedSqlite({ force });
const seeded = report.seededTables.length > 0
  ? report.seededTables.join(', ')
  : 'nothing (pass --force to re-insert the starter rows)';

console.log(`[seed] SQLite database seeded. Tables: ${seeded}. Admin account: ${report.adminEmail}`);
