import uuid from "react-native-uuid";
import { syncEvent } from "../cloudSync/syncEvent";
import { getMonthRange , getActiveContextSync, withTransaction} from "./utils";

const newUuid = () => uuid.v4();

export async function upsertProduct(
  db,
  {
    id,
    name,
    cost_price = 0,
    selling_price = 0,
    stock_quantity = 0,
    created_at,
  }
) {
  return withTransaction(db, async () => {
    const { company, user_id } = getActiveContextSync(db);

    const now = new Date().toISOString();

    const isNew = !id;
    id = id || newUuid();

    const unitCost = parseFloat(cost_price) || 0;
    const sellPrice = parseFloat(selling_price) || 0;
    const initialStock = parseFloat(stock_quantity) || 0;

    created_at = created_at || now;

    // 1️⃣ PRODUCT ONLY
      await db.runAsync(
        `
        INSERT INTO products (
          id,
          company,
          created_by,
          updated_by,
          name,
          selling_price,
          cost_price,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          selling_price = excluded.selling_price,
          cost_price = excluded.cost_price,
          updated_at = excluded.updated_at,
          updated_by = excluded.updated_by
        `,
        [
          id,
          company,
          user_id,
          user_id,
          name,
          sellPrice,
          unitCost,
          created_at,
          now,
        ]
      );

      // 2️⃣ INITIAL STOCK → delegate to restock
      if (isNew && initialStock > 0) {
          await restockProduct(db, id, {
                stock_quantity: initialStock,
                cost_price: unitCost,
                selling_price: sellPrice,
              }
            );
      }

    // 3️⃣ SYNC PRODUCT (should ideally be queued in DB)
      syncEvent(db, {
        model: "products",
        operation: "upsert",
        payload: {
          id,
          company,
          created_by: user_id,
          updated_by: user_id,
          name,
          selling_price: sellPrice,
          cost_price: unitCost,
          created_at,
          updated_at: now,
          deleted_at: null,
        },
      }).catch((err) => {
        console.error("Sync failed:", err);
      });
      return id;

    })
}

export async function getProducts(
  db,
  {
    selectedMonth = null,
    search = "",
    filter = "all",
    sort = "newest",
  } = {}
) {
  let sql = `
    SELECT 
      p.*,
      COALESCE(SUM(b.quantity_remaining), 0) AS stock_quantity,
      COALESCE(SUM(b.quantity_remaining * b.cost_price), 0) AS stock_value
    FROM products p
    LEFT JOIN inventory_batches b
      ON p.id = b.product_id
      AND b.quantity_remaining > 0
    WHERE p.deleted_at IS NULL
  `;

  const params = [];

  // 📅 Month filter
  if (selectedMonth) {
    const { startDate, endDate } = getMonthRange(selectedMonth);

    sql += `
      AND p.created_at >= ?
      AND p.created_at < ?
    `;
    params.push(startDate, endDate);
  }

  // 🔍 Search
  if (search) {
    sql += `
      AND (p.name LIKE ? OR p.sku LIKE ?)
    `;
    params.push(`%${search}%`, `%${search}%`);
  }

  // 🧱 GROUPING (REQUIRED)
  sql += ` GROUP BY p.id`;

  // 🎯 Filters (must use HAVING)
  if (filter === "low_stock") {
    sql += `
      HAVING stock_quantity > 0
      AND stock_quantity <= 5
    `;
  } else if (filter === "out_of_stock") {
    sql += `
      HAVING stock_quantity = 0
    `;
  }

  // 🔃 Sorting
  if (sort === "newest") {
    sql += ` ORDER BY datetime(p.created_at) DESC`;
  } else if (sort === "oldest") {
    sql += ` ORDER BY datetime(p.created_at) ASC`;
  } else if (sort === "high_stock") {
    sql += ` ORDER BY stock_quantity DESC`;
  } else if (sort === "low_stock") {
    sql += ` ORDER BY stock_quantity ASC`;
  } else if (sort === "price_high") {
    sql += ` ORDER BY p.selling_price DESC`;
  } else if (sort === "price_low") {
    sql += ` ORDER BY p.selling_price ASC`;
  } else {
    sql += ` ORDER BY datetime(p.created_at) DESC`;
  }

  return await db.getAllAsync(sql, params);
}

