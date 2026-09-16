import { describeDatabaseTarget, getDriver, getMissingMysqlSettings } from '../db-config.js';
import { getDatabaseStatus, seedDatabase } from '../bootstrap.js';

const wantsSeed = process.argv.includes('--seed');

function line(label, value) {
  console.log(`${label.padEnd(22)} ${value}`);
}

console.log('Altis Voyage database check');
console.log('='.repeat(50));

line('Node.js', process.version);
line('Driver', getDriver());
line('DATABASE_DRIVER', process.env.DATABASE_DRIVER || '(auto)');

const target = describeDatabaseTarget();
line('Env sources', target.envSources.length ? target.envSources.join(' | ') : '(none - using panel env vars only)');

if (target.driver === 'mysql') {
  line('DB_HOST', target.host);
  line('DB_PORT', target.port);
  line('DB_NAME', target.database);
  line('DB_USER', target.user);
  line('DB_PASSWORD', target.passwordConfigured ? 'set' : 'NOT SET');

  const missing = getMissingMysqlSettings();
  if (missing.length > 0) line('Missing vars', missing.join(', '));
}

console.log('-'.repeat(50));

const status = await getDatabaseStatus();

if (!status.ok) {
  console.error('Database is NOT reachable.');
  line('Error code', status.error.code);
  line('Message', status.error.message);
  if (status.error.hint) line('Hint', status.error.hint);
  console.error('');
  status.hints.forEach((hint) => console.error(`- ${hint}`));
  process.exit(1);
}

console.log('Database is reachable.');
Object.entries(status.counts).forEach(([table, count]) => line(table, count));
line('Total rows', status.totalRows);

if (wantsSeed) {
  console.log('-'.repeat(50));
  const report = await seedDatabase({ force: false });
  line('Seeded tables', report.seededTables.length ? report.seededTables.join(', ') : 'nothing (already populated)');
}

console.log('-'.repeat(50));
console.log('Everything looks fine. Open /api/health to confirm from the browser too.');

if (status.totalRows === 0) {
  console.warn('Warning: the tables exist but contain no rows. Run `npm run db:seed` to insert the starter content.');
  process.exit(1);
}
