import { getActiveContextSync, newUuid, withTransaction } from "./utils";
import { normalizeRange } from "../utils/timeNavigatorHelpers";
import { enqueueSync } from "../cloudSync/syncEvent";

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
  return withTransaction(db, async() => {
    const { company, user_id } = getActiveContextSync();

    const now = new Date().toISOString();
    const expenseDate = date ? date.toISOString() : now;

    const expenseId = id || newUuid();
    const cleanAmount = parseFloat(amount) || 0;

    await db.runAsync(
      `
      INSERT INTO expenses (
        id,
        company,
        created_by,
        updated_by,
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        amount = excluded.amount,
        category = excluded.category,
        category_id = excluded.category_id,
        note = excluded.note,
        payee = excluded.payee,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by,
        date = excluded.date
      `,
      [
        expenseId,
        company,
        user_id,
        user_id,
        title,
        cleanAmount,
        category,
        category_id,
        note,
        payee,
        now,
        now,
        expenseDate,
      ]
    );

    await enqueueSync(db,{
      model:"expenses",
      record_id:expenseId,
      operation:"upsert",
    })

    return expenseId;
  })
}

export async function getExpenses(db, timeState) {
  const { company } = getActiveContextSync();
  const { startDate, endDate } = normalizeRange(timeState);
  return await db.getAllAsync(
    `
    SELECT *
    FROM expenses
    WHERE 
      company = ?
      AND date >= ?
      AND date < ? 
      AND deleted_at is NULL
    ORDER BY datetime(date) DESC
    `,
    [company,startDate, endDate]
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

    await enqueueSync(db,{
      model:"expenses",
      record_id:id,
      operation:"delete",
    })

    await db.runAsync("COMMIT");

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}




