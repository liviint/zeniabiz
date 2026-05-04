import uuid from "react-native-uuid";
import { getMonthRange, getActiveContextSync } from "./utils";
import { syncEvent } from "../cloudSync/syncEvent";
import { applyMovementToBatches } from "./inventoryDb";

const newUuid = () => uuid.v4();

async function allocateStock(db, productId, quantityNeeded, batchId = null) {
  if (batchId) {
    const batch = await db.getFirstAsync(
      `SELECT * FROM inventory_batches WHERE id = ?`,
      [batchId]
    );

    if (!batch || batch.quantity_remaining < quantityNeeded) {
      throw new Error("Not enough stock in selected batch");
    }

    return [
      {
        batch: batch.id,
        cost_price: batch.cost_price,
        quantity: quantityNeeded,
      },
    ];
  }

  const batches = await db.getAllAsync(
    `SELECT * FROM inventory_batches
     WHERE product_id = ? AND quantity_remaining > 0
     ORDER BY date ASC, created_at ASC`,
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

  async function insertMovementAndApply(db, movement) {
  await db.runAsync(
    `INSERT INTO inventory_movements
    (id, product_id, batch, company, unit_cost, quantity, type, reference_id, date, created_at, updated_at, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movement.id,
      movement.product_id,
      movement.batch,
      movement.company,
      movement.unit_cost,
      movement.quantity,
      movement.type,
      movement.reference_id,
      movement.date,
      movement.created_at,
      movement.updated_at,
      movement.created_by,
      movement.updated_by,
    ]
  );

  await applyMovementToBatches(db, movement);
}

async function reverseSaleMovements(db, saleId, context) {
  const { company, user_id } = context;
  const now = new Date().toISOString();

  const oldMovements = await db.getAllAsync(
    `SELECT * FROM inventory_movements WHERE reference_id = ?`,
    [saleId]
  );

  const reversals = [];

  for (const m of oldMovements) {
    const reversal = {
      id: newUuid(),
      product_id: m.product_id,
      batch: m.batch,
      company,
      unit_cost: m.unit_cost,
      quantity: Math.abs(m.quantity),
      type: "adjustment",
      reference_id: saleId,
      date: now,
      created_by: user_id,
      updated_by: user_id,
      created_at: now,
      updated_at: now,
    };

    await insertMovementAndApply(db, reversal);
    reversals.push(reversal);
  }

  await db.runAsync(`DELETE FROM sale_items WHERE sale_id = ?`, [saleId]);

  return reversals;
}


export async function createOrUpdateSale(
  db,
  { sale_id = null, items = [], note = null, date, title }
) {
  const { company, user_id } = getActiveContextSync(db);

  const now = new Date().toISOString();
  const saleDate = date ? date.toISOString() : now;

  const isEdit = !!sale_id;
  const id = sale_id || newUuid();

  const total = items.reduce(
    (sum, i) => sum + Number(i.price) * Number(i.quantity),
    0
  );

  const totalItems = items.reduce(
    (sum, i) => sum + Number(i.quantity),
    0
  );

  const finalTitle =
    title?.trim() || `Sold ${totalItems} item${totalItems > 1 ? "s" : ""} - ${total}`;

  const finalMovements = [];
  const finalSaleItems = [];

  await db.runAsync("BEGIN");

  try {
    // -------------------------
    // EDIT → reverse first
    // -------------------------
    if (isEdit) {
      await reverseSaleMovements(db, id, { company, user_id });

      await db.runAsync(
        `UPDATE sales
         SET title=?, note=?, date=?, amount=?, updated_at=?
         WHERE id=?`,
        [finalTitle, note ?? null, saleDate, total, now, id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO sales (id, company, title, note, date, amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, company, finalTitle, note ?? null, saleDate, total, now, now]
      );
    }

    // -------------------------
    // PROCESS ITEMS
    // -------------------------
    for (const item of items) {
      const allocations = await allocateStock(
        db,
        item.product_id,
        item.quantity,
        item.batch
      );

      for (const alloc of allocations) {
        const movement = {
          id: newUuid(),
          product_id: item.product_id,
          batch: alloc.batch,
          company,
          unit_cost: alloc.cost_price,
          quantity: -alloc.quantity,
          type: "sale",
          reference_id: id,
          date: saleDate,
          created_by: user_id,
          updated_by: user_id,
          created_at: now,
          updated_at: now,
        };

        await insertMovementAndApply(db, movement);

        const saleItemId = newUuid();

        await db.runAsync(
          `INSERT INTO sale_items
          (id, sale_id, company, product_id, batch, quantity, price, cost_price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            saleItemId,
            id,
            company,
            item.product_id,
            alloc.batch,
            alloc.quantity,
            item.price,
            alloc.cost_price,
          ]
        );

        finalMovements.push(movement);
        finalSaleItems.push({
          id: saleItemId,
          sale_id: id,
          product_id: item.product_id,
          batch: alloc.batch,
          quantity: alloc.quantity,
          price: item.price,
          cost_price: alloc.cost_price,
        });
      }
    }

    await db.runAsync("COMMIT");

    // -------------------------
    // SYNC
    // -------------------------
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

    for (const item of finalSaleItems) {
      await syncEvent(db, {
        model: "sale_items",
        operation: "upsert",
        payload: {
          ...item,
          company,
          created_by: user_id,
          updated_by: user_id,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      });
    }

    for (const movement of finalMovements) {
      await syncEvent(db, {
        model: "inventory_movements",
        operation: "insert",
        payload: {
          ...movement,
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

  } catch (err) {
    await db.runAsync("ROLLBACK");
    throw err;
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