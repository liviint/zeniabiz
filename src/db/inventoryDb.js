import { syncEvent } from "../cloudSync/syncEvent";
import { getMonthRange , getActiveContextSync, withTransaction, newUuid} from "./utils";

export async function upsertProduct(
  db,
  {
    id,
    name,
    cost_price = 0,
    selling_price = 0,
    stock_quantity = 0,
    minimum_quantity = 5,
    expiry_date = null,
    created_at,
  }
) {
  return withTransaction(db, async () => {
    const { company, user_id } = getActiveContextSync(db);

    const now = new Date().toISOString();

    const isNew = !id;
    id = id || newUuid();
    

    const unitCost = parseFloat(cost_price) || 0;
    const sellPrice = parseFloat(selling_price) || 0;
    const initialStock = parseFloat(stock_quantity) || 0;
    created_at = created_at || now;

      await db.runAsync(
        `
        INSERT INTO products (
          id,
          company,
          created_by,
          updated_by,
          name,
          selling_price,
          cost_price,
          minimum_quantity,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          selling_price = excluded.selling_price,
          cost_price = excluded.cost_price,
          updated_at = excluded.updated_at,
          minimum_quantity = excluded.minimum_quantity,
          updated_by = excluded.updated_by
        `,
        [
          id,
          company,
          user_id,
          user_id,
          name,
          sellPrice,
          unitCost,
          minimum_quantity,
          created_at,
          now,
        ]
      );

      if (isNew && initialStock > 0) {
          await restockProduct(db, id, {
                stock_quantity: initialStock,
                cost_price: unitCost,
                selling_price: sellPrice,
                expiry_date:expiry_date ? expiry_date.toISOString() : null,
              }
            );
      }
      return id;

    })
}

export async function getProducts(
  db,
  {
    selectedMonth = null,
    search = "",
    filter = "all",
    sort = "newest",
  } = {}
) {
  const {company} = getActiveContextSync()
  let sql = `
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.selling_price,
      p.cost_price,
      p.minimum_quantity,
      p.created_at,

      -- STOCK (pure ledger calculation)
      COALESCE(SUM(
        CASE 
          WHEN m.type = 'purchase' THEN m.quantity
          WHEN m.type = 'sale' THEN -ABS(m.quantity)
          WHEN m.type = 'adjustment' THEN m.quantity
          ELSE 0
        END
      ), 0) AS stock_quantity,

      -- STOCK VALUE (cost basis approximation)
      COALESCE(SUM(
        CASE 
          WHEN m.type = 'purchase' THEN m.quantity * m.unit_cost
          WHEN m.type = 'adjustment' THEN m.quantity * m.unit_cost
          ELSE 0
        END
      ), 0) AS stock_value

    FROM products p
    LEFT JOIN inventory_movements m
      ON m.product_id = p.id
      AND m.deleted_at IS NULL
      AND m.company = ?

    WHERE p.deleted_at IS NULL
    AND p.company = ?
  `;

  const params = [company, company];

  // 📅 Month filter (applies to movements, not products)
  if (selectedMonth) {
    const { startDate, endDate } = getMonthRange(selectedMonth);

    sql += `
      AND (
        m.date IS NULL 
        OR (
          datetime(m.date) >= datetime(?)
          AND datetime(m.date) < datetime(?)
        )
      )
    `;

    params.push(startDate, endDate);
  }

  // 🔍 Search
  if (search?.trim()) {
    sql += `
      AND (
        p.name LIKE ? OR 
        p.sku LIKE ?
      )
    `;
    params.push(`%${search}%`, `%${search}%`);
  }

  // 🧱 GROUPING
  sql += ` GROUP BY p.id`;

  if (filter === "low_stock") {
    sql += `
      HAVING stock_quantity > 0
      AND stock_quantity <= minimum_quantity
    `;
  } else if (filter === "out_of_stock") {
    sql += `
      HAVING stock_quantity = 0
    `;
  }

  // 🔃 SORTING
  switch (sort) {
    case "oldest":
      sql += ` ORDER BY datetime(p.created_at) ASC`;
      break;

    case "high_stock":
      sql += ` ORDER BY stock_quantity DESC`;
      break;

    case "low_stock":
      sql += ` ORDER BY stock_quantity ASC`;
      break;

    case "price_high":
      sql += ` ORDER BY p.selling_price DESC`;
      break;

    case "price_low":
      sql += ` ORDER BY p.selling_price ASC`;
      break;

    case "newest":
    default:
      sql += ` ORDER BY datetime(p.created_at) DESC`;
      break;
  }

  return await db.getAllAsync(sql, params);
}

