import uuid from "react-native-uuid";
import { syncEvent } from "../cloudSync/syncEvent";
import { getMonthRange , getActiveContextSync} from "./utils";

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
  const { company_id, user_id } = getActiveContextSync(db);

  const now = new Date().toISOString();

  cost_price = parseFloat(cost_price) || 0;
  selling_price = parseFloat(selling_price) || 0;
  stock_quantity = parseFloat(stock_quantity) || 0;

  created_at = created_at || now;

  const isNew = !id;
  id = id || newUuid();

  const batchId = newUuid();
  const movementId = newUuid();

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ PRODUCT UPSERT
    await db.runAsync(
      `
      INSERT INTO products (
        id,
        company_id,
        created_by,
        updated_by,
        name,
        selling_price,
        cost_price,
        stock_quantity,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        selling_price = excluded.selling_price,
        cost_price = excluded.cost_price,
        stock_quantity = excluded.stock_quantity,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
      `,
      [
        id,
        company_id,
        user_id,
        user_id,
        name,
        selling_price,
        cost_price,
        stock_quantity,
        created_at,
        now,
      ]
    );

    // 2️⃣ INITIAL STOCK (ONLY IF NEW)
    if (isNew && stock_quantity > 0) {
      await db.runAsync(
        `
        INSERT INTO inventory_batches
        (id, product_id, quantity_remaining, cost_price, selling_price, date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          batchId,
          id,
          stock_quantity,
          cost_price,
          selling_price,
          now,
          now,
          now,
        ]
      );

      await db.runAsync(
        `
        INSERT INTO inventory_movements
        (id, product_id, batch_id, unit_cost, quantity, type, date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'purchase', ?, ?, ?)
        `,
        [
          movementId,
          id,
          batchId,
          cost_price,
          stock_quantity,
          now,
          now,
          now,
        ]
      );
    }

    await db.runAsync("COMMIT");
    // 🔥 3️⃣ SYNC EVENT (PRODUCT ONLY)
    await syncEvent(db, {
      model: "products",
      operation: "upsert",
      payload: {
        id,

        company_id,
        created_by: user_id,
        updated_by: user_id,

        name,
        selling_price,
        cost_price,
        stock_quantity,

        created_at,
        updated_at: now,
        deleted_at: null
      }
    });

    // 🔥 4️⃣ OPTIONAL (IMPORTANT IMPROVEMENT)
    // You SHOULD also sync inventory events separately:
    if (isNew && stock_quantity > 0) {
      await syncEvent(db, {
        model: "inventory_batches",
        operation: "insert",
        payload: {
          id: batchId,
          product_id: id,
          quantity_remaining: stock_quantity,
          cost_price,
          selling_price,
          date: now,
          created_at: now,
          updated_at: now,
          deleted_at: null,

          company_id,
          created_by: user_id,
          updated_by: user_id
        }
      });

      await syncEvent(db, {
        model: "inventory_movements",
        operation: "insert",
        payload: {
          id: movementId,
          product_id: id,
          batch_id: batchId,
          unit_cost: cost_price,
          quantity: stock_quantity,
          type: "purchase",
          date: now,
          created_at: now,
          updated_at: now,
          deleted_at: null,

          company_id,
          created_by: user_id,
          updated_by: user_id
        }
      });
    }

    return id;

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
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
    await syncEvent(db, {
      model: "products",
      operation: "delete",
      payload: {
        id,
        deleted_at: now
      }
    });

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}

export const restockProduct = async (db, productId, form) => {
  const { company_id, user_id } = getActiveContextSync();

  const { stock_quantity, cost_price, selling_price } = form;

  const now = new Date().toISOString();

  const quantity = parseFloat(stock_quantity) || 0;
  const unitCost = parseFloat(cost_price) || 0;
  const sellPrice = parseFloat(selling_price) || 0;

  if (quantity <= 0) {
    throw new Error("Stock quantity must be greater than 0");
  }

  const batchId = newUuid();
  const movementId = newUuid();

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ Batch (source of truth)
    await db.runAsync(
      `
      INSERT INTO inventory_batches 
      (id, product_id, quantity_remaining, cost_price, selling_price, date)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [batchId, productId, quantity, unitCost, sellPrice, now]
    );

    // 2️⃣ Movement (audit log)
    await db.runAsync(
      `
      INSERT INTO inventory_movements
      (id, product_id, batch_id, unit_cost, quantity, type, date)
      VALUES (?, ?, ?, ?, ?, 'purchase', ?)
      `,
      [
        movementId,
        productId,
        batchId,
        unitCost,
        quantity,
        now,
      ]
    );

    // 3️⃣ Product projection
    await db.runAsync(
      `
      UPDATE products 
      SET stock_quantity = COALESCE(stock_quantity, 0) + ?,
          updated_at = ?
      WHERE id = ?
      `,
      [quantity, now, productId]
    );

    await db.runAsync("COMMIT");

    // 🔥 4️⃣ SYNC REAL ENTITIES (NOT BUSINESS EVENT)

    await syncEvent(db, {
      model: "inventory_batches",
      operation: "insert",
      payload: {
        id: batchId,
        product_id: productId,
        quantity_remaining: quantity,
        cost_price: unitCost,
        selling_price: sellPrice,
        date: now,

        company_id,
        created_by: user_id,
        updated_by: user_id,
        created_at: now,
        updated_at: now,
        deleted_at: null
      }
    });

    await syncEvent(db, {
      model: "inventory_movements",
      operation: "insert",
      payload: {
        id: movementId,
        product_id: productId,
        batch_id: batchId,
        unit_cost: unitCost,
        quantity,
        type: "purchase",
        date: now,

        company_id,
        created_by: user_id,
        updated_by: user_id,
        created_at: now,
        updated_at: now,
        deleted_at: null
      }
    });

    return batchId;

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
};


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
      m.batch_id,
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