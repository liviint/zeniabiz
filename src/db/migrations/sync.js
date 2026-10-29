import {addColumnIfNotExists, deleteColumnIfExists} from "./helpers"
import { newUuid, withTransaction } from "../utils";

export const applySyncMigrationsV1 = async (db) => {
    await addColumnIfNotExists(
        db,
        "sync_queue",
        "record_id",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "sync_queue",
        "error_message",
        "TEXT"
    );
    await deleteColumnIfExists(
        db,
        "sync_queue",
        "payload",
    );
};

export async function applySyncMigrationsV2(db) {
    const columns = await db.getAllAsync(`PRAGMA table_info(sync_state)`);

    // No table exists yet, or it already has the new schema.
    if (
        columns.length === 0 ||
        columns.some((column) => column.name === "company")
    ) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS sync_state (
                company TEXT NOT NULL,
                model TEXT NOT NULL,
                cursor TEXT,
                version INTEGER DEFAULT 0,
                updated_at TEXT,
                PRIMARY KEY (company, model)
            );
        `);

        return;
    }

    // Legacy schema: model is the only primary key.
    // Its cursor cannot safely be attributed to a company.
    await db.execAsync(`
        BEGIN TRANSACTION;

        DROP TABLE sync_state;

        CREATE TABLE sync_state (
            company TEXT NOT NULL,
            model TEXT NOT NULL,
            cursor TEXT,
            version INTEGER DEFAULT 0,
            updated_at TEXT,
            PRIMARY KEY (company, model)
        );

        COMMIT;
    `);
}

const SYNCABLE_TABLES = [
    "expenses",
    "expense_categories",
    "expense_templates",
    "products",
    "inventory_batches",
    "inventory_movements",
    "sales",
    "sale_items",
    "payments",
    "customers",
];

export async function rebuildSyncQueue(db) {
    return withTransaction(db, async() => {
        const now = new Date().toISOString();

        await db.runAsync(`DELETE FROM sync_queue`);

        for (const table of SYNCABLE_TABLES) {
            const records = await db.getAllAsync(`
                SELECT id, company, deleted_at
                FROM ${table}
            `);
            for (const record of records) {
                await db.runAsync(
                    `
                        INSERT INTO sync_queue (
                        id,
                        model,
                        record_id,
                        operation,
                        company,
                        client_request_id,
                        status,
                        created_at,
                        updated_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                    newUuid(),
                    table,
                    record.id,
                    record.deleted_at? "delete": "upsert",
                    record.company,
                    newUuid(),
                    "pending",
                    now,
                    now,
                    ]
                );
            }
        }
    })
}
