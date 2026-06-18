export async function createPaymentsTables(db) {
    await db.execAsync(`
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

    `);
}