export async function getProductById(db, id) {
  return await db.getFirstAsync(
    `
    SELECT 
      p.*,
      COALESCE(SUM(b.quantity_remaining), 0) AS stock_quantity,
      COALESCE(SUM(b.quantity_remaining * b.cost_price), 0) AS stock_value
    FROM products p
    LEFT JOIN inventory_batches b
      ON p.id = b.product_id
      AND b.quantity_remaining > 0
    WHERE p.id = ?
    GROUP BY p.id
    LIMIT 1
    `,
    [id]
  );
}

export async function getProductBatches(db, id) {
  const batches = await db.getAllAsync(
    `
    SELECT *
    FROM inventory_batches
    WHERE product_id = ?
    AND quantity_remaining > 0
    ORDER BY created_at ASC
    `,
    [id]
  );

  return batches
}

export async function deleteProduct(db, id) {
  const now = new Date().toISOString();

  if (!id) {
    throw new Error("Product id is required");
  }

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 🗑 Soft delete product
    await db.runAsync(
      `
      UPDATE products
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      `,
      [now, now, id]
    );

    await db.runAsync("COMMIT");

    // 🔥 SYNC EVENT (AFTER COMMIT)
    syncEvent(db, {
      model: "products",
      operation: "delete",
      payload: {
        id,
        deleted_at: now
      }
    })
    .catch(err => {
  console.error("Sync failed:", err);
});

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}

