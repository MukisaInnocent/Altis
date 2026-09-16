if (process.env.DB_HOST) {
  await import('./mysql-seed.js');
} else {
  await import('./db-seed.js');
}
