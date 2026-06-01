import { addColumnIfNotExists } from "./helpers";

export const applySalesMigrationsV1 = async (db) => {
    await addColumnIfNotExists(
        db,
        "sale_items",
        "batch_id",
        "TEXT"
    );
};