import { newUuid } from "../../utils";
import { normalizeRange } from "../../../utils/timeNavigatorHelpers";
import { enqueueSync } from "../../../cloudSync/syncEvent";

export async function getCredits(
  db,
  timeState,
  statusFilter = "outstanding"
) {
  const { startDate, endDate } = normalizeRange(timeState);
  let extraCondition = "";

  let balanceCondition =
    "AND ROUND(s.balance_due, 2) > 0";

  if (statusFilter === "unpaid") {
    extraCondition = `
      AND s.payment_status = 'UNPAID'
    `;
  }

  if (statusFilter === "partial") {
    extraCondition = `
      AND s.payment_status = 'PARTIAL'
    `;
  }

  if (statusFilter === "paid") {
    balanceCondition = `
      AND ROUND(s.balance_due, 2) <= 0
    `;
  }

  const result = await db.getAllAsync(
    `
    SELECT
      s.id,
      s.title,

      s.total_amount,
      s.customer_id,
      s.amount_paid,
      s.balance_due,

      s.payment_status,
      s.due_date,
      s.date,

      c.name AS customer_name,
      c.phone

    FROM sales s

    LEFT JOIN customers c
      ON c.id = s.customer_id

    WHERE
      s.deleted_at IS NULL

      AND s.is_credit_sale = 1

      ${balanceCondition}

      AND date >= ?
        AND date < ?

      ${extraCondition}

    ORDER BY s.date DESC
    `,
    [startDate,endDate,]
  );

  return result;
}

export async function getCreditById(db, id) {
  const credit = await db.getFirstAsync(
    `
    SELECT
      s.*,
      c.name AS customer_name,
      c.phone

    FROM sales s

    LEFT JOIN customers c
      ON c.id = s.customer_id

    WHERE
      s.id = ?
      AND s.deleted_at IS NULL
    `,
    [id]
  );

  if (!credit) {
    return null;
  }

  const payments = await db.getAllAsync(
    `
    SELECT *
    FROM payments
    WHERE
      sale_id = ?
      AND deleted_at IS NULL
    ORDER BY date DESC
    `,
    [id]
  );

  return {
    ...credit,
    payments,
  };
}

export async function offsetCreditBalance(db, saleId) {
  const sale = await db.getFirstAsync(
    `
    SELECT *
    FROM sales
    WHERE id = ?
    `,
    [saleId]
  );

  if (!sale) {
    throw new Error("Sale not found");
  }

  const remainingBalance = Math.max(
    Number(sale.balance_due || 0),
    0
  );

  if (remainingBalance <= 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.runAsync("BEGIN");
  let paymentId = newUuid()

  try {
    // Create payment record
    await db.runAsync(
      `
      INSERT INTO payments (
        id,
        company,
        sale_id,
        customer_id,
        payment_type,
        amount,
        payment_method,
        note,
        date,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        paymentId,
        sale.company,
        sale.id,
        sale.customer_id,
        "OFFSET",
        remainingBalance,
        "cash",
        "Balance offset",
        now,
        now,
        now,
      ]
    );

    await enqueueSync(db, {
      model: "payments",
      record_id: paymentId,
      operation: "upsert",
    });

    // Update sale
    await db.runAsync(
      `
      UPDATE sales
      SET
        amount_paid = total_amount,
        balance_due = 0,
        payment_status = 'PAID',
        updated_at = ?
      WHERE id = ?
      `,
      [now, sale.id]
    );

    await enqueueSync(db, {
      model: "sales",
      record_id: sale.id,
      operation: "upsert",
    });

    await db.runAsync("COMMIT");
  } catch (err) {
    await db.runAsync("ROLLBACK");
    throw err;
  }
}

export function getCreditStats(
  credits,
  statusFilter = "outstanding"
) {
  const count = credits.length;

  const totalAmount = credits.reduce(
    (sum, credit) => {
      if (statusFilter === "paid") {
        return sum + Number(credit.amount_paid || 0);
      }

      return sum + Number(credit.balance_due || 0);
    },
    0
  );
    
  return {
    totalAmount,
    count,
  };
}

export async function recordCreditPayment(
  db,
  {
    credit,
    amount,
    paymentMethod,
    note,
  }
) {
  const now = new Date().toISOString();

  const newAmountPaid =
    Number(credit.amount_paid || 0) + amount;

  const newBalance =
    Number(credit.total_amount || 0) - newAmountPaid;

  const paymentStatus =
    newBalance <= 0 ? "PAID" : "PARTIAL";

  await db.runAsync("BEGIN");
  let paymentId  = newUuid()

  try {
    await db.runAsync(
      `
      INSERT INTO payments (
        id,
        company,
        sale_id,
        customer_id,
        payment_type,
        amount,
        payment_method,
        note,
        date,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        paymentId,
        credit.company,
        credit.id,
        credit.customer_id,
        "Offset",
        amount,
        paymentMethod,
        note || null,
        now,
        now,
        now,
      ]
    );
    await enqueueSync(db, {
      model: "payments",
      record_id: paymentId,
      operation: "upsert",
    });

    await db.runAsync(
      `
      UPDATE sales
      SET
        amount_paid = ?,
        balance_due = ?,
        payment_status = ?,
        updated_at = ?
      WHERE id = ?
      `,
      [
        newAmountPaid,
        Math.max(newBalance, 0),
        paymentStatus,
        now,
        credit.id,
      ]
    );

    await enqueueSync(db, {
      model: "sales",
      record_id: credit.id,
      operation: "upsert",
    });

    await db.runAsync("COMMIT");

    return {
      amountPaid: newAmountPaid,
      balanceDue: Math.max(newBalance, 0),
      paymentStatus,
    };
  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}