export async function createCustomerTables(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,

      company TEXT NOT NULL,

      name TEXT NOT NULL,
      phone TEXT,

      note TEXT,

      created_by TEXT,
      updated_by TEXT,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `);
}