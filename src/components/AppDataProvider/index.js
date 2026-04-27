import { SQLiteProvider } from "expo-sqlite";
import CategoriesProvider from "./CategoriesProvider";
import CompanyProvider from "./CompanyProvider"

const migrateDbIfNeeded = async (db) => {
  
  /* 
  await db.execAsync(`DROP TABLE IF EXISTS companies;`);
  await db.execAsync(`DROP TABLE IF EXISTS company_members;`);
  await db.execAsync(`DROP TABLE IF EXISTS local_user;`);

  await db.execAsync(`DROP TABLE IF EXISTS expenses;`);
  await db.execAsync(`DROP TABLE IF EXISTS expense_categories;`);
  await db.execAsync(`DROP TABLE IF EXISTS expense_templates;`);

  await db.execAsync(`DROP TABLE IF EXISTS products;`);
  await db.execAsync(`DROP TABLE IF EXISTS inventory_batches;`);
  await db.execAsync(`DROP TABLE IF EXISTS inventory_movements;`);

  await db.execAsync(`DROP TABLE IF EXISTS sales;`); 
  await db.execAsync(`DROP TABLE IF EXISTS sale_items;`); */
  

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,

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
    id TEXT PRIMARY KEY,

    company_id TEXT NOT NULL,
    user_id TEXT NOT NULL,

    role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'staff')),

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS local_user (
    id TEXT PRIMARY KEY,
    server_user_id TEXT,

    device_id TEXT,

    name TEXT,
    email TEXT,

    is_synced INTEGER DEFAULT 0,
    last_synced_at TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_company_members_company 
  ON company_members(company_id);


  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,

    company_id TEXT NOT NULL,
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

  CREATE INDEX IF NOT EXISTS idx_expenses_category 
  ON expenses(category_id);

  CREATE INDEX IF NOT EXISTS idx_expenses_company 
  ON expenses(company_id);

  CREATE TABLE IF NOT EXISTS expense_categories (
    id TEXT PRIMARY KEY,

    company_id TEXT,
    created_by TEXT,
    updated_by TEXT,

    name TEXT NOT NULL,
    spendingType TEXT DEFAULT 'neutral'
      CHECK(spendingType IN ('neutral', 'needs', 'wants','savings')),

    color TEXT,
    icon TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_categories_company 
  ON expense_categories(company_id);


  CREATE TABLE IF NOT EXISTS expense_templates (
    id TEXT PRIMARY KEY,

    company_id TEXT,
    created_by TEXT,
    updated_by TEXT,

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
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,

    company_id TEXT,
    created_by TEXT,
    updated_by TEXT,

    name TEXT NOT NULL,
    sku TEXT,
    selling_price REAL NOT NULL,
    cost_price REAL DEFAULT 0,
    stock_quantity REAL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_products_company 
  ON products(company_id);

  CREATE TABLE IF NOT EXISTS inventory_batches (
    id TEXT PRIMARY KEY,

    company_id TEXT,
    created_by TEXT,
    updated_by TEXT,

    product_id TEXT NOT NULL,
    quantity_remaining INTEGER NOT NULL,
    cost_price REAL NOT NULL,
    selling_price REAL NOT NULL,

    date TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,

    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE INDEX IF NOT EXISTS idx_batches_product 
  ON inventory_batches(product_id, created_at, quantity_remaining);

  CREATE INDEX IF NOT EXISTS idx_batches_company 
  ON inventory_batches(company_id);

  CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,

    company_id TEXT,
    created_by TEXT,
    updated_by TEXT,

    product_id TEXT NOT NULL,
    batch_id TEXT,

    unit_cost REAL,
    quantity INTEGER NOT NULL,

    type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment')),

    reference_id TEXT,
    date TEXT NOT NULL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (batch_id) REFERENCES inventory_batches(id)
  );

  CREATE INDEX IF NOT EXISTS idx_movements_product 
  ON inventory_movements(product_id);

  CREATE INDEX IF NOT EXISTS idx_movements_company 
  ON inventory_movements(company_id);

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,

    company_id TEXT,
    created_by TEXT,
    updated_by TEXT,

    title TEXT,
    note TEXT,
    amount REAL,

    date TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sales_company 
  ON sales(company_id);

  CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,

    company_id TEXT,
    created_by TEXT,
    updated_by TEXT,

    sale_id TEXT,
    product_id TEXT,
    batch_id TEXT,

    quantity INTEGER,
    price REAL,
    cost_price REAL NOT NULL,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT,

    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (batch_id) REFERENCES inventory_batches(id)
  );

  CREATE INDEX IF NOT EXISTS idx_sale_items_sale 
  ON sale_items(sale_id);

  CREATE INDEX IF NOT EXISTS idx_sale_items_product 
  ON sale_items(product_id);


  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    operation TEXT,

    payload TEXT NOT NULL,
    client_request_id TEXT UNIQUE,

    status TEXT DEFAULT 'pending',

    created_at TEXT,
    updated_at TEXT,

    retry_count INTEGER DEFAULT 0,
    next_retry_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sync_status 
  ON sync_queue(status);

  CREATE INDEX IF NOT EXISTS idx_sync_model 
  ON sync_queue(model);
`);
};

export default function AppDataProvider({ children }) {
  return (
    <SQLiteProvider databaseName="zeniabiz.db" onInit={migrateDbIfNeeded}>
      <CategoriesProvider />
      <CompanyProvider />
        {children}
    </SQLiteProvider>
  );
}
