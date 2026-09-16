if (process.env.DB_HOST || process.env.DB_PASSWORD) {
  const { initializeMysql, countRows } = await import('./mysql-db.js');
  await initializeMysql();
  if (await countRows('destinations') === 0) {
    await import('./mysql-seed.js');
    console.log('Initialized the empty MySQL database.');
  } else {
    console.log('MySQL database already contains data.');
  }
} else {
  const { getDb } = await import('./db.js');
  const db = getDb();
  const destinationCount = db.prepare('SELECT COUNT(*) AS count FROM destinations').get().count;
  if (destinationCount === 0) {
    await import('./db-seed.js');
    console.log('Initialized the empty SQLite database.');
  } else {
    console.log('SQLite database already contains data.');
  }
}