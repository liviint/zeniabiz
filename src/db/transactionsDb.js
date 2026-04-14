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
      INSERT INTO expenses (
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
export async function getExpenses(db, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

  return await db.getAllAsync(
    `
    SELECT *
    FROM expenses
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
    SELECT * FROM expenses
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
    UPDATE expenses
    SET deleted_at = ?, updated_at = ?, is_synced = 0
    WHERE id = ? 
    `,
    [now, now, id]
  );
}




