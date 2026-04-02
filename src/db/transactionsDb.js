import uuid from "react-native-uuid";

const newUuid = () => uuid.v4();

// ------------------------
// Upsert a Transaction
// ------------------------
export async function upsertTransaction(
  db,
  {
    id,
    title,
    type,
    amount,
    category = null,
    category_id,
    note = null,
    date,
    created_at,
  }
) {
  const now = new Date().toISOString();
  const transactionDate = date ? date.toISOString() : now;
  amount = parseFloat(amount) || 0;

  await db.runAsync("BEGIN TRANSACTION");

  try {
    id = id || newUuid();

    await db.runAsync(
      `
      INSERT INTO transactions (
        id,
        title,
        type,
        amount,
        category,
        category_id,
        note,
        created_at,
        updated_at,
        date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        title = excluded.title,
        amount = excluded.amount,
        category = excluded.category,
        category_id = excluded.category_id,
        note = excluded.note,
        updated_at = excluded.updated_at,
        date = excluded.date
      `,
      [
        id,
        title,
        type,
        amount,
        category,
        category_id,
        note,
        created_at,
        now,
        transactionDate,
      ]
    );

    await db.runAsync("COMMIT");
    return id;
  } catch (error) {
    await db.runAsync("ROLLBACK");
    console.log(error,"hello error")
    throw error;
  }
}

// ------------------------
// Get Transactions by Month
// ------------------------
export async function getTransactions(db, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

  return await db.getAllAsync(
    `
    SELECT *
    FROM transactions
    WHERE 
      date >= ?
      AND date < ?
    ORDER BY datetime(date) DESC
    `,
    [start, end]
  );
}

// ------------------------
// Get Single Transaction
// ------------------------
export async function getTransactionById(db, id) {
  return await db.getFirstAsync(
    `
    SELECT * FROM transactions
    WHERE id = ? 
    LIMIT 1
    `,
    [id]
  );
}

// ------------------------
// Delete Transaction
// ------------------------
export async function deleteTransaction(db, id) {
  const now = new Date().toISOString();

  await db.runAsync(
    `
    UPDATE transactions
    SET deleted_at = ?, updated_at = ?, is_synced = 0
    WHERE id = ? 
    `,
    [now, now, id]
  );
}

export async function getTransactionStats(db, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

  // 1. Revenue and Cost from sales + sale_items
  const revenueAndCost = await db.getFirstAsync(
    `
    SELECT 
      SUM(si.price * si.quantity) AS revenue,
      SUM(p.cost_price * si.quantity) AS cost
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN products p ON p.id = si.product_id
    WHERE s.deleted_at IS NULL
      AND s.created_at >= ?
      AND s.created_at < ?
    `,
    [start, end]
  );

  // 2. Expenses (still from transactions)
  const expenseResult = await db.getFirstAsync(
    `
    SELECT SUM(amount) AS expenses
    FROM transactions
    WHERE type = 'expense'
      AND date >= ?
      AND date < ?
    `,
    [start, end]
  );

  const revenue = revenueAndCost?.revenue || 0;
  const cost = revenueAndCost?.cost || 0;
  const expenses = expenseResult?.expenses || 0;

  const grossProfit = revenue - cost;
  const netProfit = grossProfit - expenses;

  return {
    revenue,
    cost,
    expenses,
    grossProfit,
    netProfit,
  };
}