export async function getProductById(db, id) {
  const {company} = getActiveContextSync()
  const product = await db.getFirstAsync(
    `
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.cost_price,
      p.selling_price,
      p.minimum_quantity,
      p.created_at,

      -- STOCK = purchases - sales +/- adjustments
      COALESCE(SUM(
        CASE 
          WHEN m.type = 'purchase' THEN m.quantity
          WHEN m.type = 'sale' THEN -ABS(m.quantity)
          WHEN m.type = 'adjustment' THEN m.quantity
          ELSE 0
        END
      ), 0) AS stock_quantity,

      -- STOCK VALUE (cost basis from movements only)
      COALESCE(SUM(
        CASE 
          WHEN m.type = 'purchase' THEN m.quantity * m.unit_cost
          WHEN m.type = 'adjustment' THEN m.quantity * m.unit_cost
          ELSE 0
        END
      ), 0) AS stock_value

    FROM products p
    LEFT JOIN inventory_movements m
      ON m.product_id = p.id
      AND m.deleted_at IS NULL
      AND m.company = ?

    WHERE p.id = ?
      AND p.deleted_at IS NULL
      AND p.company = ?

    GROUP BY p.id
    LIMIT 1
    `,
    [company,id,company]
  );

  return product;
}

export async function getProductBatches(db, productId) {
  return await db.getAllAsync(
    `
    SELECT *
    FROM inventory_batches
    WHERE product_id = ?
      AND deleted_at IS NULL
      AND quantity_on_hand > 0
    ORDER BY purchase_date ASC, created_at ASC
    `,
    [productId]
  );
}

export async function deleteProduct(db, id) {
  const { company, user_id } = getActiveContextSync(db);
  const now = new Date().toISOString();

  if (!id) {
    throw new Error("Product id is required");
  }

  try {
    // 🗑 Soft delete product
    await db.runAsync(
      `
      UPDATE products
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      `,
      [now, now, id]
    );


    // 🔥 SYNC EVENT (AFTER COMMIT)
    syncEvent(db, {
      model: "products",
      operation: "delete",
      payload: {
        id,
        company,
        deleted_at: now,
        updated_at:now
      }
    })
    .catch(err => {
  console.error("Sync failed:", err);
});

  } catch (error) {
    throw error;
  }
}

export async function upsertBatch(db, batch) {
  await db.runAsync(
    `
    INSERT INTO inventory_batches (
      id,
      company,
      created_by,
      updated_by,
      product_id,
      quantity_on_hand,
      cost_price,
      selling_price,
      batch_number,
      expiry_date,
      purchase_date,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      quantity_on_hand = excluded.quantity_on_hand,
      cost_price = excluded.cost_price,
      selling_price = excluded.selling_price,
      batch_number = excluded.batch_number,
      expiry_date = excluded.expiry_date,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
    `,
    [
      batch.id,
      batch.company,
      batch.created_by,
      batch.updated_by,
      batch.product_id,
      batch.quantity_on_hand,
      batch.cost_price,
      batch.selling_price,
      batch.batch_number,
      batch.expiry_date,
      batch.purchase_date,
      batch.created_at,
      batch.updated_at,
    ]
  );
}

