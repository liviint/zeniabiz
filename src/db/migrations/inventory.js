import {addColumnIfNotExists, deleteColumnIfExists} from "./helpers"
import { newUuid } from "../utils";
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
    await deleteColumnIfExists(
        db,
        "inventory_batches",
        "quantity_remaining",
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

export async function migrateMovementsToBatches(db) {
    const purchases = await db.getAllAsync(`
        SELECT *
        FROM inventory_movements
        WHERE type = 'purchase'
        AND batch_id IS NULL
        AND deleted_at IS NULL
    `);

    for (const purchase of purchases) {
        const batchId = newUuid();

        // Current stock from this purchase
        // Initially assume entire purchase quantity
        const quantityOnHand = purchase.quantity;

        await db.runAsync(
        `
        INSERT INTO inventory_batches (
            id,
            company,
            created_by,
            updated_by,
            product_id,
            quantity_on_hand,
            cost_price,
            selling_price,
            purchase_date,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            batchId,
            purchase.company,
            purchase.created_by,
            purchase.updated_by,
            purchase.product_id,
            quantityOnHand,
            purchase.unit_cost,
            purchase.selling_price,
            purchase.date,
            purchase.created_at,
            purchase.updated_at,
        ]
        );

        await db.runAsync(
        `
        UPDATE inventory_movements
        SET batch_id = ?
        WHERE id = ?
        `,
        [batchId, purchase.id]
        );
    }
}