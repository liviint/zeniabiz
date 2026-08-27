import { enqueueSync } from "../../../cloudSync/syncEvent";
import { getActiveContextSync, newUuid, withTransaction } from "../../utils";

export async function getCustomers(
  db,
  {
    sort = "name_asc",
  } = {}
) {
  const whereClauses = ["c.deleted_at IS NULL"];
  const params = [];

  let orderBy = "c.name ASC";

  switch (sort) {
    case "newest":
      orderBy = "c.created_at DESC";
      break;

    case "oldest":
      orderBy = "c.created_at ASC";
      break;

    case "name_desc":
      orderBy = "c.name DESC";
      break;

    case "name_asc":
      orderBy = "c.name ASC";
      break;

    case "top_customers":
      orderBy = "total_revenue DESC";
      break;
  }

  const query = `
    SELECT 
      c.*,
      COALESCE(SUM(s.total_amount), 0) AS total_revenue,
      COALESCE(SUM(s.amount_paid), 0) AS total_paid,
      COALESCE(SUM(s.discount), 0) AS total_discount
    FROM customers c
    LEFT JOIN sales s
      ON s.customer_id = c.id
      AND s.deleted_at IS NULL
    WHERE ${whereClauses.join(" AND ")}
    GROUP BY c.id
    ORDER BY ${orderBy}
  `;

  return await db.getAllAsync(query, params);
}

export async function getCustomerById(db, id) {
  return await db.getFirstAsync(
    `
    SELECT *
    FROM customers
    WHERE id = ?
      AND deleted_at IS NULL
    `,
    [id]
  );
}

export async function getCustomerStats(
  db,
  customerId
) {
  return await db.getFirstAsync(
    `
    SELECT
      COUNT(*) AS sales_count,

      COALESCE(
        SUM(total_amount),
        0
      ) AS total_sales,

      COALESCE(
        SUM(amount_paid),
        0
      ) AS total_paid,

      COALESCE(
        SUM(balance_due),
        0
      ) AS balance_due,

      COALESCE(
        SUM(discount),
        0
      ) AS total_discount

    FROM sales

    WHERE
      customer_id = ?
      AND deleted_at IS NULL
    `,
    [customerId]
  );
}

export async function getCustomerSales(db, customerId) {
  return await db.getAllAsync(
    `
    SELECT *
    FROM sales
    WHERE customer_id = ?
      AND deleted_at IS NULL
    ORDER BY date DESC
    `,
    [customerId]
  );
}

export async function upsertCustomer(
  db,
  {
    id,
    name,
    phone = null,
    note = null,
  }
) {
  return withTransaction(db, async () => {
    const { company, user_id } =
      getActiveContextSync(db);

    const now = new Date().toISOString();

    const customer_id = id || newUuid();

    await db.runAsync(
      `
      INSERT INTO customers (
        id,
        company,
        name,
        phone,
        note,
        created_by,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)

      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        phone = excluded.phone,
        note = excluded.note,
        updated_at = excluded.updated_at
      `,
      [
        customer_id,
        company,
        name,
        phone,
        note,
        user_id,
        now,
        now,
      ]
    );

    await enqueueSync(db, {
      model: "customers",
      record_id: customer_id,
      operation: "upsert",
    });

    return customer_id;
  });
}

export async function deleteCustomer(db, id) {
  const now = new Date().toISOString();

  if (!id) {
    throw new Error("Customer id is required");
  }

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ Soft delete (NOT hard delete)
    await db.runAsync(
      `
      UPDATE customers
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      `,
      [now, now, id]
    );

    await enqueueSync(db,{
      model:"customers",
      record_id:id,
      operation:"delete",
    })

    await db.runAsync("COMMIT");

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}
