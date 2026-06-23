export async function createSessionTables(db) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_session (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_uuid TEXT UNIQUE,
            company_uuid TEXT,
            company_role TEXT,

            access_token TEXT,
            refresh_token TEXT,

            created_at TEXT,
            updated_at TEXT
        );
    ` );
}