export async function createSalesTables(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,

      company TEXT,
      created_by TEXT,
      updated_by TEXT,

      title TEXT,
      note TEXT,
      amount REAL,--marked price
      customer_id TEXT,

      total_amount REAL NOT NULL DEFAULT 0,--total to be paid(actual revenue)
      amount_paid REAL NOT NULL DEFAULT 0,--cash received
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
      item_type TEXT,

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
  `);
}