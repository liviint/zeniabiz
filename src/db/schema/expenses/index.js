export async function createExpensesTables(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,

    company TEXT NOT NULL,
    created_by TEXT,
    updated_by TEXT,

    amount REAL NOT NULL,
    category TEXT,
    category_id TEXT,
    title TEXT,
    payee TEXT,
    note TEXT,

    date TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,

    FOREIGN KEY (category_id) REFERENCES expense_categories(id)
  );

  CREATE TABLE IF NOT EXISTS expense_categories (
    id TEXT PRIMARY KEY,

    company TEXT,
    created_by TEXT,
    updated_by TEXT,

    name TEXT NOT NULL,
    spendingType TEXT DEFAULT 'neutral'
      CHECK(spendingType IN ('neutral', 'needs', 'wants','savings')),

    color TEXT,
    icon TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,

    UNIQUE(company, name)
  );

  CREATE TABLE IF NOT EXISTS expense_templates (
    id TEXT PRIMARY KEY,

    company TEXT,
    created_by TEXT,
    updated_by TEXT,

    title TEXT NOT NULL,
    amount REAL,
    type TEXT,

    category TEXT,
    category_id TEXT,
    usage_count INTEGER DEFAULT 0,

    payee TEXT,
    note TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_category 
  ON expenses(category_id);

  CREATE INDEX IF NOT EXISTS idx_expenses_company_date
  ON expenses(company, date DESC);

  CREATE INDEX IF NOT EXISTS idx_categories_company 
  ON expense_categories(company);

  CREATE INDEX IF NOT EXISTS idx_templates_company_usage
  ON expense_templates(company, usage_count DESC, updated_at DESC);

  `);
}