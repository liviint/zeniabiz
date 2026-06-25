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
