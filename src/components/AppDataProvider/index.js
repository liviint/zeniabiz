import { SQLiteProvider } from "expo-sqlite";
import SessionProvider from "./SessionProvider"
import SyncProvider from "./SyncProvider"
import GoogleBackUpProvider from "./GoogleBackUpProvider"
import { 
  applyInventoryMigrationsV1 ,
  applyInventoryBatchesMigrationsV1,
  applyInventoryMovementsMigrationsV1,
  migrateMovementsToBatches
} from "../../db/migrations/inventory"
import {migrateSalesCreditFieldsV1, migratePaymentsFromSalesV1} from "../../db/migrations/credit"
import { applySalesMigrationsV1 } from "../../db/migrations/sales"

const migrateDbIfNeeded = async (db) => {

  // await db.execAsync(`DELETE FROM `);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

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

  CREATE TABLE IF NOT EXISTS app_session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_uuid TEXT UNIQUE,
    company_uuid TEXT,

    access_token TEXT,
    refresh_token TEXT,

    created_at TEXT,
    updated_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_company_members_company 
  ON company_members(company);


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

  CREATE INDEX IF NOT EXISTS idx_expenses_category 
  ON expenses(category_id);

  CREATE INDEX IF NOT EXISTS idx_expenses_company_date
  ON expenses(company, date DESC);

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

  CREATE INDEX IF NOT EXISTS idx_categories_company 
  ON expense_categories(company);


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

  CREATE INDEX IF NOT EXISTS idx_templates_company_usage
  ON expense_templates(company, usage_count DESC, updated_at DESC);

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,

    company TEXT,
    created_by TEXT,
    updated_by TEXT,

    name TEXT NOT NULL,
    sku TEXT,
    selling_price REAL NOT NULL,
    cost_price REAL DEFAULT 0,
    minimum_quantity INTEGER NOT NULL DEFAULT 5,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_products_company_created
  ON products(company, created_at DESC);

  CREATE TABLE IF NOT EXISTS inventory_batches (
    id TEXT PRIMARY KEY,

    company TEXT,
    created_by TEXT,
    updated_by TEXT,

    product_id TEXT NOT NULL,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    cost_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    batch_number TEXT,
    expiry_date TEXT,

    purchase_date TEXT NOT NULL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,

    FOREIGN KEY (product_id) REFERENCES products(id)
  );


  CREATE INDEX IF NOT EXISTS idx_batches_company_product
  ON inventory_batches(company, product_id);

  CREATE INDEX IF NOT EXISTS idx_batches_expiry
  ON inventory_batches(company, expiry_date);

  CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,

    company TEXT,
    created_by TEXT,
    updated_by TEXT,

    product_id TEXT NOT NULL,

    unit_cost REAL,
    selling_price REAL,
    quantity INTEGER NOT NULL,

    type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment')),
    reason TEXT,

    reference_id TEXT,
    batch_id TEXT,
    date TEXT NOT NULL,

    processed_at TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,

    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE INDEX IF NOT EXISTS idx_movements_company_product_date
  ON inventory_movements(company, product_id, date, created_at);

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,

    company TEXT,
    created_by TEXT,
    updated_by TEXT,

    title TEXT,
    note TEXT,
    amount REAL,
    customer_id TEXT,

    total_amount REAL NOT NULL DEFAULT 0,
    amount_paid REAL NOT NULL DEFAULT 0,
    balance_due REAL NOT NULL DEFAULT 0,
    is_credit_sale INTEGER DEFAULT 0,

    discount REAL NOT NULL DEFAULT 0,
    discount_type TEXT DEFAULT 'fixed',

    payment_status TEXT NOT NULL DEFAULT 'PAID',
    due_date TEXT,

    date TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sales_company_date
  ON sales(company, date DESC);

  CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,

    company TEXT,
    created_by TEXT,
    updated_by TEXT,

    sale_id TEXT,
    product_id TEXT,

    purchase_movement_id TEXT,
    batch_id TEXT,

    quantity INTEGER,
    price REAL,
    cost_price REAL NOT NULL,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT,

    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (purchase_movement_id) REFERENCES inventory_movements(id)
);

  CREATE INDEX IF NOT EXISTS idx_sale_items_sale 
  ON sale_items(sale_id);

  CREATE INDEX IF NOT EXISTS idx_sale_items_product 
  ON sale_items(product_id);

  CREATE INDEX IF NOT EXISTS idx_sale_items_company
  ON sale_items(company);

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,

    company TEXT,
    created_by TEXT,
    updated_by TEXT,

    sale_id TEXT NOT NULL,
    customer_id TEXT,
    payment_type TEXT,

    amount REAL NOT NULL,

    payment_method TEXT,
    note TEXT,

    date TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_payments_sale_id
  ON payments(sale_id);

  CREATE INDEX IF NOT EXISTS idx_payments_customer_id
  ON payments(customer_id);

  CREATE INDEX IF NOT EXISTS idx_payments_company
  ON payments(company);

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,

    company TEXT NOT NULL,

    name TEXT NOT NULL,
    phone TEXT,

    note TEXT,

    created_by TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    operation TEXT,
    company TEXT,

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

  CREATE INDEX IF NOT EXISTS idx_sync_pending
  ON sync_queue(status, next_retry_at);

  CREATE TABLE IF NOT EXISTS sync_state (
    model TEXT PRIMARY KEY,
    cursor TEXT,
    version INTEGER DEFAULT 0,
    updated_at TEXT
  );

`);
  //Fourth release
  await applyInventoryMigrationsV1(db);
  await migrateSalesCreditFieldsV1(db);
  await migratePaymentsFromSalesV1(db);
  
  //Fifth release
  await applyInventoryBatchesMigrationsV1(db);
  await applySalesMigrationsV1(db);
  await applyInventoryMovementsMigrationsV1(db);
  await migrateMovementsToBatches(db)
};

export default function AppDataProvider({ children }) {
  return (
    <SQLiteProvider databaseName="zeniabiz.db" onInit={migrateDbIfNeeded}>
      <SessionProvider>
        <SyncProvider>
          <GoogleBackUpProvider>
            {children}
          </GoogleBackUpProvider>
        </SyncProvider>
      </SessionProvider>
    </SQLiteProvider>
  );
}
