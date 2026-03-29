import { SQLiteProvider } from "expo-sqlite";

const migrateDbIfNeeded = async (db) => {
  await db.execAsync(`DROP TABLE IF EXISTS transactions;`);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'sale' | 'expense'
      amount REAL NOT NULL,
      category TEXT,
      category_id INTEGER,
      payee Text,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL,
      date TEXT NOT NULL
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
