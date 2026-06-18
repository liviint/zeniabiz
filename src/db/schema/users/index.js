export async function createUsersTables(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS local_user (
      uuid TEXT PRIMARY KEY,

      device_id TEXT,

      name TEXT,
      email TEXT,
      active INTEGER DEFAULT 1,

      is_synced INTEGER DEFAULT 0,
      last_synced_at TEXT,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
` );
}