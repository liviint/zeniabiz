import { getActiveContextSync, withTransaction, newUuid } from "./utils";
import { normalizeRange } from "../utils/timeNavigatorHelpers";
import { syncEvent } from "../cloudSync/syncEvent";

export async function restoreFIFO(db, purchaseId, qty) {
  const row = await db.getFirstAsync(
    `SELECT quantity_remaining, quantity FROM inventory_movements WHERE id = ?`,
    [purchaseId]
  );

  const current = row.quantity_remaining ?? row.quantity;

  await db.runAsync(
    `
    UPDATE inventory_movements
    SET quantity_remaining = quantity_remaining + ?
    WHERE id = ?
    `,
    [qty, purchaseId]
  );
}

export async function allocateFIFO(db, productId, requiredQty) {
  console.log(requiredQty,"hello required qty")
  let remaining = requiredQty;
  const allocations = [];

  // 1️⃣ Load ALL movements in order (truth source)
  const movements = await db.getAllAsync(
    `
    SELECT *
    FROM inventory_movements
    WHERE product_id = ?
      AND deleted_at IS NULL
    ORDER BY created_at ASC
    `,
    [productId]
  );

  console.log(movements,"hello movements")

  // 2️⃣ Rebuild FIFO state in-memory
  const fifo = [];

  for (const m of movements) {
    const qty = Number(m.quantity);

    // --------------------
    // PURCHASE → add layer
    // --------------------
    if (m.type === "purchase") {
      fifo.push({
        id: m.id,
        remaining: qty,
        cost: m.unit_cost,
      });
    }

    // --------------------
    // SALE → consume FIFO
    // --------------------
    if (m.type === "sale") {
      let toConsume = Math.abs(qty);

      for (const layer of fifo) {
        if (toConsume <= 0) break;
        if (layer.remaining <= 0) continue;

        const take = Math.min(layer.remaining, toConsume);

        layer.remaining -= take;
        toConsume -= take;
      }

      if (toConsume > 0) {
        throw new Error("Data corruption: negative stock detected");
      }
    }

    // --------------------
    // ADJUSTMENT (optional)
    // --------------------
    if (m.type === "adjustment") {
      fifo.push({
        id: m.id,
        remaining: qty,
        cost: m.unit_cost,
      });
    }
  }

  // 3️⃣ Now allocate from reconstructed FIFO
  for (const layer of fifo) {
    if (remaining <= 0) break;
    if (layer.remaining <= 0) continue;

    const take = Math.min(layer.remaining, remaining);

    allocations.push({
      purchase_id: layer.id,
      quantity: take,
      cost_price: layer.cost,
    });

    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error("Insufficient stock");
  }

  return allocations;
}

  async function insertMovementAndApply(db, movement) {
    await db.runAsync(
      `INSERT INTO inventory_movements
      (id, product_id, company, unit_cost, quantity, type, reference_id, date, created_at, updated_at, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movement.id,
        movement.product_id,
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
}


export async function reverseSale(
  db,
  saleId,
  { company, user_id }
) {
  const now = new Date().toISOString();

  // -------------------------
  // 1️⃣ Load existing sale movements
  // -------------------------
  const saleMovements = await db.getAllAsync(
    `
    SELECT *
    FROM inventory_movements
    WHERE reference_id = ?
      AND type = 'sale'
      AND deleted_at IS NULL
    `,
    [saleId]
  );

  if (!saleMovements.length) return;

  try {
    // -------------------------
    // 2️⃣ Soft delete inventory movements
    // -------------------------
    for (const movement of saleMovements) {
      await db.runAsync(
        `
        UPDATE inventory_movements
        SET
          deleted_at = ?,
          updated_at = ?,
          updated_by = ?
        WHERE id = ?
        `,
        [
          now,
          now,
          user_id,
          movement.id,
        ]
      );

      // 🔥 SYNC inventory movement deletion
      await syncEvent(db, {
        model: "inventory_movements",
        operation: "update",
        payload: {
          ...movement,
          deleted_at: now,
          updated_at: now,
          updated_by: user_id,
        },
      });
    }

    // -------------------------
    // 3️⃣ Load sale items
    // -------------------------
    const saleItems = await db.getAllAsync(
      `
      SELECT *
      FROM sale_items
      WHERE sale_id = ?
        AND deleted_at IS NULL
      `,
      [saleId]
    );

    // -------------------------
    // 4️⃣ Soft delete sale items
    // -------------------------
    for (const item of saleItems) {
      await db.runAsync(
        `
        UPDATE sale_items
        SET
          deleted_at = ?,
          updated_at = ?
        WHERE id = ?
        `,
        [now, now, item.id]
      );

      // 🔥 SYNC sale item deletion
      await syncEvent(db, {
        model: "sale_items",
        operation: "update",
        payload: {
          ...item,
          deleted_at: now,
          updated_at: now,
        },
      });
    }

    await db.runAsync(`
      UPDATE payments
      SET deleted_at = ?, updated_at = ?
      WHERE sale_id = ?
    `,[now, now, saleId]);

  } catch (err) {
    throw err;
  }
}


export async function createOrUpdateSale(
  db,
  {
    sale_id = null,
    items = [],
    note = null,
    date,
    title,
    discount = 0,
    amount_paid = 0,
    subtotal,
    balance_due,
    payment_status,
    total_amount,
    customer_id,
  }
) {
  const { company, user_id } = getActiveContextSync(db);

  const now = new Date().toISOString();
  const saleDate = date ? date.toISOString() : now;

  const isEdit = !!sale_id;
  const id = sale_id || newUuid();



  const totalItems = items.reduce(
    (sum, i) => sum + Number(i.quantity),
    0
  );

  const finalTitle =
    title?.trim() ||
    `Sold ${totalItems} item${totalItems > 1 ? "s" : ""} - ${total_amount}`;

  await db.runAsync("BEGIN");

  try {
    // -------------------------
    // 2. EDIT FLOW
    // -------------------------
    if (isEdit) {
      await reverseSale(db, id, { company, user_id });

      await db.runAsync(
        `
        UPDATE sales
        SET title = ?, note = ?, date = ?, amount = ?,
          discount = ?,
          customer_id = ?,
          total_amount = ?, amount_paid = ?, balance_due = ?,
          payment_status = ?,
          updated_at = ?
        WHERE id = ?
        `,
        [
          finalTitle,
          note ?? null,
          saleDate,
          subtotal,

          discount,
          customer_id,

          total_amount,
          amount_paid,
          balance_due,
          payment_status,

          now,
          id,
        ]
      );
    }

    // -------------------------
    // 3. CREATE FLOW
    // -------------------------
    else {
      await db.runAsync(
        `
        INSERT INTO sales
          (
            id, company, title, note, date,
            amount,
            discount,
            customer_id,
            total_amount,
            amount_paid,
            balance_due,
            is_credit_sale,
            payment_status,
            created_at,
            updated_at
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          company,
          finalTitle,
          note ?? null,
          saleDate,

          subtotal,

          discount,
          customer_id,

          total_amount,
          amount_paid,
          balance_due,
          balance_due > 0 ? 1 : 0,
          payment_status,

          now,
          now,
        ]
      );
    }

    // -------------------------
    // 4. INVENTORY + SALE ITEMS (UNCHANGED)
    // -------------------------
    for (const item of items) {
      const allocations = await allocateFIFO(
        db,
        item.product_id,
        item.quantity
      );

      for (const alloc of allocations) {
        const movement = {
          id: newUuid(),
          product_id: item.product_id,
          company,
          unit_cost: alloc.cost_price,
          quantity: -alloc.quantity,
          type: "sale",
          reference_id: id,
          purchase_reference_id: alloc.purchase_id,
          date: saleDate,
          created_by: user_id,
          updated_by: user_id,
          created_at: now,
          updated_at: now,
        };

        await insertMovementAndApply(db, movement);

        const saleItemId = newUuid();

        await db.runAsync(
          `
          INSERT INTO sale_items
          (id, sale_id, company, product_id, quantity, price, cost_price, purchase_movement_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            saleItemId,
            id,
            company,
            item.product_id,
            alloc.quantity,
            item.price,
            alloc.cost_price,
            alloc.purchase_id,
          ]
        );

        
      }
    }

    // 5. PAYMENT CREATION
    if ((amount_paid || 0) > 0) {
      const paymentId = newUuid();

      await db.runAsync(
        `
        INSERT INTO payments
        (
          id, company, created_by, updated_by,
          sale_id, customer_id, payment_type,
          amount, payment_method, note,
          date, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          paymentId,
          company,
          user_id,
          user_id,
          id,
          customer_id,
          "INITIAL",
          amount_paid,
          "cash",
          "Auto-created from sale",
          saleDate,
          now,
          now,
        ]
      );

      
    }

    await db.runAsync("COMMIT");

    return id;
  } catch (err) {
    await db.runAsync("ROLLBACK");
    throw err;
  }
}