export const restockProduct = async (db, productId, form) => {
  try {
    const { company, user_id } = getActiveContextSync(db);

  const {
    stock_quantity,
    cost_price,
    selling_price,
    expiry_date = null,
    batch_number = null,
  } = form;

  const now = new Date().toISOString();

  const quantity = Number(stock_quantity);
  const unitCost = Number(cost_price);
  const sellPrice = Number(selling_price);

  if (!quantity || quantity <= 0) {
    throw new Error("Stock quantity must be greater than 0");
  }

  if (isNaN(unitCost) || isNaN(sellPrice)) {
    throw new Error("Invalid pricing values");
  }

  const batchId = newUuid();
  const movementId = newUuid();

  await upsertBatch(db, {
    id: batchId,
    company,
    created_by: user_id,
    updated_by: user_id,

    product_id: productId,
    quantity_on_hand: quantity,

    cost_price: unitCost,
    selling_price: sellPrice,

    batch_number,
    expiry_date,
    purchase_date: now,

    created_at: now,
    updated_at: now,
  });

  // Movement
  await db.runAsync(
    `
    INSERT INTO inventory_movements (
      id,
      company,
      created_by,
      updated_by,
      product_id,
      batch_id,
      quantity,
      unit_cost,
      selling_price,
      type,
      date,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      movementId,
      company,
      user_id,
      user_id,
      productId,
      batchId,
      quantity,
      unitCost,
      sellPrice,
      "purchase",
      now,
      now,
      now,
    ]
  );


  return batchId;
  } catch (error) {
    console.log(error,"hello restock err")
  }
};

export function buildFIFO(movements) {
  const batches = [];

  for (const m of movements) {
    const qty = Number(m.quantity);

    // -----------------------
    // 1️⃣ PURCHASE → creates stock
    // -----------------------
    if (m.type === "purchase") {
      if (qty <= 0) continue;
      batches.push({
        source_id: m.id,
        product_id: m.product_id,
        quantity_remaining: qty,
        cost_price: Number(m.unit_cost || 0),
        selling_price: Number(m.selling_price || 0),
        date: m.date,
      });
    }

    // -----------------------
    // 2️⃣ SALE → consumes stock FIFO
    // -----------------------
    else if (m.type === "sale") {
      let remainingToDeduct = Math.abs(qty);

      for (const batch of batches) {
        if (remainingToDeduct <= 0) break;
        if (batch.quantity_remaining <= 0) continue;

        const take = Math.min(batch.quantity_remaining, remainingToDeduct);

        batch.quantity_remaining -= take;
        remainingToDeduct -= take;
      }

      // If you want strict validation, uncomment:
      // if (remainingToDeduct > 0) {
      //   throw new Error("Insufficient stock during FIFO build");
      // }
    }

    // -----------------------
    // 3️⃣ ADJUSTMENT → can add or remove stock
    // -----------------------
    else if (m.type === "adjustment") {
      if (qty > 0) {
        // stock increase
        batches.push({
          source_id: m.id,
          product_id: m.product_id,
          quantity_remaining: qty,
          cost_price: Number(m.unit_cost || 0),
          selling_price: Number(m.selling_price || 0),
          date: m.date,
        });
      } else {
        // stock decrease
        let remainingToDeduct = Math.abs(qty);

        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;
          if (batch.quantity_remaining <= 0) continue;

          const take = Math.min(batch.quantity_remaining, remainingToDeduct);

          batch.quantity_remaining -= take;
          remainingToDeduct -= take;
        }
      }
    }
  }

  // -----------------------
  // 4️⃣ return only active stock
  // -----------------------
  return batches.filter(b => b.quantity_remaining > 0);
}

export async function getTotalStockValue(db) {
  const {company} = getActiveContextSync()

  const movements = await db.getAllAsync(
    `
    SELECT m.*
    FROM inventory_movements m
    INNER JOIN products p
      ON p.id = m.product_id
    WHERE m.deleted_at IS NULL
      AND m.company = ?
      AND p.deleted_at IS NULL
      AND p.company = ?
    ORDER BY m.product_id, m.created_at ASC
    `,[company,company]
  );

  const grouped = {};

  for (const m of movements) {
    if (!grouped[m.product_id]) grouped[m.product_id] = [];
    grouped[m.product_id].push(m);
  }

  let total = 0;

  for (const productId in grouped) {
    const batches = buildFIFO(grouped[productId]);

    for (const b of batches) {
      total += b.quantity_remaining * b.cost_price;
    }
  }

  return { stock_value: total };
}