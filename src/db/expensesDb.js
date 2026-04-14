import uuid from "react-native-uuid";

const newUuid = () => uuid.v4();

export async function upsertExpense(
  db,
  {
    id,
    title,
    amount,
    category = null,
    category_id = null,
    note = null,
    payee="",
    date,
  }
) {
  const now = new Date().toISOString();
  const transactionDate = date ? date.toISOString() : now;

  const expenseId = id || newUuid();
  const cleanAmount = parseFloat(amount) || 0;

  await db.runAsync("BEGIN TRANSACTION");

  try {
    await db.runAsync(
      `
      INSERT INTO expenses (
        id,
        title,
        amount,
        category,
        category_id,
        note,
        payee,
        created_at,
        updated_at,
        date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        amount = excluded.amount,
        category = excluded.category,
        category_id = excluded.category_id,
        note = excluded.note,
        payee = excluded.payee,
        updated_at = excluded.updated_at,
        date = excluded.date
      `,
      [
        expenseId,
        title,
        cleanAmount,
        category,
        category_id,
        note,
        payee,
        now,
        now,
        transactionDate,
      ]
    );

    await db.runAsync("COMMIT");
    return expenseId;
  } catch (error) {
    await db.runAsync("ROLLBACK");
    console.log(error, "upsert expense error");
    throw error;
  }
}

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

export async function deleteExpense(db, id) {
  await db.runAsync(
    `DELETE FROM expenses WHERE id = ?`,
    [id]
  );
}




