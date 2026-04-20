import uuid from "react-native-uuid";
import { getMonthRange } from "./utils";

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
  const now = new Date().toISOString();

  cost_price = parseFloat(cost_price) || 0;
  selling_price = parseFloat(selling_price) || 0;
  stock_quantity = parseFloat(stock_quantity) || 0;
  created_at = created_at || now;

  const isNew = !id;
  id = id || newUuid();

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ Upsert product (keep minimal responsibility)
    await db.runAsync(
      `
      INSERT INTO products (
        id,
        name,
        selling_price,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)

      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        selling_price = excluded.selling_price,
        updated_at = excluded.updated_at
      `,
      [id, name, selling_price, created_at, now]
    );

    // 2️⃣ ONLY create batch if new product
    if (isNew && stock_quantity > 0) {
      await db.runAsync(
        `
        INSERT INTO inventory_batches
        (product_id, quantity_remaining, cost_price, selling_price)
        VALUES (?, ?, ?, ?)
        `,
        [id, stock_quantity, cost_price, selling_price]
      );

      // optional cached total
      await db.runAsync(
        `
        UPDATE products
        SET stock_quantity = ?
        WHERE id = ?
        `,
        [stock_quantity, id]
      );
    }

    await db.runAsync("COMMIT");
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

export async function getProductWithBatches(db, id) {
  const product = await getProductById(db, id);

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

  return { ...product, batches };
}

export async function deleteProduct(db, id) {
  const now = new Date().toISOString();

  await db.runAsync(
    `
    UPDATE products
    SET deleted_at = ?
    WHERE id = ?
    `,
    [now, id]
  );
}

export const restockProduct = async (db, productId, form) => {
    const { stock_quantity, cost_price, selling_price } = form;

    let id = newUuid();

    await db.runAsync(
        `INSERT INTO inventory_batches 
        (product_id, quantity_remaining, cost_price, selling_price)
        VALUES (?, ?, ?, ?, ?)`,
        [id, productId, stock_quantity, cost_price, selling_price]
    );

    // Optional: update product total (fast reads)
    await db.runAsync(
        `UPDATE products 
         SET total_quantity = total_quantity + ? 
         WHERE id = ?`,
        [stock_quantity, productId]
    );
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