export async function getSales(db, timeState) {
  const { company } = getActiveContextSync();

  let sql = `
    SELECT *
    FROM sales
    WHERE company = ?
      AND deleted_at IS NULL
  `;

  const params = [company];

  if (timeState) {
    const { startDate, endDate } = normalizeRange(timeState);

    sql += `
      AND date >= ?
      AND date < ?
    `;

    params.push(startDate, endDate);
  }

  sql += `
    ORDER BY datetime(date) DESC
  `;

  return await db.getAllAsync(sql, params);
}

export async function getSaleItems(db, sale_id) {
  const { company } = getActiveContextSync();

  return await db.getAllAsync(
    `
    SELECT si.*, p.name
    FROM sale_items si

    JOIN sales s 
      ON s.id = si.sale_id
      AND s.company = ?
      AND s.deleted_at IS NULL

    JOIN products p 
      ON p.id = si.product_id
      AND p.company = ?
      AND p.deleted_at IS NULL

    WHERE si.sale_id = ?
      AND si.company = ?
      AND si.deleted_at IS NULL
    `,
    [company, company, sale_id, company]
  );
}

export async function getSaleById(db, sale_id) {
  return await db.getFirstAsync(
    `SELECT * FROM sales WHERE id = ?`,
    [sale_id]
  );
}

