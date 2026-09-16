if (process.env.DB_HOST || process.env.DB_PASSWORD) {
  await import('./mysql-seed.js');
} else {
  await import('./db-seed.js');
}
