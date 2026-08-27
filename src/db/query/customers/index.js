import { enqueueSync } from "../../../cloudSync/syncEvent";
import { getActiveContextSync, newUuid, withTransaction } from "../../utils";
import { normalizeRange } from "../../../utils/timeNavigatorHelpers";


export async function getCustomers(
    db,
    {
        timeState,
        filter = "all",
        sort = "name_asc",
        search = "",
    } = {}
) {
    const { company } = getActiveContextSync();

    let orderBy = "c.name ASC";

    /**
     * =========================
     * TIME RANGE
     * =========================
     */

    const range = timeState
        ? normalizeRange(timeState)
        : null;

    /**
     * =========================
     * TIME FILTER
     * =========================
     */

    let timeClause = "";

    if (range) {
        timeClause = `
            AND s.date >= ?
            AND s.date < ?
        `;
    }

    /**
     * =========================
     * HAVING FILTERS
     * =========================
     */

    const havingConditions = [];

    // Only customers who made a sale
    // during the selected period.
    if (range) {
        havingConditions.push(
            "COUNT(s.id) > 0"
        );
    }

    // Customers with outstanding balance.
    if (filter === "with_balance") {
        havingConditions.push(
            "COALESCE(SUM(s.balance_due), 0) > 0"
        );
    }

    // Customers with no outstanding balance.
    if (filter === "no_balance") {
        havingConditions.push(
            "COALESCE(SUM(s.balance_due), 0) <= 0"
        );
    }

    const havingClause = havingConditions.length
        ? `HAVING ${havingConditions.join(" AND ")}`
        : "";

    /**
     * =========================
     * SEARCH
     * =========================
     */

    const trimmedSearch = search?.trim() || "";
    const searchTerm = `%${trimmedSearch}%`;

    /**
     * =========================
     * SORTING
     * =========================
     */

    switch (sort) {
        case "name_asc":
            orderBy = "c.name ASC";
            break;

        case "name_desc":
            orderBy = "c.name DESC";
            break;

        case "newest":
            orderBy = "datetime(c.created_at) DESC";
            break;

        case "oldest":
            orderBy = "datetime(c.created_at) ASC";
            break;

        case "high_revenue":
            orderBy = "total_revenue DESC";
            break;

        case "high_balance":
            orderBy = "balance_due DESC";
            break;
        case "high_paid":
          orderBy =  "total_paid DESC";
          break;

        default:
            orderBy = "c.name ASC";
    }

    /**
     * =========================
     * QUERY
     * =========================
     */

    let sql = `
        SELECT
            c.*,

            COUNT(s.id) AS sales_count,

            COALESCE(
                SUM(s.total_amount),
                0
            ) AS total_revenue,

            COALESCE(
                SUM(s.amount_paid),
                0
            ) AS total_paid,

            COALESCE(
                SUM(s.balance_due),
                0
            ) AS balance_due,

            COALESCE(
                SUM(s.discount),
                0
            ) AS total_discount

        FROM customers c

        LEFT JOIN sales s
            ON s.customer_id = c.id
            AND s.company = c.company
            AND s.deleted_at IS NULL

            ${timeClause}

        WHERE
            c.company = ?
            AND c.deleted_at IS NULL
    `;

    /**
     * =========================
     * SEARCH
     * =========================
     */

    if (trimmedSearch) {
        sql += `
            AND (
                c.name LIKE ?
                OR c.phone LIKE ?
            )
        `;
    }

    /**
     * =========================
     * GROUPING
     * =========================
     */

    sql += `
        GROUP BY c.id
    `;

    /**
     * =========================
     * HAVING
     * =========================
     */

    sql += `
        ${havingClause}
    `;

    /**
     * =========================
     * SORTING
     * =========================
     */

    sql += `
        ORDER BY ${orderBy}
    `;

    /**
     * =========================
     * PARAMETERS
     * =========================
     */

    const params = [];

    // Time parameters appear first
    // because they occur in the JOIN.
    if (range) {
        params.push(
            range.startDate,
            range.endDate
        );
    }

    // Company placeholder occurs in WHERE.
    params.push(company);

    // Search placeholders.
    if (trimmedSearch) {
        params.push(
            searchTerm,
            searchTerm,
            searchTerm
        );
    }

    return await db.getAllAsync(
        sql,
        params
    );
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