export async function rebuildFIFOForProduct(db, productId) {
  const now = new Date().toISOString();

  // 1️⃣ Load full movement history (SOURCE OF TRUTH)
  const movements = await db.getAllAsync(
    `
    SELECT *
    FROM inventory_movements
    WHERE product_id = ?
      AND deleted_at IS NULL
    ORDER BY date ASC, created_at ASC
    `,
    [productId]
  );

  // 2️⃣ Clear derived state
  await db.runAsync(
    `DELETE FROM inventory_batches WHERE product_id = ?`,
    [productId]
  );

  // FIFO queue (in-memory simulation)
  const fifo = [];

  for (const m of movements) {
    const qty = Number(m.quantity);

    // -------------------------
    // 1. PURCHASE → add to FIFO
    // -------------------------
    if (m.type === "purchase") {
      fifo.push({
        id: newUuid(),
        product_id: m.product_id,
        quantity_remaining: qty,
        cost_price: m.unit_cost,
        selling_price: m.selling_price,
        date: m.date,
        created_by: m.created_by,
        updated_by: m.updated_by,
        company: m.company,
      });
    }

    // -------------------------
    // 2. SALE → consume FIFO
    // -------------------------
    else if (m.type === "sale") {
      let remaining = Math.abs(qty);

      for (const batch of fifo) {
        if (remaining <= 0) break;

        const deduct = Math.min(batch.quantity_remaining, remaining);

        batch.quantity_remaining -= deduct;
        remaining -= deduct;
      }

      if (remaining > 0) {
        throw new Error(
          `FIFO mismatch: insufficient stock for product ${productId}`
        );
      }
    }

    // -------------------------
    // 3. REVERSAL → restore FIFO
    // -------------------------
    else if (m.type === "reversal" || m.type === "adjustment") {
      // treat as stock addition
      fifo.push({
        id: newUuid(),
        product_id: m.product_id,
        quantity_remaining: qty,
        cost_price: m.unit_cost,
        selling_price: m.selling_price,
        date: m.date,
        created_by: m.created_by,
        updated_by: m.updated_by,
        company: m.company,
      });
    }
  }

  // 3️⃣ Persist rebuilt FIFO state
  for (const b of fifo) {
    if (b.quantity_remaining <= 0) continue;

    await db.runAsync(
      `
      INSERT INTO inventory_batches
      (id, product_id, quantity_remaining, cost_price, selling_price, date, created_by, updated_by, company, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        b.id,
        b.product_id,
        b.quantity_remaining,
        b.cost_price,
        b.selling_price,
        b.date,
        b.created_by,
        b.updated_by,
        b.company,
        now,
        now,
      ]
    );
  }
}

export async function deleteSale(db, sale_id) {
  const { company, user_id } = getActiveContextSync(db);
  const now = new Date().toISOString();

  if (!sale_id) {
    throw new Error("sale_id is required");
  }

  return withTransaction(db, async() => {
    try {
    // 1️⃣ get sale movements
    const movements = await db.getAllAsync(
      `
      SELECT *
      FROM inventory_movements
      WHERE reference_id = ?
        AND type = 'sale'
        AND deleted_at IS NULL
      `,
      [sale_id]
    );

    if (!movements.length) {
      throw new Error("No movements found for sale");
    }

    // 2️⃣ get sale_items BEFORE delete (for sync)
    const saleItems = await db.getAllAsync(
      `
      SELECT *
      FROM sale_items
      WHERE sale_id = ?
        AND deleted_at IS NULL
      `,
      [sale_id]
    );

    // 3️⃣ create compensating adjustments
    for (const m of movements) {
      const adjustment = {
        id: newUuid(),
        product_id: m.product_id,
        company,
        unit_cost: m.unit_cost,
        quantity: Math.abs(m.quantity),
        type: "adjustment",
        reference_id: sale_id,
        date: now,
        created_by: user_id,
        updated_by: user_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };

      await insertMovementAndApply(db, adjustment);
    }

    // 4️⃣ soft delete sale
    await db.runAsync(
      `UPDATE sales SET deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, sale_id]
    );

    // 5️⃣ soft delete sale_items
    await db.runAsync(
      `UPDATE sale_items SET deleted_at = ?, updated_at = ? WHERE sale_id = ?`,
      [now, now, sale_id]
    );

    // 6 soft delete payments
    await db.runAsync(`
      UPDATE payments
      SET deleted_at = ?, updated_at = ?
      WHERE sale_id = ?
    `,[now, now, sale_id]);

    // -------------------------
    // 🔥 SYNC SECTION
    // -------------------------

    // 6️⃣ sync sale (as upsert with deleted_at)
    await syncEvent(db, {
      model: "sales",
      operation: "delete",
      payload: {
        id: sale_id,
        company,
        deleted_at: now,
        updated_at: now,
      },
    });

    // 7️⃣ sync each sale_item individually (upsert delete)
    for (const item of saleItems) {
      await syncEvent(db, {
        model: "sale_items",
        operation: "delete",
        payload: {
          id: item.id,
          sale_id: item.sale_id,
          company: item.company,
          product_id: item.product_id,
          deleted_at: now,
          updated_at: now,
        },
      });
    }

  } catch (err) {
    throw err;
  }
  })
}