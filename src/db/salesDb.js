import uuid from "react-native-uuid";

const newUuid = () => uuid.v4();

export async function createOrUpdateSale(
  db,
  {
    items = [],
    note = null,
    date,
    transaction_id = null, // 👈 key
  }
) {
  const now = new Date().toISOString();
  const transactionDate = date ? date.toISOString() : now;

  const isEdit = !!transaction_id;
  const id = transaction_id || newUuid();

  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.quantity),
    0
  );

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 🔁 EDIT MODE: Restore stock + delete old items
    if (isEdit) {
      const oldItems = await db.getAllAsync(
        `
        SELECT product_id, quantity
        FROM transaction_items
        WHERE transaction_id = ?
        `,
        [id]
      );

      // Restore stock
      for (const item of oldItems) {
        await db.runAsync(
          `
          UPDATE products
          SET stock_quantity = stock_quantity + ?
          WHERE id = ?
          `,
          [item.quantity, item.product_id]
        );
      }

      // Delete old items
      await db.runAsync(
        `DELETE FROM transaction_items WHERE transaction_id = ?`,
        [id]
      );

      // Update transaction
      await db.runAsync(
        `
        UPDATE transactions
        SET amount = ?, note = ?, date = ?, updated_at = ?
        WHERE id = ?
        `,
        [total, note ?? null, transactionDate, now, id]
      );
    }

    // ➕ CREATE MODE
    if (!isEdit) {
      await db.runAsync(
        `
        INSERT INTO transactions (
          id, type, amount, note, date, created_at, updated_at
        )
        VALUES (?, 'income', ?, ?, ?, ?, ?)
        `,
        [id, total, note ?? null, transactionDate, now, now]
      );
    }

    // ➕ Insert new items + reduce stock
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
          id,
          String(item.product_id),
          Number(item.quantity),
          Number(item.price),
        ]
      );

      // Reduce stock
      await db.runAsync(
        `
        UPDATE products
        SET stock_quantity = stock_quantity - ?
        WHERE id = ?
        `,
        [
          Number(item.quantity),
          String(item.product_id),
        ]
      );
    }

    await db.runAsync("COMMIT");
    return id;
  } catch (error) {
    await db.runAsync("ROLLBACK");
    console.log("SALE ERROR:", error);
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