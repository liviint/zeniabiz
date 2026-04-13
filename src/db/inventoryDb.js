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
  created_at = created_at || now

  await db.runAsync("BEGIN TRANSACTION");

  try {
    id = id || newUuid();

    await db.runAsync(
      `
      INSERT INTO products (
        id,
        name,
        cost_price,
        selling_price,
        stock_quantity,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)

      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        cost_price = excluded.cost_price,
        selling_price = excluded.selling_price,
        stock_quantity = excluded.stock_quantity,
        updated_at = excluded.updated_at
      `,
      [id, name, cost_price, selling_price, stock_quantity, created_at, now]
    );

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
    SELECT *
    FROM products
    WHERE deleted_at IS NULL
  `;

  const params = [];

  if (selectedMonth) {
    const { startDate, endDate } = getMonthRange(selectedMonth);

    sql += `
      AND created_at >= ?
      AND created_at < ?
    `;
    params.push(startDate, endDate);
  }

  if (search) {
    sql += `
      AND (name LIKE ? OR sku LIKE ?)
    `;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (filter === "low_stock") {
    sql += `
      AND stock_quantity > 0
      AND stock_quantity <= 5
    `;
  } else if (filter === "out_of_stock") {
    sql += `
      AND stock_quantity = 0
    `;
  }

  if (sort === "newest") {
    sql += ` ORDER BY datetime(created_at) DESC`;
  } else if (sort === "oldest") {
    sql += ` ORDER BY datetime(created_at) ASC`;
  } else if (sort === "high_stock") {
    sql += ` ORDER BY stock_quantity DESC`;
  } else if (sort === "low_stock") {
    sql += ` ORDER BY stock_quantity ASC`;
  } else if (sort === "price_high") {
    sql += ` ORDER BY selling_price DESC`;
  } else if (sort === "price_low") {
    sql += ` ORDER BY selling_price ASC`;
  } else {
    sql += ` ORDER BY datetime(created_at) DESC`; // fallback
  }

  return await db.getAllAsync(sql, params);
}

export async function getProductById(db, id) {
  return await db.getFirstAsync(
    `
    SELECT *
    FROM products
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );
}

export async function deleteProduct(db, id) {
  await db.runAsync(
    `
    DELETE FROM products
    WHERE id = ?
    `,
    [id]
  );
}

export async function restockProduct(db, product_id, quantityChange) {
  await db.runAsync(
    `
    UPDATE products
    SET stock_quantity = stock_quantity + ?
    WHERE id = ?
    `,
    [quantityChange, product_id]
  );
}


export async function getInventoryStats(db) {
  const result = await db.getFirstAsync(`
    SELECT
      COUNT(*) as total_products,
      SUM(stock_quantity) as total_stock,
      SUM(stock_quantity * cost_price) as stock_value
    FROM products
    WHERE deleted_at IS NULL
  `);

  return {
    totalProducts: result?.total_products || 0,
    totalStock: result?.total_stock || 0,
    stockValue: result?.stock_value || 0,
  };
}