import { SQLiteProvider } from "expo-sqlite";
import CategoriesProvider from "./CategoriesProvider";

const migrateDbIfNeeded = async (db) => {

  /* await db.execAsync(`DROP TABLE IF EXISTS expenses;`);
  await db.execAsync(`DROP TABLE IF EXISTS expense_categories;`);
  await db.execAsync(`DROP TABLE IF EXISTS expense_templates;`);
  await db.execAsync(`DROP TABLE IF EXISTS products;`);
  await db.execAsync(`DROP TABLE IF EXISTS sales;`); */

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      category TEXT,
      category_id TEXT,
      title Text,
      payee Text,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      date TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,

      name TEXT NOT NULL,
      spendingType TEXT DEFAULT 'neutral' CHECK(spendingType IN ('neutral', 'needs', 'wants','savings')),

      color TEXT,
      icon TEXT,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expense_templates (
      id TEXT PRIMARY KEY,

      title TEXT NOT NULL,
      amount REAL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),

      category TEXT,
      category_id TEXT,
      usage_count INTEGER DEFAULT 0,

      payee TEXT,
      note TEXT,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT,
      selling_price REAL NOT NULL,
      cost_price REAL DEFAULT 0,

      stock_quantity REAL DEFAULT 0,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,

      type TEXT NOT NULL CHECK(type IN ('in', 'out', 'adjustment')),
      quantity REAL NOT NULL,

      note TEXT,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,

      FOREIGN KEY (product_id) REFERENCES products(id)
    );


    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      title TEXT,
      note TEXT,
      amount REAL, 
      date TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT,
      product_id TEXT,
      quantity INTEGER,
      price REAL,
      deleted_at TEXT,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
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
      <CategoriesProvider />
        {children}
    </SQLiteProvider>
  );
}
