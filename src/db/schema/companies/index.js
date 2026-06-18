export async function createCompaniesTables(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS companies (
      uuid TEXT PRIMARY KEY,

      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,

      logo TEXT,
      currency TEXT DEFAULT 'KES',
      timezone TEXT DEFAULT 'Africa/Nairobi',

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS company_members (
      uuid TEXT PRIMARY KEY,

      company TEXT NOT NULL,
      user_id TEXT NOT NULL,

      role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'staff')),

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,

      FOREIGN KEY (company) REFERENCES companies(uuid)
    );

    CREATE INDEX IF NOT EXISTS idx_company_members_company 
    ON company_members(company);
  `);
}