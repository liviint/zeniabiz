import { SQLiteProvider } from "expo-sqlite";

const migrateDbIfNeeded = async (db) => {
  // await db.execAsync(`DROP TABLE IF EXISTS transactions;`);
  // await db.execAsync(`DROP TABLE IF EXISTS transaction_categories;`);
  // await db.execAsync(`DROP TABLE IF EXISTS transaction_templates;`);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category TEXT,
      category_id INTEGER,
      title Text,
      payee Text,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_categories (
      id TEXT PRIMARY KEY,

      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      spendingType TEXT DEFAULT 'neutral' CHECK(spendingType IN ('neutral', 'needs', 'wants','savings')),

      color TEXT,
      icon TEXT,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transaction_templates (
      id TEXT PRIMARY KEY,

      title TEXT NOT NULL,
      amount REAL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),

      category TEXT,
      category_uuid TEXT,
      usage_count INTEGER DEFAULT 0,

      payee TEXT,
      note TEXT,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

  `);
};

export default function AppDataProvider({ children }) {
  return (
    <SQLiteProvider databaseName="zeniabiz.db" onInit={migrateDbIfNeeded}>
      {children}
    </SQLiteProvider>
  );
}
