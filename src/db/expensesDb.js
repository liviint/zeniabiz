import uuid from "react-native-uuid";
import { syncEvent } from "../cloudSync/enqueue";

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
    payee = "",
    date,
  }
) {
  const now = new Date().toISOString();
  const transactionDate = date ? date.toISOString() : now;

  const expenseId = id || newUuid();
  const cleanAmount = parseFloat(amount) || 0;

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ Upsert expense
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

    // 🔥 2️⃣ SYNC EVENT (AFTER COMMIT ONLY)
    await syncEvent(db, {
      model: "expenses",
      operation: "upsert",
      payload: {
        id: expenseId,
        title,
        amount: cleanAmount,
        category,
        category_id,
        note,
        payee,
        date: transactionDate,
        created_at: now,
        updated_at: now,
        deleted_at: null
      }
    });

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
  const now = new Date().toISOString();

  if (!id) {
    throw new Error("Expense id is required");
  }

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ Soft delete (NOT hard delete)
    await db.runAsync(
      `
      UPDATE expenses
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      `,
      [now, now, id]
    );

    await db.runAsync("COMMIT");

    // 🔥 2️⃣ SYNC EVENT (AFTER COMMIT)
    await syncEvent(db, {
      model: "expenses",
      operation: "delete",
      payload: {
        id,
        deleted_at: now,
        updated_at: now
      }
    });

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}




