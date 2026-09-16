import dns from 'node:dns/promises';
import mysql from 'mysql2/promise';

const HOST = 'auth-db657.hstgr.io';
const PORT = 3306;
const USER = 'u989298385_mukisa';
const PASSWORD = 'Chrisfoundation#0755';
const DATABASE = 'u989298385_Altis';

function log(label, value) {
  console.log(`${label}: ${value}`);
}

log('node', process.version);

try {
  const records = await dns.lookup(HOST, { all: true });
  log('dns', JSON.stringify(records));
} catch (error) {
  log('dns FAILED', `${error.code} ${error.message}`);
}

async function tryConnect(label, config) {
  try {
    const connection = await mysql.createConnection({ ...config, connectTimeout: 12000 });
    log(`${label}`, 'CONNECTED');
    return connection;
  } catch (error) {
    log(`${label}`, `FAILED code=${error.code} errno=${error.errno} sqlState=${error.sqlState} msg=${error.message}`);
    return null;
  }
}

log('--- attempt 1: no database selected ---', '');
const noDb = await tryConnect('no-db', { host: HOST, port: PORT, user: USER, password: PASSWORD });

if (noDb) {
  try {
    const [rows] = await noDb.query('SHOW DATABASES');
    log('databases', rows.map((row) => Object.values(row)[0]).join(', '));
  } catch (error) {
    log('SHOW DATABASES FAILED', `${error.code} ${error.message}`);
  }
  try {
    const [grants] = await noDb.query('SHOW GRANTS');
    log('grants', JSON.stringify(grants));
  } catch (error) {
    log('SHOW GRANTS FAILED', `${error.code} ${error.message}`);
  }
  await noDb.end();
}

log('--- attempt 2: with database ---', '');
const withDb = await tryConnect('with-db', { host: HOST, port: PORT, user: USER, password: PASSWORD, database: DATABASE });
if (withDb) {
  try {
    const [rows] = await withDb.query('SHOW TABLES');
    log('tables', rows.map((row) => Object.values(row)[0]).join(', ') || '(none)');
  } catch (error) {
    log('SHOW TABLES FAILED', `${error.code} ${error.message}`);
  }
  await withDb.end();
}

log('--- attempt 3: short user name ---', '');
const shortUser = await tryConnect('user=mukisa', { host: HOST, port: PORT, user: 'mukisa', password: PASSWORD });
if (shortUser) await shortUser.end();

process.exit(0);
