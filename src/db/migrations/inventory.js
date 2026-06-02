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

    await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_batches_expiry
        ON inventory_batches(company, expiry_date);
    `);

}

export const applyInventoryMovementsMigrationsV1 = async (db) => {
    await addColumnIfNotExists(
        db,
        "inventory_movements",
        "batch_id",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "inventory_movements",
        "reason",
        "TEXT"
    );
}

export async function migrateMovementsToBatches(db) {
    const now = new Date().toISOString();

  // 2️⃣ Get all products (we rebuild per product)
    const products = await db.getAllAsync(`
        SELECT id, company, created_by
        FROM products
        WHERE deleted_at IS NULL
    `);

  // 3️⃣ Clear batches (fresh rebuild)
  await db.runAsync(`DELETE FROM inventory_batches`);

  let totalBatches = 0;

  // 4️⃣ Rebuild each product independently
  for (const product of products) {
    const fifo = [];

    // 4.1 Load ONLY movements for this product
    const movements = await db.getAllAsync(
      `
      SELECT *
      FROM inventory_movements
      WHERE deleted_at IS NULL
        AND product_id = ?
      ORDER BY datetime(date), datetime(created_at)
      `,
      [product.id]
    );

    // 4.2 Replay ledger
    for (const m of movements) {
      const qty = Number(m.quantity);

      // -------------------------
      // PURCHASE → create batch layer
      // -------------------------
      if (m.type === "purchase") {
        const batchId = m.batch_id || newUuid();

        fifo.push({
          batchId,
          product_id: m.product_id,
          company: m.company,
          created_by: m.created_by,
          cost_price: m.unit_cost,
          selling_price: m.selling_price || 0,
          remaining: qty,
          purchase_date: m.date,
        });

        // link movement to batch
        await db.runAsync(
          `
          UPDATE inventory_movements
          SET batch_id = ?
          WHERE id = ?
          `,
          [batchId, m.id]
        );
      }

      // -------------------------
      // SALE → consume FIFO
      // -------------------------
      if (m.type === "sale") {
        let toConsume = Math.abs(qty);

        for (const layer of fifo) {
          if (toConsume <= 0) break;
          if (layer.remaining <= 0) continue;

          const take = Math.min(layer.remaining, toConsume);

          layer.remaining -= take;
          toConsume -= take;
        }

        if (toConsume > 0) {
          throw new Error(
            `Negative stock detected during migration for product ${m.product_id}`
          );
        }
      }

      // -------------------------
      // ADJUSTMENT → direct stock layer
      // -------------------------
      if (m.type === "adjustment") {
        const batchId = m.batch_id || newUuid();

        fifo.push({
          batchId,
          product_id: m.product_id,
          company: m.company,
          created_by: m.created_by,
          cost_price: m.unit_cost,
          selling_price: 0,
          remaining: qty,
          purchase_date: m.date,
        });

        await db.runAsync(
          `
          UPDATE inventory_movements
          SET batch_id = ?
          WHERE id = ?
          `,
          [batchId, m.id]
        );
      }
    }

    // 5️⃣ Persist batches for this product
    for (const layer of fifo) {
      if (layer.remaining <= 0) continue;

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
          batch_number,
          expiry_date,
          purchase_date,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          layer.batchId,
          layer.company,
          layer.created_by,
          layer.created_by,
          layer.product_id,
          layer.remaining,
          layer.cost_price,
          layer.selling_price,
          null,
          null,
          layer.purchase_date,
          now,
          now,
        ]
      );

      totalBatches++;
    }
  }
  

  return {
    success: true,
    batchesCreated: totalBatches,
  };
}