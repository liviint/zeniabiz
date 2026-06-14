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