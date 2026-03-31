import uuid from "react-native-uuid";

const newUuid = () => uuid.v4();

export async function createOrUpdateSale(
  db,
  {
    items = [],
    note = null,
    date,
    title,
    transaction_id = null,
    category,
    category_id,
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

  // 🔥 Generate fallback title if none provided
  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const finalTitle =
    title && title.trim().length > 0
      ? title
      : `Sold ${totalItems} item${totalItems > 1 ? "s" : ""} - KES ${total}`;

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 🔁 EDIT MODE
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

      // ✅ Update transaction (ADD TITLE HERE)
      await db.runAsync(
          `
          UPDATE transactions
          SET amount = ?, title = ?, note = ?, date = ?, updated_at = ?, category = ?, category_id = ?
          WHERE id = ?
          `,
          [total, finalTitle, note ?? null, transactionDate, now, category ?? null, category_id ?? null, id]
        );
      }

    // ➕ CREATE MODE
    if (!isEdit) {
      await db.runAsync(
          `
          INSERT INTO transactions (
            id, type, amount, title, note, date, created_at, updated_at, category, category_id
          )
          VALUES (?, 'income', ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [id, total, finalTitle, note ?? null, transactionDate, now, now, category ?? null, category_id ?? null]
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

export async function deleteSale(db, transaction_id) {
  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1. Get items
    const items = await db.getAllAsync(
      `
      SELECT product_id, quantity
      FROM transaction_items
      WHERE transaction_id = ?
      `,
      [transaction_id]
    );

    // 2. Restore stock
    for (const item of items) {
      await db.runAsync(
        `
        UPDATE products
        SET stock_quantity = stock_quantity + ?
        WHERE id = ?
        `,
        [item.quantity, item.product_id]
      );
    }

    // 3. Delete items
    await db.runAsync(
      `DELETE FROM transaction_items WHERE transaction_id = ?`,
      [transaction_id]
    );

    // 4. Delete transaction
    await db.runAsync(
      `DELETE FROM transactions WHERE id = ?`,
      [transaction_id]
    );

    await db.runAsync("COMMIT");
  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}