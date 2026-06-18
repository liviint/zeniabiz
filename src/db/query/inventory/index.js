import { enqueueSync } from "../../../cloudSync/syncEvent";
import { getActiveContextSync, newUuid, withTransaction } from "../../utils";

export async function upsertProductAndRestocking(
  db,
  {
    id,
    name,
    cost_price = 0,
    selling_price = 0,
    stock_quantity = 0,
    minimum_quantity = 5,
    batch_number,
    expiry_date = null,
    item_type = "product",
    unit,
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

      await upsertProduct(db,{
        id:id,
        company:company,
        created_by:user_id,
        updated_by:user_id,
        name:name,
        selling_price:sellPrice,
        cost_price:unitCost,
        minimum_quantity:minimum_quantity,
        item_type:item_type,
        unit:unit,
        created_at:created_at,
        updated_at:now
      })

      if (
            isNew &&
            item_type === "product" &&
            initialStock > 0
          ) {
          await restockProduct(db, id, {
                stock_quantity: initialStock,
                cost_price: unitCost,
                selling_price: sellPrice,
                batch_number,
                expiry_date:expiry_date ? expiry_date.toISOString() : null,
              }
            );
      }
      return id;
    })
}

export async function upsertProduct(db,product) {
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
          item_type,
          unit,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          selling_price = excluded.selling_price,
          cost_price = excluded.cost_price,
          updated_at = excluded.updated_at,
          minimum_quantity = excluded.minimum_quantity,
          item_type = excluded.item_type,
          unit = excluded.unit,
          updated_by = excluded.updated_by
        `,
        [
          product.id,
          product.company,
          product.created_by,
          product.updated_by,
          product.name,
          product.selling_price,
          product.cost_price,
          product.minimum_quantity,
          product.item_type,
          product.unit,
          product.created_at,
          product.updated_at,
        ]
      );

      await enqueueSync(db,{
        model:"products",
        record_id:product.id,
        operation:"upsert",
      })
      return product.id;
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
  await enqueueSync(db,{
    model:"inventory_batches",
    record_id:batch.id,
    operation:"upsert",
  })
}

export async function upsertInventoryMovements(db, movement) {
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
      movement.id,
      movement.company,
      movement.created_by,
      movement.updated_by,
      movement.product_id,
      movement.batch_id,
      movement.quantity,
      movement.unit_cost,
      movement.selling_price,
      movement.type,
      movement.date,
      movement.created_at,
      movement.updated_at,
    ]
  );
  await enqueueSync(db,{
    model:"inventory_movements",
    record_id:movement.id,
    operation:"create",
  })
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

  await upsertInventoryMovements(db, {
    id:movementId,
    company:company,

    created_by:user_id,
    updated_by:user_id,

    product_id:productId,
    batch_id:batchId,
    quantity:quantity,
    unit_cost:unitCost,
    selling_price:sellPrice,
    type:"purchase",
    date:now,
    created_at: now,
    updated_at: now,
  });


  return batchId;
  } catch (error) {
    console.log(error,"hello restock err")
  }
};

export async function getProducts(
  db,
  {
    selectedMonth = null,
    search = "",
    filter = "all",
    sort = "newest",
  } = {}
) {
  const { company } = getActiveContextSync(db);

  let sql = `
    SELECT
      p.id,
      p.name,
      p.sku,
      p.selling_price,
      p.cost_price,
      p.minimum_quantity,
      p.item_type,
      p.unit,
      p.created_at,

      COALESCE(
        SUM(b.quantity_on_hand),
        0
      ) AS stock_quantity,

      COALESCE(
        SUM(
          b.quantity_on_hand * b.cost_price
        ),
        0
      ) AS stock_value

    FROM products p

    LEFT JOIN inventory_batches b
      ON b.product_id = p.id
      AND b.deleted_at IS NULL
      AND b.company = ?

    WHERE p.deleted_at IS NULL
      AND p.company = ?
  `;

  const params = [company, company];

  // Search
  if (search?.trim()) {
    sql += `
      AND (
        p.name LIKE ?
        OR p.sku LIKE ?
      )
    `;

    params.push(
      `%${search.trim()}%`,
      `%${search.trim()}%`
    );
  }

  if (filter === "products") {
    sql += ` AND p.item_type = 'product' `;
  }

  if (filter === "services") {
    sql += ` AND p.item_type = 'service' `;
  }

  // Grouping
  sql += `
    GROUP BY p.id
  `;

  // Filters
  switch (filter) {
    case "low_stock":
      sql += `
        HAVING stock_quantity > 0
        AND stock_quantity <= minimum_quantity
      `;
      break;

    case "out_of_stock":
      sql += `
        HAVING stock_quantity <= 0
      `;
      break;

    case "expiring_soon":
      sql += `
        HAVING EXISTS (
          SELECT 1
          FROM inventory_batches b2
          WHERE b2.product_id = p.id
            AND b2.company = ?
            AND b2.deleted_at IS NULL
            AND b2.quantity_on_hand > 0
            AND b2.expiry_date IS NOT NULL
            AND date(b2.expiry_date) >= date('now')
            AND date(b2.expiry_date) <= date('now', '+30 days')
        )
      `;
      params.push(company);
      break;

    case "expired":
      sql += `
        HAVING EXISTS (
          SELECT 1
          FROM inventory_batches b2
          WHERE b2.product_id = p.id
            AND b2.company = ?
            AND b2.deleted_at IS NULL
            AND b2.quantity_on_hand > 0
            AND b2.expiry_date IS NOT NULL
            AND date(b2.expiry_date) < date('now')
        )
      `;
      params.push(company);
      break;

    default:
      break;
  }

  // Sorting
  switch (sort) {
    case "oldest":
      sql += `
        ORDER BY datetime(p.created_at) ASC
      `;
      break;

    case "high_stock":
      sql += `
        ORDER BY stock_quantity DESC
      `;
      break;

    case "low_stock":
      sql += `
        ORDER BY stock_quantity ASC
      `;
      break;

    case "price_high":
      sql += `
        ORDER BY p.selling_price DESC
      `;
      break;

    case "price_low":
      sql += `
        ORDER BY p.selling_price ASC
      `;
      break;

    case "newest":
    default:
      sql += `
        ORDER BY datetime(p.created_at) DESC
      `;
      break;
  }

  return await db.getAllAsync(sql, params);
}

export async function getProductById(db, id) {
  const { company } = getActiveContextSync();

  const product = await db.getFirstAsync(
    `
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.cost_price,
      p.selling_price,
      p.minimum_quantity,
      p.item_type,
      p.unit,
      p.created_at,

      -- STOCK from batches (source of truth)
      COALESCE(SUM(b.quantity_on_hand), 0) AS stock_quantity,

      -- STOCK VALUE from batches
      COALESCE(SUM(
        b.quantity_on_hand * b.cost_price
      ), 0) AS stock_value

    FROM products p

    LEFT JOIN inventory_batches b
      ON b.product_id = p.id
      AND b.deleted_at IS NULL
      AND b.company = ?

    WHERE p.id = ?
      AND p.deleted_at IS NULL
      AND p.company = ?

    GROUP BY p.id
    LIMIT 1
    `,
    [company, id, company]
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
  const now = new Date().toISOString();

  if (!id) {
    throw new Error("Product id is required");
  }

  try {
    await db.runAsync(
      `
      UPDATE products
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      `,
      [now, now, id]
    )

    await enqueueSync(db,{
      model:"products",
      record_id:id,
      operation:"delete",
    })

  } catch (error) {
    throw error;
  }
}

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