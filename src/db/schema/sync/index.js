export async function createSyncTables(db) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            model TEXT NOT NULL,
            record_id TEXT,
            operation TEXT,
            company TEXT,

            client_request_id TEXT UNIQUE,

            status TEXT DEFAULT 'pending',

            created_at TEXT,
            updated_at TEXT,

            retry_count INTEGER DEFAULT 0,
            next_retry_at TEXT,
            error_message TEXT
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
}