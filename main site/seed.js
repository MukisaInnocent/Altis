import { seedDatabase } from './bootstrap.js';

const force = process.argv.includes('--force') || process.env.SEED_FORCE === '1';
const report = await seedDatabase({ force });
const seeded = report.seededTables.length > 0
  ? report.seededTables.join(', ')
  : 'nothing (pass --force to re-insert the starter rows)';

console.log(`[seed] ${report.driver} database seeded. Tables: ${seeded}. Admin account: ${report.adminEmail}`);
