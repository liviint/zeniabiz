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
    category,
    category_id
  }
) {
  const now = new Date().toISOString();
  const saleDate = date ? date.toISOString() : now;

  const isEdit = !!sale_id;
  const id = sale_id || newUuid();

  // Calculate totals
  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );
  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity), 0);

  const finalTitle =
    title && title.trim().length > 0
      ? title
      : `Sold ${totalItems} item${totalItems > 1 ? "s" : ""} - ${total}`;

  await db.runAsync("BEGIN TRANSACTION");

  try {
    if (isEdit) {
      // 1️⃣ Restore stock for old items
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

      // 2️⃣ Delete old items
      await db.runAsync(`DELETE FROM sale_items WHERE sale_id = ?`, [id]);

      // 3️⃣ Update sale record including total
      await db.runAsync(
        `
        UPDATE sales
        SET title = ?, note = ?, date = ?, amount = ?, updated_at = ?
        WHERE id = ?
        `,
        [finalTitle, note ?? null, saleDate, total, now, id]
      );

      // 4️⃣ Update transaction linked to this sale
      await db.runAsync(
        `
        UPDATE expenses
        SET amount = ?, title = ?, note = ?, date = ?, updated_at = ?
        WHERE sale_id = ?
        `,
        [total, finalTitle, note ?? null, saleDate, now, id]
      );
    } else {
      // ➕ CREATE MODE
      // 1️⃣ Insert new sale
      await db.runAsync(
        `
        INSERT INTO sales (id, title, note, date, amount, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [id, finalTitle, note ?? null, saleDate, total, now, now]
      );

      // 2️⃣ Insert new transaction
      await db.runAsync(
        `
        INSERT INTO expenses (
          id, type, amount, title, note, date, category, category_id,  sale_id, created_at, updated_at
        )
        VALUES (?, 'income', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [newUuid(), total, finalTitle, note ?? null, saleDate, category,category_id,id, now, now]
      );
    }

    // ➕ Insert items & reduce stock
    for (const item of items) {
      // Validate stock
      const product = await db.getFirstAsync(
        `SELECT stock_quantity FROM products WHERE id = ?`,
        [item.product_id]
      );

      if (!product || product.stock_quantity < item.quantity) {
        throw new Error(`Not enough stock for ${item.name || item.product_id}`);
      }

      // Insert sale item
      await db.runAsync(
        `INSERT INTO sale_items (id, sale_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [newUuid(), id, item.product_id, Number(item.quantity), Number(item.price)]
      );

      // Reduce stock
      await db.runAsync(
        `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    await db.runAsync("COMMIT");
    return id;
  } catch (error) {
    await db.runAsync("ROLLBACK");
    console.error("SALE ERROR:", error);
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
    await db.runAsync(`DELETE FROM expenses WHERE sale_id = ?`, [sale_id]);
    await db.runAsync(`DELETE FROM sales WHERE id = ?`, [sale_id]);

    await db.runAsync("COMMIT");
  } catch (err) {
    await db.runAsync("ROLLBACK");
    throw err;
  }
}