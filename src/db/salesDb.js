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