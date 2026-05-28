export async function getCredits(db, timeState) {
  const result = await db.getAllAsync(
    `
    SELECT
      s.id,
      s.title,
      s.total_amount,
      s.amount_paid,
      s.balance_due,
      s.payment_status,
      s.date,

      c.name AS customer_name,
      c.phone

    FROM sales s

    LEFT JOIN customers c
      ON c.id = s.customer_id

    WHERE
      s.deleted_at IS NULL
      AND s.balance_due > 0
      AND date(s.date) BETWEEN date(?) AND date(?)

    ORDER BY s.date DESC
    `,
    [
      timeState.startDate.toISOString(),
      timeState.endDate.toISOString(),
    ]
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