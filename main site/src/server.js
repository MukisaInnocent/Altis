import http from 'node:http';
import next from 'next';
import { describeDatabaseTarget } from '../db-config.js';
import { ensureDatabaseReady } from '../bootstrap.js';
import { describeMysqlError } from '../mysql-connection.js';

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || '0.0.0.0';

async function bootstrapDatabase() {
  try {
    const report = await ensureDatabaseReady();
    const seeded = report.seededTables.length > 0 ? report.seededTables.join(', ') : 'nothing new';
    console.log(`[startup] ${report.driver} database ready. Seeded tables: ${seeded}. Admin account: ${report.adminEmail}`);
  } catch (error) {
    const described = describeMysqlError(error);
    console.error(`[startup] Database bootstrap failed (${described.code}): ${described.message}`);
    if (described.hint) console.error(`[startup] Hint: ${described.hint}`);
    console.error(`[startup] Active driver: ${describeDatabaseTarget().driver}. Open /api/health for details.`);
    console.error('[startup] Starting the web server anyway so the site stays reachable.');
  }
}

await bootstrapDatabase();

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

http.createServer((request, response) => {
  handle(request, response);
}).listen(port, hostname, () => {
  console.log(`Altis Voyage Next.js server running on http://${hostname}:${port}`);
});
