import uuid from "react-native-uuid";
import { getMonthRange } from "./utils"; 

const newUuid = () => uuid.v4();

export async function createOrUpdateSale(
  db,
  {
    sale_id = null,
    items = [],
    note = null,
    date,
    title,
  }
) {
  const now = new Date().toISOString();
  const saleDate = date ? date.toISOString() : now;

  const isEdit = !!sale_id;
  const id = sale_id || newUuid();

  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

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
      // 1. Restore stock
      const oldItems = await db.getAllAsync(
        `SELECT product_id, quantity FROM sale_items WHERE sale_id = ?`,
        [id]
      );

      for (const item of oldItems) {
        await db.runAsync(
          `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      }

      // 2. Delete old items
      await db.runAsync(`DELETE FROM sale_items WHERE sale_id = ?`, [id]);

      // 3. Update sale
      await db.runAsync(
        `
        UPDATE sales
        SET title = ?, note = ?, date = ?, updated_at = ?
        WHERE id = ?
        `,
        [finalTitle, note ?? null, saleDate, now, id]
      );

      // 4. Update transaction
      await db.runAsync(
        `
        UPDATE transactions
        SET amount = ?, title = ?, note = ?, date = ?, updated_at = ?
        WHERE sale_id = ?
        `,
        [total, finalTitle, note ?? null, saleDate, now, id]
      );
    }

    // ➕ CREATE MODE
    if (!isEdit) {
      // 1. Create sale
      await db.runAsync(
        `
        INSERT INTO sales (id, title, note, date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [id, finalTitle, note ?? null, saleDate, now, now]
      );

      // 2. Create transaction
      await db.runAsync(
        `
        INSERT INTO transactions (
          id, type, amount, title, note, date, category, sale_id, created_at, updated_at
        )
        VALUES (?, 'income', ?, ?, ?, ?, 'Product Sales', ?, ?, ?)
        `,
        [newUuid(), total, finalTitle, note ?? null, saleDate, id, now, now]
      );
    }

    // ➕ Insert items + reduce stock
    for (const item of items) {
      // 🔒 Stock validation
      const product = await db.getFirstAsync(
        `SELECT stock_quantity FROM products WHERE id = ?`,
        [item.product_id]
      );

      if (!product || product.stock_quantity < item.quantity) {
        throw new Error("Not enough stock");
      }

      await db.runAsync(
        `
        INSERT INTO sale_items (id, sale_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          newUuid(),
          id,
          item.product_id,
          Number(item.quantity),
          Number(item.price),
        ]
      );

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
    return id;

  } catch (error) {
    await db.runAsync("ROLLBACK");
    console.log("SALE ERROR:", error);
    throw error;
  }
}



export async function getSales(db, selectedMonth) {
  let sql = `
    SELECT *
    FROM sales
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

  sql += `
    ORDER BY datetime(created_at) DESC
  `;

  return await db.getAllAsync(sql, params);
}

export async function getSaleItems(db, sale_id) {
  return await db.getAllAsync(
    `
    SELECT si.*, p.name
    FROM sale_items si
    JOIN products p ON p.id = si.product_id
    WHERE si.sale_id = ?
    `,
    [sale_id]
  );
}

export async function getSaleById(db, sale_id) {
  return await db.getFirstAsync(
    `SELECT * FROM sales WHERE id = ?`,
    [sale_id]
  );
}

export async function deleteSale(db, sale_id) {
  await db.runAsync("BEGIN TRANSACTION");

  try {
    // Restore stock
    const items = await db.getAllAsync(
      `SELECT product_id, quantity FROM sale_items WHERE sale_id = ?`,
      [sale_id]
    );

    for (const item of items) {
      await db.runAsync(
        `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // Delete everything
    await db.runAsync(`DELETE FROM sale_items WHERE sale_id = ?`, [sale_id]);
    await db.runAsync(`DELETE FROM transactions WHERE sale_id = ?`, [sale_id]);
    await db.runAsync(`DELETE FROM sales WHERE id = ?`, [sale_id]);

    await db.runAsync("COMMIT");
  } catch (err) {
    await db.runAsync("ROLLBACK");
    throw err;
  }
}