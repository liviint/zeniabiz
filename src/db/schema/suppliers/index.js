export async function createSuppliersTables(db) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,

            company TEXT NOT NULL,
            created_by TEXT,
            updated_by TEXT,

            business_name TEXT NOT NULL,
            contact_person TEXT,

            phone TEXT,
            email TEXT,

            address TEXT,
            notes TEXT,

            is_active INTEGER NOT NULL DEFAULT 1,
            tax_pin TEXT,
            website TEXT,

            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            deleted_at TEXT
        );
    `);
}