import {addColumnIfNotExists} from "./helpers"
export const applyInventoryMigrationsV1 = async (db) => {
    await addColumnIfNotExists(
        db,
        "products",
        "minimum_quantity",
        "INTEGER NOT NULL DEFAULT 5"
    );
};

export const applyInventoryBatchesMigrationsV1 = async (db) => {
    await addColumnIfNotExists(
        db,
        "inventory_batches",
        "purchase_date",
        "TEXT NOT NULL"
    );
    await addColumnIfNotExists(
        db,
        "inventory_batches",
        "expiry_date",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "inventory_batches",
        "batch_number",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "inventory_batches",
        "quantity_on_hand",
        "INTEGER NOT NULL DEFAULT 0"
    );
}

export const applyInventoryMovementsMigrationsV1 = async (db) => {
    await addColumnIfNotExists(
        db,
        "inventory_movements",
        "batch_id",
        "TEXT"
    );
}