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
};