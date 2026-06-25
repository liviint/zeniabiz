export async function createInventoryTables(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,

      company TEXT,
      created_by TEXT,
      updated_by TEXT,

      name TEXT NOT NULL,
      sku TEXT,
      barcode TEXT,

      selling_price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      minimum_quantity INTEGER NOT NULL DEFAULT 5,

      item_type TEXT NOT NULL DEFAULT 'product',
      unit TEXT,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_products_company_created
    ON products(company, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_company_barcode
      ON products(company, barcode)
      WHERE barcode IS NOT NULL
        AND barcode != '';

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
  `);
}