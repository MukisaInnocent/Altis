import { getDb } from './db.js';

const db = getDb();
const destinationCount = db.prepare('SELECT COUNT(*) AS count FROM destinations').get().count;

if (destinationCount === 0) {
  await import('./db-seed.js');
  console.log('Initialized the empty Altis Voyage database.');
} else {
  console.log('Altis Voyage database already contains data.');
}