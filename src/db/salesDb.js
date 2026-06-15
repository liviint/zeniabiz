import { getActiveContextSync, withTransaction, newUuid } from "./utils";
import { normalizeRange } from "../utils/timeNavigatorHelpers";
import { enqueueSync } from "../cloudSync/syncEvent";

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

export async function allocateFIFO(
  db,
  productId,
  requiredQty
) {
  let remaining = Number(requiredQty);

  const batches = await db.getAllAsync(
    `
    SELECT
      id,
      quantity_on_hand,
      cost_price,
      purchase_date
    FROM inventory_batches
    WHERE product_id = ?
      AND deleted_at IS NULL
      AND quantity_on_hand > 0
    ORDER BY purchase_date ASC, created_at ASC
    `,
    [productId]
  );

  const allocations = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const available = Number(batch.quantity_on_hand);

    const take = Math.min(
      available,
      remaining
    );

    allocations.push({
      batch_id: batch.id,
      quantity: take,
      cost_price: batch.cost_price,
    });

    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error("Insufficient stock");
  }

  return allocations;
}

async function insertMovement(db, movement) {
  await db.runAsync(
    `INSERT INTO inventory_movements
    (id, product_id, batch_id, company, unit_cost, quantity, type, reason, reference_id, date, created_at, updated_at, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movement.id,
      movement.product_id,
      movement.batch_id,
      movement.company,
      movement.unit_cost,
      movement.quantity,
      movement.type,
      movement.reason,
      movement.reference_id,
      movement.date,
      movement.created_at,
      movement.updated_at,
      movement.created_by,
      movement.updated_by,
    ]
  );

  await enqueueSync(db,{
    model:"inventory_movements",
    record_id:movement.id,
    operation:"upsert",
  })

}


export async function reverseSale(
  db,
  saleId,
  { company, user_id }
) {
  const now = new Date().toISOString();

    const saleItems = await getSaleItemsFromSale(db, saleId)

    await restoreSaleInventory(db, saleItems, now)

    await createSaleReversalMovements(
      db,
      saleItems,
      saleId,
      company,
      user_id,
      now
    )

    await deleteSaleItems(db, saleId, saleItems, now);

    await deleteSalePayments(db, saleId, now)

}

async function getSaleItemsFromSale(db, saleId) {
  return await db.getAllAsync(
    `
    SELECT *
    FROM sale_items
    WHERE sale_id = ?
      AND deleted_at IS NULL
    `,
    [saleId]
  );
}

async function restoreSaleInventory(
  db,
  saleItems,
  now
) {
  for (const item of saleItems) {
      if (!item.batch_id) continue;
      await db.runAsync(
        `
        UPDATE inventory_batches
        SET quantity_on_hand = quantity_on_hand + ?,
            updated_at = ?
        WHERE id = ?
        `,
        [
          item.quantity,
          now,
          item.batch_id,
        ]
      );

      await enqueueSync(db,{
        model:"inventory_batches",
        record_id:item.batch_id,
        operation:"upsert",
      })

    }
}

async function createSaleReversalMovements(
  db,
  saleItems,
  saleId,
  company,
  user_id,
  now
) {
  for (const item of saleItems) {
    if (!item.batch_id) continue;

    await insertMovement(db, {
      id: newUuid(),
      product_id: item.product_id,
      batch_id: item.batch_id,
      company,
      unit_cost: item.cost_price,
      quantity: item.quantity,
      type: "adjustment",
      reason: "sale_reversal",
      reference_id: saleId,
      date: now,
      created_by: user_id,
      updated_by: user_id,
      created_at: now,
      updated_at: now,
    });
  }
}

async function deleteSaleItems(
  db,
  saleId,
  saleItems,
  now
) {
  await db.runAsync(
    `
    UPDATE sale_items
    SET deleted_at = ?,
        updated_at = ?
    WHERE sale_id = ?
      AND deleted_at IS NULL
    `,
    [now, now, saleId]
  );

  for (const item of saleItems) {
    await enqueueSync(db, {
      model: "sale_items",
      record_id: item.id,
      operation: "delete",
    });
  }

}

async function deleteSalePayments(
  db,
  saleId,
  now
) {
  const payments = await db.getAllAsync(
    `
    SELECT id
    FROM payments
    WHERE sale_id = ?
      AND deleted_at IS NULL
    `,
    [saleId]
  );

  await db.runAsync(
    `
    UPDATE payments
    SET deleted_at = ?,
        updated_at = ?
    WHERE sale_id = ?
    `,
    [now, now, saleId]
  );

  for (const payment of payments) {
    await enqueueSync(db, {
      model: "payments",
      record_id: payment.id,
      operation: "delete",
    });
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
    markedPrice,
    balance_due,
    payment_status,
    total_amount,
    customer_id,
  }
) {
  return withTransaction(db,async() => {
    const { company, user_id } = getActiveContextSync(db);

    const now = new Date().toISOString();
    const saleDate = date ? date.toISOString() : now;

    const isEdit = !!sale_id;
    const id = sale_id || newUuid();

    await upsertSaleHeader(db,{
      id,
      company,
      user_id,
      isEdit,
      title,
      note,
      saleDate,
      markedPrice,
      discount,
      customer_id,
      total_amount,
      amount_paid,
      balance_due,
      payment_status,
      now,
    })

    await handleSaleItems(db,
      {
        saleId:id,
        company,
        items,
        saleDate,
        user_id,
        now
      }
    )

    await createInitialPayment(db, {
      saleId: id,
      company,
      user_id,
      customer_id: customer_id,
      amount_paid: amount_paid,
      saleDate,
      now,
    });

    return id;
  })
}

export async function upsertSaleHeader(db, {
  id,
  company,
  user_id,
  isEdit,
  title,
  note,
  saleDate,
  markedPrice,
  discount,
  customer_id,
  total_amount,
  amount_paid,
  balance_due,
  payment_status,
  now,
}) {
  const finalTitle =
    title?.trim() ||
    `Sale - ${total_amount}`;

  if (isEdit) {
      await reverseSale(db, id, { company, user_id });

      await db.runAsync(
        `
        UPDATE sales
        SET title = ?, note = ?, date = ?, amount = ?,
          discount = ?,
          customer_id = ?,
          total_amount = ?, 
          amount_paid = ?, 
          balance_due = ?,
          is_credit_sale = ?,
          payment_status = ?,
          updated_at = ?
          WHERE id = ?
        `,
        [
          finalTitle,
          note ?? null,
          saleDate,
          markedPrice,

          discount,
          customer_id,

          total_amount,
          amount_paid,
          balance_due,
          balance_due > 0 ? 1 : 0,
          payment_status,

          now,
          id,
        ]
      );
    }

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

        markedPrice,

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

  await enqueueSync(db, {
    model: "sales",
    record_id: id,
    operation: "upsert",
  });

}

export async function handleSaleItems(db, {
  saleId,
  company,
  items,
  saleDate,
  user_id,
  now
},
) {
  for (const item of items) {
    if (item.item_type === "service") {
      await createServiceSaleItem(db, {
        saleId,
        company,
        item,
        saleDate,
        user_id,
        now,
      });
    } else {
      await handleProductSaleItem(db, {
        saleId,
        company,
        item,
        saleDate,
        user_id,
        now,
      });
    }
  }
}

const createServiceSaleItem = async(db,{saleId,company,item}) => {
    const saleItemId = newUuid();

    await db.runAsync(
      `
      INSERT INTO sale_items
      (id, sale_id, company, product_id, quantity, price, cost_price, batch_id, item_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        saleItemId,
        saleId,
        company,
        item.product_id,
        item.quantity,
        item.price,
        0,
        null,
        item.item_type
      ]
    );

    await enqueueSync(db, {
    model: "sale_items",
    record_id: saleItemId,
    operation: "upsert",
  });
}

