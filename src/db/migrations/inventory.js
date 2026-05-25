import {addColumnIfNotExists} from "./helpers"
export const applyInventoryMigrationsV1 = async (db) => {
    await addColumnIfNotExists(
        db,
        "products",
        "minimum_quantity",
        "INTEGER NOT NULL DEFAULT 5"
    );
};