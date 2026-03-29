import uuid from "react-native-uuid";

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

// ------------------------
// Get All Products
// ------------------------
export async function getProducts(db) {
  return await db.getAllAsync(`
    SELECT *
    FROM products
    WHERE deleted_at IS NULL
    ORDER BY datetime(created_at) DESC
  `);
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
  const now = new Date().toISOString();

  await db.runAsync(
    `
    UPDATE products
    SET deleted_at = ?, updated_at = ?
    WHERE id = ?
    `,
    [now, now, id]
  );
}

// ------------------------
// Adjust Stock
// ------------------------
export async function adjustStock(db, product_id, quantityChange) {
  await db.runAsync(
    `
    UPDATE products
    SET stock_quantity = stock_quantity + ?
    WHERE id = ?
    `,
    [quantityChange, product_id]
  );
}

// ------------------------
// Create Sale with Items
// ------------------------
export async function createSaleWithItems(
  db,
  { items = [], note = null, date }
) {
  const now = new Date().toISOString();
  const transactionDate = date ? date.toISOString() : now;

  const transaction_id = newUuid();

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1. Create transaction
    await db.runAsync(
      `
      INSERT INTO transactions (
        id, type, amount, note, date, created_at, updated_at
      )
      VALUES (?, 'income', ?, ?, ?, ?, ?)
      `,
      [transaction_id, total, note, transactionDate, now, now]
    );

    // 2. Insert items + update stock
    for (const item of items) {
      const item_id = newUuid();

      await db.runAsync(
        `
        INSERT INTO transaction_items (
          id, transaction_id, product_id, quantity, price
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          item_id,
          transaction_id,
          item.product_id,
          item.quantity,
          item.price,
        ]
      );

      // Reduce stock
      await db.runAsync(
        `
        UPDATE products
        SET stock_quantity = stock_quantity - ?
        WHERE id = ?
        `,
        [item.quantity, item.product_id]
      );
    }

    await db.runAsync("COMMIT");
    return transaction_id;
  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}

// ------------------------
// Get Transaction Items
// ------------------------
export async function getTransactionItems(db, transaction_id) {
  return await db.getAllAsync(
    `
    SELECT ti.*, p.name
    FROM transaction_items ti
    JOIN products p ON p.id = ti.product_id
    WHERE ti.transaction_id = ?
    `,
    [transaction_id]
  );
}

// ------------------------
// Inventory Stats
// ------------------------
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