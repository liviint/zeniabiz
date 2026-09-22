import { addColumnIfNotExists } from "./helpers";

export const applySalesMigrationsV1 = async (db) => {
    await addColumnIfNotExists(
        db,
        "sale_items",
        "batch_id",
        "TEXT"
    );
};

export const applySalesMigrationsV2 = async (db) => {
    await addColumnIfNotExists(
        db,
        "sale_items",
        "item_type",
        "TEXT"
    );

    // Backfill existing data
    await db.runAsync(`
        UPDATE sale_items
        SET item_type = CASE
        WHEN batch_id IS NOT NULL THEN 'product'
        ELSE 'service'
        END
    `);
};
//ADD COLUMN amount_waived REAL NOT NULL DEFAULT 0;
export const applySalesMigrationsV3_21_9_2026 = async (db) => {
    await addColumnIfNotExists(
        db,
        "sales",
        "amount_waived",
        "REAL NOT NULL DEFAULT 0"
    );
};