export const restockProduct = async (
  db,
  productId,
  form,
) => {

    const { company, user_id } = getActiveContextSync(db);

    const { stock_quantity, cost_price, selling_price } = form;

    const now = new Date().toISOString();

    const quantity = Number(stock_quantity);
    const unitCost = Number(cost_price);
    const sellPrice = Number(selling_price);

    if (!quantity || quantity <= 0) {
      throw new Error("Stock quantity must be greater than 0");
    }

    if (isNaN(unitCost) || isNaN(sellPrice)) {
      throw new Error("Invalid pricing values");
    }

    const batchId = newUuid();
    const movementId = newUuid();

    // ✅ SINGLE SOURCE OBJECT
    const movement = {
      id: movementId,
      product_id: productId,
      batch: batchId,
      unit_cost: unitCost,
      selling_price: sellPrice,
      quantity,
      type: "purchase",
      date: now,
      company,
      created_by: user_id,
      updated_by: user_id,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
  
    // ✅ 1️⃣ INSERT MOVEMENT
    await db.runAsync(
      `
      INSERT INTO inventory_movements
      (id, company, created_by, updated_by, product_id, batch, unit_cost, quantity, type, date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        movement.id,
        movement.company,
        movement.created_by,
        movement.updated_by,
        movement.product_id,
        movement.batch,
        movement.unit_cost,
        movement.quantity,
        movement.type,
        movement.date,
        movement.created_at,
        movement.updated_at,
      ]
    );

    // ✅ 2️⃣ APPLY PROJECTION
    await applyMovementToBatches(db, movement);

    // ✅ 3️⃣ SYNC ONLY MOVEMENT
    syncEvent(db, {
      model: "inventory_movements",
      operation: "insert",
      payload: movement,
    }).catch(console.error);

    return batchId;

};

export async function applyMovementToBatches(db, movement,) {
  const {
    id,
    product_id,
    batch,
    quantity,
    type,
    unit_cost,
    selling_price,
    company,
    created_by,
    updated_by,
    date,
  } = movement;
  
    const now = new Date().toISOString();

    // 🔒 Idempotency check
    const exists = await db.getFirstAsync(
      `SELECT id FROM applied_movements WHERE id = ?`,
      [id]
    );
    if (exists) return;

  try {
    if (type === "purchase") {
      await db.runAsync(
        `
        INSERT OR IGNORE INTO inventory_batches
        (id, company, created_by, updated_by, product_id, quantity_remaining, cost_price, selling_price, date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          batch,
          company,
          created_by,
          updated_by,
          product_id,
          quantity,
          unit_cost,
          selling_price, // ⚠️ replace later with real selling_price
          date,
          now,
          now,
        ]
      );
    }

    else if (type === "sale") {
      let remaining = Math.abs(quantity);

      const batches = await db.getAllAsync(
        `
        SELECT id, quantity_remaining
        FROM inventory_batches
        WHERE product_id = ?
          AND quantity_remaining > 0
          AND deleted_at IS NULL
        ORDER BY date ASC, created_at ASC
        `,
        [product_id]
      );

      for (const b of batches) {
        if (remaining <= 0) break;

        const deduct = Math.min(b.quantity_remaining, remaining);

        await db.runAsync(
          `
          UPDATE inventory_batches
          SET quantity_remaining = quantity_remaining - ?,
              updated_at = ?
          WHERE id = ?
          `,
          [deduct, now, b.id]
        );

        remaining -= deduct;
      }

      if (remaining > 0) {
        throw new Error(
          `Insufficient stock for product ${product_id}. Missing ${remaining}`
        );
      }
    }

    else if (type === "adjustment") {
      if (quantity > 0) {
        await db.runAsync(
          `
          INSERT INTO inventory_batches
          (id, company, created_by, updated_by, product_id, quantity_remaining, cost_price, selling_price, date, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            batch || newUuid(),
            company,
            created_by,
            updated_by,
            product_id,
            quantity,
            unit_cost || 0,
            0,
            date,
            now,
            now,
          ]
        );
      } else {
        let remaining = Math.abs(quantity);

        const batches = await db.getAllAsync(
          `
          SELECT id, quantity_remaining
          FROM inventory_batches
          WHERE product_id = ?
            AND quantity_remaining > 0
            AND deleted_at IS NULL
          ORDER BY date ASC, created_at ASC
          `,
          [product_id]
        );

        for (const b of batches) {
          if (remaining <= 0) break;

          const deduct = Math.min(b.quantity_remaining, remaining);

          await db.runAsync(
            `
            UPDATE inventory_batches
            SET quantity_remaining = quantity_remaining - ?,
                updated_at = ?
            WHERE id = ?
            `,
            [deduct, now, b.id]
          );

          remaining -= deduct;
        }

        if (remaining > 0) {
          throw new Error(
            `Adjustment failed. Not enough stock for ${product_id}`
          );
        }
      }
    }

    else {
      throw new Error(`Unsupported movement type: ${type}`);
    }

    // ✅ MARK AS APPLIED (CRITICAL)
    await db.runAsync(
      `
      INSERT INTO applied_movements (id, applied_at)
      VALUES (?, ?)
      `,
      [id, now]
    );


  } catch (error) {
    throw error;
  }
  
}

export async function getInventoryStats(db) {
  const result = await db.getFirstAsync(`
    SELECT
      COUNT(DISTINCT p.id) as total_products,
      COALESCE(SUM(b.quantity_remaining), 0) as total_stock,
      COALESCE(SUM(b.quantity_remaining * b.cost_price), 0) as stock_value
    FROM products p
    LEFT JOIN inventory_batches b
      ON p.id = b.product_id
      AND b.quantity_remaining > 0
    WHERE p.deleted_at IS NULL
  `);

  return {
    totalProducts: result?.total_products || 0,
    totalStock: result?.total_stock || 0,
    stockValue: result?.stock_value || 0,
  };
}

export const getStockMovements = async (db, limit = 100) => {
  const result = await db.getAllAsync(
    `
    SELECT 
      m.id,
      m.product_id,
      p.name AS product_name,
      m.batch,
      m.quantity,
      m.unit_cost,
      m.type,
      m.reference_id,
      m.date
    FROM inventory_movements m
    LEFT JOIN products p ON p.id = m.product_id
    ORDER BY m.date DESC
    LIMIT ?
    `,
    [limit]
  );

  return result;
};