const handleProductSaleItem = async(db,{
  saleId,
  company,
  item,
  user_id,
  saleDate,
  now,
}) => {
  const allocations = await allocateFIFO(
    db,
    item.product_id,
    item.quantity
  );

  for (const alloc of allocations) {
    const saleItemId = newUuid();

    await db.runAsync(
      `
      INSERT INTO sale_items
      (id, sale_id, company, product_id, quantity, price, cost_price, batch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        saleItemId,
        saleId,
        company,
        item.product_id,
        alloc.quantity,
        item.price,
        alloc.cost_price,
        alloc.batch_id,
      ]
    );

    await enqueueSync(db, {
      model: "sale_items",
      record_id: saleItemId,
      operation: "upsert",
    });

    const result = await db.runAsync(
      `
      UPDATE inventory_batches
      SET quantity_on_hand = quantity_on_hand - ?,
          updated_at = ?
      WHERE id = ?
        AND quantity_on_hand >= ?
      `,
      [
        alloc.quantity,
        now,
        alloc.batch_id,
        alloc.quantity,
      ]
    );

    if (result.changes === 0) {
      throw new Error("Insufficient batch stock");
    }
    
    await enqueueSync(db, {
      model: "inventory_batches",
      record_id: alloc.batch_id,
      operation: "upsert",
    });

    await insertMovement(db, {
      id: newUuid(),
      product_id: item.product_id,
      batch_id: alloc.batch_id,
      company,
      unit_cost: alloc.cost_price,
      quantity: -alloc.quantity,
      type: "sale",
      reference_id: saleId,
      date: saleDate,
      created_by: user_id,
      updated_by: user_id,
      created_at: now,
      updated_at: now,
    });
    
  }
}

const createInitialPayment = async(db,{
  saleId,
  company,
  user_id,
  customer_id,
  amount_paid,
  saleDate,
  now
}) => {
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
        saleId,
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

    await enqueueSync(db, {
      model: "payments",
      record_id: paymentId,
      operation: "upsert",
    });

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

  return withTransaction(db, async () => {

    await reverseSale(
      db,
      sale_id,
      { company, user_id }
    );

    await db.runAsync(
      `
      UPDATE sales
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      `,
      [now, now, sale_id]
    );

    await enqueueSync(db, {
      model: "sales",
      record_id: sale_id,
      operation: "delete",
    });
  });
}

