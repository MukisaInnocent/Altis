// Additive column migrations for tables that already exist in production.
//
// `CREATE TABLE IF NOT EXISTS` never alters an existing table, so columns added after the first
// deployment are listed here and added only when missing. Nothing is renamed, retyped or dropped,
// which keeps every existing row intact. Each entry is safe to run on every startup.
export const COLUMN_MIGRATIONS = {
  inquiries: {
    reference: { mysql: 'VARCHAR(32) NULL', sqlite: 'TEXT' },
    service: { mysql: 'VARCHAR(50) NULL', sqlite: 'TEXT' },
    details: { mysql: 'TEXT NULL', sqlite: 'TEXT' },
    package_id: { mysql: 'INT NULL', sqlite: 'INTEGER' },
    admin_notes: { mysql: 'TEXT NULL', sqlite: 'TEXT' }
  },
  testimonials: {
    // Existing testimonials were confirmed as genuine by the owner, so they stay visible.
    approved: { mysql: 'TINYINT DEFAULT 1', sqlite: 'INTEGER DEFAULT 1' },
    verified_booking: { mysql: 'TINYINT DEFAULT 0', sqlite: 'INTEGER DEFAULT 0' },
    inquiry_id: { mysql: 'INT NULL', sqlite: 'INTEGER' }
  }
};

export async function applyMysqlMigrations(pool) {
  const applied = [];
  for (const [table, columns] of Object.entries(COLUMN_MIGRATIONS)) {
    const [rows] = await pool.query(
      'SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      [table]
    );
    const existing = new Set(rows.map((row) => String(row.name).toLowerCase()));
    for (const [column, definition] of Object.entries(columns)) {
      if (existing.has(column)) continue;
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition.mysql}`);
      applied.push(`${table}.${column}`);
    }
  }
  return applied;
}

export function applySqliteMigrations(db) {
  const applied = [];
  for (const [table, columns] of Object.entries(COLUMN_MIGRATIONS)) {
    const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name.toLowerCase()));
    for (const [column, definition] of Object.entries(columns)) {
      if (existing.has(column)) continue;
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition.sqlite}`);
      applied.push(`${table}.${column}`);
    }
  }
  return applied;
}
