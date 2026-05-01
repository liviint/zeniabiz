import uuid from "react-native-uuid";
import { getMonthRange, getActiveContextSync } from "./utils";
import { syncEvent } from "../cloudSync/syncEvent";

const newUuid = () => uuid.v4();

async function resolveBatchesFIFO(db, productId, quantityNeeded) {
  const batches = await db.getAllAsync(
    `SELECT * FROM inventory_batches
     WHERE product_id = ? AND quantity_remaining > 0
     ORDER BY date ASC`,
    [productId]
  );

  const allocations = [];
  let remaining = quantityNeeded;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const take = Math.min(batch.quantity_remaining, remaining);

    allocations.push({
      batch: batch.id,
      cost_price: batch.cost_price,
      quantity: take,
    });

    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error("Not enough stock across batches");
  }

  return allocations;
}

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
  const { company, user_id } = getActiveContextSync();

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
        `SELECT batch, quantity FROM sale_items WHERE sale_id = ?`,
        [id]
      );

      for (const item of oldItems) {
        await db.runAsync(
          `UPDATE inventory_batches
           SET quantity_remaining = quantity_remaining + ?
           WHERE id = ?`,
          [item.quantity, item.batch]
        );
      }

      await db.runAsync(`DELETE FROM sale_items WHERE sale_id = ?`, [id]);
      await db.runAsync(
        `DELETE FROM inventory_movements WHERE reference_id = ?`,
        [id]
      );

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
      // 🟢 CREATE FLOW
      // -------------------------
      await db.runAsync(
        `
        INSERT INTO sales (id,company, title, note, date, amount, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [id,company, finalTitle, note ?? null, saleDate, total, now, now]
      );
    }

    // -------------------------
    // 🔵 VALIDATION + STOCK CHECK
    // -------------------------
    for (const item of items) {
      let allocations = [];

 
    if (item.batch) {
      const batch = await db.getFirstAsync(
        `SELECT * FROM inventory_batches WHERE id = ?`,
        [item.batch]
      );

      if (!batch || batch.quantity_remaining < item.quantity) {
        throw new Error(`Not enough stock in selected batch`);
      }

      allocations = [
        {
          batch: batch.id,
          cost_price: batch.cost_price,
          quantity: item.quantity,
        },
      ];
    }

    else {
      allocations = await resolveBatchesFIFO(
        db,
        item.product_id,
        item.quantity
      );
    }

  // -------------------------
  // 🔴 APPLY ALLOCATIONS
  // -------------------------
  for (const alloc of allocations) {
    const batch = await db.getFirstAsync(
      `SELECT cost_price FROM inventory_batches WHERE id = ?`,
      [alloc.batch]
    );

    await db.runAsync(
      `UPDATE inventory_batches
       SET quantity_remaining = quantity_remaining - ?
       WHERE id = ?`,
      [alloc.quantity, alloc.batch]
    );

    await db.runAsync(
      `INSERT INTO sale_items 
      (id, sale_id, company, product_id, batch, quantity, price, cost_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newUuid(),
        id,
        company,
        item.product_id,
        alloc.batch,
        alloc.quantity,
        item.price,
        batch.cost_price,
      ]
    );

    await db.runAsync(
      `INSERT INTO inventory_movements
      (id, product_id, batch, company, unit_cost, quantity, type, reference_id, date)
      VALUES (?, ?, ?, ?, ?, ?, 'sale', ?, ?)`,
      [
        newUuid(),
        item.product_id,
        alloc.batch,
        company,
        batch.cost_price,
        -alloc.quantity,
        id,
        saleDate,
      ]
    );
  }
}

    // -------------------------
    // 🔴 APPLY SALE LOGIC
    // -------------------------
    for (const item of items) {
      let remaining = Number(item.quantity);

      if (item.batch) {
        const batch = await db.getFirstAsync(
          `SELECT cost_price FROM inventory_batches WHERE id = ?`,
          [item.batch]
        );

        await db.runAsync(
          `UPDATE inventory_batches
           SET quantity_remaining = quantity_remaining - ?
           WHERE id = ?`,
          [remaining, item.batch]
        );

        await db.runAsync(
          `INSERT INTO sale_items 
          (id, sale_id,company, product_id, batch, quantity, price, cost_price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newUuid(),
            id,
            company,
            item.product_id,
            item.batch,
            remaining,
            item.price,
            batch.cost_price,
          ]
        );

        await db.runAsync(
          `
          INSERT INTO inventory_movements
          (id, product_id, batch,company, unit_cost, quantity, type, reference_id, date)
          VALUES (?, ?, ?, ?, ?, ?, 'sale', ?, ?)
          `,
          [
            newUuid(),
            item.product_id,
            item.batch,
            company,
            batch.cost_price,
            -remaining,
            id,
            saleDate,
          ]
        );
      } else {
        const batches = await db.getAllAsync(
          `SELECT * FROM inventory_batches
           WHERE product_id = ? AND quantity_remaining > 0
           ORDER BY date ASC`,
          [item.product_id]
        );

        for (const batch of batches) {
          if (remaining <= 0) break;

          const take = Math.min(batch.quantity_remaining, remaining);

          await db.runAsync(
            `UPDATE inventory_batches
             SET quantity_remaining = quantity_remaining - ?
             WHERE id = ?`,
            [take, batch.id]
          );

          await db.runAsync(
            `INSERT INTO sale_items 
            (id, sale_id,company, product_id, batch, quantity, price, cost_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newUuid(),
              id,
              company,
              item.product_id,
              batch.id,
              take,
              item.price,
              batch.cost_price,
            ]
          );

          await db.runAsync(
            `
            INSERT INTO inventory_movements
            (id, product_id,company, batch, unit_cost, quantity, type, reference_id, date)
            VALUES (?, ?, ?, ?, ?, ?, 'sale', ?, ?)
            `,
            [
              newUuid(),
              item.product_id,
              company,
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

      
    }

    await db.runAsync("COMMIT");

    // -------------------------
    // 🔥 SYNC (FULL CONSISTENCY)
    // -------------------------

    // 1. Sale header
    await syncEvent(db, {
      model: "sales",
      operation: "upsert",
      payload: {
        id,
        company,
        created_by: user_id,
        updated_by: user_id,

        title: finalTitle,
        note,
        date: saleDate,
        amount: total,

        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    });

    // 2. Sale items
    for (const item of items) {
      await syncEvent(db, {
        model: "sale_items",
        operation: "upsert",
        payload: {
          id:item.id || newUuid(),
          sale: id,
          product_id: item.product_id,
          batch: item.batch || null,
          quantity: item.quantity,
          price: item.price,
          cost_price: item.cost_price || 0,

          company,
          created_by: user_id,
          updated_by: user_id,

          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      });
    }

    // 3. Inventory movements
    for (const item of items) {
      await syncEvent(db, {
        model: "inventory_movements",
        operation: "insert",
        payload: {
          id: newUuid(),
          product_id: item.product_id,
          batch: item.batch || null,
          unit_cost: item.cost_price || 0,
          quantity: -Number(item.quantity),
          type: "sale",
          reference_id: id,
          date: saleDate,

          company,
          created_by: user_id,
          updated_by: user_id,

          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      });
    }

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
  const now = new Date().toISOString();

  if (!sale_id) {
    throw new Error("sale_id is required");
  }

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ Soft delete sale (NOT hard delete)
    await db.runAsync(
      `
      UPDATE sales
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      `,
      [now, now, sale_id]
    );

    // 2️⃣ Soft delete sale items
    await db.runAsync(
      `
      UPDATE sale_items
      SET deleted_at = ?
      WHERE sale_id = ?
      `,
      [now, sale_id]
    );

    await db.runAsync("COMMIT");

    // 🔥 3️⃣ SYNC EVENT (single source of truth)
    await syncEvent(db, {
      model: "sales",
      operation: "delete",
      payload: {
        id: sale_id,
        deleted_at: now
      }
    });

  } catch (err) {
    await db.runAsync("ROLLBACK");
    throw err;
  }
}