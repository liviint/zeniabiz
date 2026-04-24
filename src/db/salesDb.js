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
    title?.trim()?.length > 0
      ? title
      : `Sold ${totalItems} item${totalItems > 1 ? "s" : ""} - ${total}`;

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // -------------------------
    // 🟡 EDIT FLOW (restore state)
    // -------------------------
    if (isEdit) {
      const oldItems = await db.getAllAsync(
        `SELECT batch_id, quantity FROM sale_items WHERE sale_id = ?`,
        [id]
      );

      // Restore batch quantities
      for (const item of oldItems) {
        await db.runAsync(
          `UPDATE inventory_batches
           SET quantity_remaining = quantity_remaining + ?
           WHERE id = ?`,
          [item.quantity, item.batch_id]
        );
      }

      // Remove old sale_items
      await db.runAsync(
        `DELETE FROM sale_items WHERE sale_id = ?`,
        [id]
      );

      // 🔥 Remove old movements
      await db.runAsync(
        `DELETE FROM inventory_movements WHERE reference_id = ?`,
        [id]
      );

      // Update sale
      await db.runAsync(
        `
        UPDATE sales
        SET title = ?, note = ?, date = ?, amount = ?, updated_at = ?
        WHERE id = ?
        `,
        [finalTitle, note ?? null, saleDate, total, now, id]
      );
    } else {
      // -------------------------
      // 🟢 CREATE NEW SALE
      // -------------------------
      await db.runAsync(
        `
        INSERT INTO sales (id, title, note, date, amount, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [id, finalTitle, note ?? null, saleDate, total, now, now]
      );
    }

    // -------------------------
    // 🔵 VALIDATE STOCK
    // -------------------------
    for (const item of items) {
      let required = Number(item.quantity);

      if (item.batch_id) {
        const batch = await db.getFirstAsync(
          `SELECT quantity_remaining FROM inventory_batches WHERE id = ?`,
          [item.batch_id]
        );

        if (!batch || batch.quantity_remaining < required) {
          throw new Error(`Not enough stock in selected batch`);
        }
      } else {
        const batches = await db.getAllAsync(
          `SELECT quantity_remaining FROM inventory_batches
           WHERE product_id = ? AND quantity_remaining > 0
           ORDER BY date ASC`,
          [item.product_id]
        );

        const totalAvailable = batches.reduce(
          (sum, b) => sum + b.quantity_remaining,
          0
        );

        if (totalAvailable < required) {
          throw new Error(`Not enough stock for ${item.name}`);
        }
      }
    }

    // -------------------------
    // 🔴 APPLY SALE (FIFO / DIRECT)
    // -------------------------
    for (const item of items) {
      let remaining = Number(item.quantity);

      // -------------------------
      // 🔹 DIRECT BATCH SALE
      // -------------------------
      if (item.batch_id) {
        const batch = await db.getFirstAsync(
          `SELECT cost_price FROM inventory_batches WHERE id = ?`,
          [item.batch_id]
        );

        // Deduct batch
        await db.runAsync(
          `UPDATE inventory_batches
           SET quantity_remaining = quantity_remaining - ?
           WHERE id = ?`,
          [remaining, item.batch_id]
        );

        // Insert sale item
        await db.runAsync(
          `INSERT INTO sale_items 
          (id, sale_id, product_id, batch_id, quantity, price, cost_price)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            newUuid(),
            id,
            item.product_id,
            item.batch_id,
            remaining,
            item.price,
            batch.cost_price,
          ]
        );

        // 🔥 Log movement
        await db.runAsync(
          `
          INSERT INTO inventory_movements
          (id, product_id, batch_id, unit_cost, quantity, type, reference_id, date)
          VALUES (?, ?, ?, ?, ?, 'sale', ?, ?)
          `,
          [
            newUuid(),
            item.product_id,
            item.batch_id,
            batch.cost_price,
            -remaining,
            id,
            saleDate,
          ]
        );
      }

      // -------------------------
      // 🔹 FIFO SALE
      // -------------------------
      else {
        const batches = await db.getAllAsync(
          `SELECT * FROM inventory_batches
           WHERE product_id = ? AND quantity_remaining > 0
           ORDER BY date ASC`,
          [item.product_id]
        );

        for (const batch of batches) {
          if (remaining <= 0) break;

          const take = Math.min(batch.quantity_remaining, remaining);

          // Deduct batch
          await db.runAsync(
            `UPDATE inventory_batches
             SET quantity_remaining = quantity_remaining - ?
             WHERE id = ?`,
            [take, batch.id]
          );

          // Insert sale item
          await db.runAsync(
            `INSERT INTO sale_items 
            (id, sale_id, product_id, batch_id, quantity, price, cost_price)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              newUuid(),
              id,
              item.product_id,
              batch.id,
              take,
              item.price,
              batch.cost_price,
            ]
          );

          // 🔥 Log movement
          await db.runAsync(
            `
            INSERT INTO inventory_movements
            (id, product_id, batch_id, unit_cost, quantity, type, reference_id, date)
            VALUES (?, ?, ?, ?, ?, 'sale', ?, ?)
            `,
            [
              newUuid(),
              item.product_id,
              batch.id,
              batch.cost_price,
              -take,
              id,
              saleDate,
            ]
          );

          remaining -= take;
        }
      }
      await db.runAsync(
        `UPDATE products 
         SET stock_quantity = stock_quantity - ? 
         WHERE id = ?`,
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
    // 1. Restore stock
    const items = await db.getAllAsync(
      `SELECT product_id, quantity FROM sale_items WHERE sale_id = ?`,
      [sale_id]
    );

    for (const item of items) {
      await db.runAsync(
        `UPDATE products 
         SET stock_quantity = stock_quantity + ? 
         WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // 2. Delete sale items
    await db.runAsync(
      `DELETE FROM sale_items WHERE sale_id = ?`,
      [sale_id]
    );

    // 3. Delete sale itself
    await db.runAsync(
      `DELETE FROM sales WHERE id = ?`,
      [sale_id]
    );

    await db.runAsync("COMMIT");
  } catch (err) {
    await db.runAsync("ROLLBACK");
    throw err;
  }
}