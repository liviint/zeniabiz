import { newUuid, getActiveContextSync, withTransaction } from "./utils";
import { enqueueSync } from "../cloudSync/syncEvent";

export async function getCustomers(
  db,
  {
    filter = "all",
    sort = "name_asc",
  } = {}
) {
  let whereClauses = ["deleted_at IS NULL"];
  let params = [];


  // Sorting
  let orderBy = "name ASC";

  switch (sort) {
    case "newest":
      orderBy = "created_at DESC";
      break;

    case "oldest":
      orderBy = "created_at ASC";
      break;

    case "name_desc":
      orderBy = "name DESC";
      break;

    case "name_asc":
    default:
      orderBy = "name ASC";
      break;
  }

  const query = `
    SELECT *
    FROM customers
    WHERE ${whereClauses.join(" AND ")}
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
      (
        SELECT COUNT(*)
        FROM sales
        WHERE customer_id = ?
          AND deleted_at IS NULL
      ) AS sales_count,

      (
        SELECT COALESCE(SUM(total_amount),0)
        FROM sales
        WHERE customer_id = ?
          AND deleted_at IS NULL
      ) AS total_sales,

      (
        SELECT COALESCE(SUM(amount_paid),0)
        FROM sales
        WHERE customer_id = ?
          AND deleted_at IS NULL
      ) AS total_paid,

      (
        SELECT COALESCE(SUM(balance_due),0)
        FROM sales
        WHERE customer_id = ?
          AND deleted_at IS NULL
      ) AS balance_due
    `,
    [
      customerId,
      customerId,
      customerId,
      customerId,
    ]
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

export async function createCustomer(
  db,
  {
    name,
    phone = null,
    note = null,
  }
) {

  return withTransaction(db,async ()=> {
    const { company, user_id } =
    getActiveContextSync(db);

    const now = new Date().toISOString();

    const id = newUuid();

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
      `,
      [
        id,
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
      record_id: id,
      operation: "upsert",
    });

    return id;
  })
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
