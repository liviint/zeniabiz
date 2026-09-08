import { enqueueSync } from "../../../cloudSync/syncEvent";
import { getActiveContextSync, newUuid, withTransaction } from "../../utils";
import { normalizeRange } from "../../../utils/timeNavigatorHelpers";

export async function upsertProductAndRestocking(
  db,
  {
    id,
    name,
    barcode = null,
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
        barcode,
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
    try {
      await db.runAsync(
        `
        INSERT INTO products (
          id,
          company,
          created_by,
          updated_by,
          name,
          barcode,
          selling_price,
          cost_price,
          minimum_quantity,
          item_type,
          unit,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          barcode = excluded.barcode,
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
          product.barcode,
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
    } catch (error) {
      throw error
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
        OR p.barcode LIKE ?
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
      p.barcode,
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

export async function getInventoryInsights(db,{timeState}) {
  const { company } = getActiveContextSync(db);

  const { startDate, endDate } = normalizeRange(timeState);
  console.log(timeState,startDate,endDate,"hello dates 123...")


  const inventory = await db.getFirstAsync(
    `
    SELECT
      COUNT(*) AS products_count,

      COALESCE(
        SUM(stock_quantity),
        0
      ) AS units_in_stock,

      COALESCE(
        SUM(stock_value),
        0
      ) AS stock_value,

      COALESCE(
        SUM(
          CASE
            WHEN stock_quantity > 0
              AND stock_quantity <= minimum_quantity
            THEN 1
            ELSE 0
          END
        ),
        0
      ) AS low_stock,

      COALESCE(
        SUM(
          CASE
            WHEN stock_quantity <= 0
            THEN 1
            ELSE 0
          END
        ),
        0
      ) AS out_of_stock

    FROM (
      SELECT
        p.id,
        p.minimum_quantity,

        COALESCE(
          (
            SELECT SUM(b.quantity_on_hand)
            FROM inventory_batches b
            WHERE b.product_id = p.id
              AND b.company = ?
              AND b.deleted_at IS NULL
          ),
          0
        ) AS stock_quantity,

        COALESCE(
          (
            SELECT SUM(
              b.quantity_on_hand * b.cost_price
            )
            FROM inventory_batches b
            WHERE b.product_id = p.id
              AND b.company = ?
              AND b.deleted_at IS NULL
          ),
          0
        ) AS stock_value

      FROM products p

      WHERE p.company = ?
        AND p.deleted_at IS NULL
        AND p.item_type = 'product'
    )
    `,
    [company, company, company]
  );

  /*
   * ---------------------------------------------------------
   * SALES OVER SELECTED PERIOD
   * ---------------------------------------------------------
   */

  const sales = await db.getFirstAsync(
  `
  SELECT

    COALESCE(
      SUM(ABS(si.quantity)),
      0
    ) AS units_sold,

    COALESCE(
      SUM(
        ABS(si.quantity) * COALESCE(si.price, 0)
      ),
      0
    ) AS sales_value,

    COALESCE(
      SUM(
        ABS(si.quantity) * COALESCE(si.cost_price, 0)
      ),
      0
    ) AS cost_value

  FROM sale_items si

  JOIN sales s
    ON s.id = si.sale_id
    AND s.company = si.company
    AND s.deleted_at IS NULL

  WHERE si.company = ?
    AND si.deleted_at IS NULL
    AND si.item_type = 'product'
    AND s.date >= ?
    AND s.date < ?
  `,
  [company, startDate, endDate]
);

  /*
   * ---------------------------------------------------------
   * FAST / SLOW / NO MOVEMENT
   *
   * We first calculate sales per product.
   * ---------------------------------------------------------
   */

  const movement = await db.getAllAsync(
    `
    SELECT
      p.id,
      p.name,
      p.sku,
      p.selling_price,
      p.cost_price,

      COALESCE(
        (
          SELECT SUM(ABS(m.quantity))
          FROM inventory_movements m
          WHERE m.product_id = p.id
            AND m.company = ?
            AND m.type = 'sale'
            AND m.deleted_at IS NULL
            AND m.date >= ?
            AND m.date < ?
        ),
        0
      ) AS units_sold,

      COALESCE(
        (
          SELECT SUM(
            ABS(m.quantity) * COALESCE(m.selling_price, 0)
          )
          FROM inventory_movements m
          WHERE m.product_id = p.id
            AND m.company = ?
            AND m.type = 'sale'
            AND m.deleted_at IS NULL
            AND m.date >= ?
            AND m.date < ?
        ),
        0
      ) AS sales_value,

      COALESCE(
        (
          SELECT SUM(b.quantity_on_hand)
          FROM inventory_batches b
          WHERE b.product_id = p.id
            AND b.company = ?
            AND b.deleted_at IS NULL
        ),
        0
      ) AS stock_quantity

    FROM products p

    WHERE p.company = ?
      AND p.deleted_at IS NULL
      AND p.item_type = 'product'

    ORDER BY units_sold DESC
    `,
    [
      company,
      startDate,
      endDate,

      company,
      startDate,
      endDate,

      company,

      company,
    ]
  );

  /*
   * ---------------------------------------------------------
   * CLASSIFY MOVEMENT
   * ---------------------------------------------------------
   */

  const productsWithSales = movement.filter(
    product => Number(product.units_sold) > 0
  );

  const productsWithoutSales = movement.filter(
    product => Number(product.units_sold) <= 0
  );

  /*
   *
   * Top 20%     = fast moving
   * Bottom 20%  = slow moving
   * Middle       = normal
   */

  const totalMoving = productsWithSales.length;

  let fastMoving = [];
  let slowMoving = [];
  let normalMoving = [];

  if (totalMoving > 0) {
    const fastCount = Math.max(
      1,
      Math.ceil(totalMoving * 0.2)
    );

    const slowCount = Math.max(
      1,
      Math.ceil(totalMoving * 0.2)
    );

    fastMoving = productsWithSales.slice(
      0,
      fastCount
    );

    slowMoving = productsWithSales.slice(
      Math.max(
        fastCount,
        totalMoving - slowCount
      )
    );

    normalMoving = productsWithSales.slice(
      fastCount,
      totalMoving - slowCount
    );
  }

  /*
   * ---------------------------------------------------------
   * EXPIRY HEALTH
   * ---------------------------------------------------------
   */

  const expiry = await db.getFirstAsync(
    `
    SELECT

      COALESCE(
        SUM(
          CASE
            WHEN expiry_date IS NOT NULL
              AND quantity_on_hand > 0
              AND date(expiry_date) >= date('now')
              AND date(expiry_date) <= date('now', '+30 days')
            THEN 1
            ELSE 0
          END
        ),
        0
      ) AS expiring_soon,

      COALESCE(
        SUM(
          CASE
            WHEN expiry_date IS NOT NULL
              AND quantity_on_hand > 0
              AND date(expiry_date) < date('now')
            THEN 1
            ELSE 0
          END
        ),
        0
      ) AS expired

    FROM inventory_batches

    WHERE company = ?
      AND deleted_at IS NULL
    `,
    [company]
  );

  /*
   * ---------------------------------------------------------
   * RETURN
   * ---------------------------------------------------------
   */

  console.log(sales,"hello sales")

  return {
    overview: {
      products: Number(inventory?.products_count || 0),
      unitsInStock: Number(inventory?.units_in_stock || 0),
      stockValue: Number(inventory?.stock_value || 0),

      unitsSold: Number(sales?.units_sold || 0),
      salesValue: Number(sales?.sales_value || 0),
    },

    inventory: {
      lowStock: Number(inventory?.low_stock || 0),
      outOfStock: Number(inventory?.out_of_stock || 0),
      expiringSoon: Number(expiry?.expiring_soon || 0),
      expired: Number(expiry?.expired || 0),
    },

    movement: {
      fastMoving,
      normalMoving,
      slowMoving,
      noMovement: productsWithoutSales,
    },
  };
}

export async function getInventoryMovementProducts(
  db,
  {
    timeState,
    filter = "all",
    sort = "fast_moving",
    search = "",
  } = {}
) {
  const { company } = getActiveContextSync(db);

  const { startDate, endDate } = normalizeRange(timeState);

  if (!startDate || !endDate) {
    throw new Error("Invalid time range");
  }

  /*
   * ---------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------
   */

  let searchClause = "";
  const searchParams = [];

  if (search?.trim()) {
    const value = `%${search.trim()}%`;

    searchClause = `
      AND (
        p.name LIKE ?
        OR p.sku LIKE ?
        OR p.barcode LIKE ?
      )
    `;

    searchParams.push(
      value,
      value,
      value
    );
  }

  /*
   * ---------------------------------------------------------
   * FILTER
   * ---------------------------------------------------------
   *
   * All:
   *   Return every product.
   *
   * No movement:
   *   Return products that sold zero units during the
   *   selected period.
   */

  let filterClause = "";

  if (filter === "no_movement") {
    filterClause = `
      AND COALESCE(m.units_sold, 0) = 0
    `;
  }

  /*
   * ---------------------------------------------------------
   * SORT
   * ---------------------------------------------------------
   */

  let orderClause = `
    ORDER BY
      COALESCE(m.units_sold, 0) DESC,
      p.name COLLATE NOCASE ASC
  `;

  if (sort === "slow_moving") {
    /*
     * Slow moving means:
     * - Product has at least one sale
     * - Lowest number of units sold first
     */

    if (filter !== "no_movement") {
      filterClause += `
        AND COALESCE(m.units_sold, 0) > 0
      `;
    }

    orderClause = `
      ORDER BY
        COALESCE(m.units_sold, 0) ASC,
        p.name COLLATE NOCASE ASC
    `;
  }

  /*
   * ---------------------------------------------------------
   * QUERY
   * ---------------------------------------------------------
   */

  const query = `
    SELECT

      p.id,
      p.name,
      p.sku,
      p.barcode,
      p.selling_price,
      p.cost_price,

      COALESCE(
        m.units_sold,
        0
      ) AS units_sold,

      COALESCE(
        m.sales_value,
        0
      ) AS sales_value,

      COALESCE(
        b.stock_quantity,
        0
      ) AS stock_quantity

    FROM products p

    LEFT JOIN (
      SELECT
        product_id,

        SUM(
          ABS(quantity)
        ) AS units_sold,

        SUM(
          ABS(quantity) *
          COALESCE(selling_price, 0)
        ) AS sales_value

      FROM inventory_movements

      WHERE company = ?
        AND type = 'sale'
        AND deleted_at IS NULL
        AND date >= ?
        AND date < ?

      GROUP BY product_id

    ) m
      ON m.product_id = p.id

    /*
     * -------------------------------------------------------
     * CURRENT STOCK
     * -------------------------------------------------------
     */

    LEFT JOIN (
      SELECT
        product_id,

        SUM(
          quantity_on_hand
        ) AS stock_quantity

      FROM inventory_batches

      WHERE company = ?
        AND deleted_at IS NULL

      GROUP BY product_id

    ) b
      ON b.product_id = p.id

    /*
     * -------------------------------------------------------
     * PRODUCTS
     * -------------------------------------------------------
     */

    WHERE p.company = ?
      AND p.deleted_at IS NULL
      AND p.item_type = 'product'

      ${searchClause}

      ${filterClause}

    ${orderClause}
  `;

  const params = [
    // Movement
    company,
    startDate,
    endDate,

    // Stock
    company,

    // Products
    company,

    // Search
    ...searchParams,
  ];

  console.log(
    "Inventory movement query:",
    {
      timeState,
      startDate,
      endDate,
      filter,
      sort,
      search,
      params,
    }
  );

  const products = await db.getAllAsync(
    query,
    params
  );

  console.log(
    "Inventory movement products:",
    products.length
  );

  return products;
}