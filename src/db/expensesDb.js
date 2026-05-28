import { syncEvent } from "../cloudSync/syncEvent";
import { getActiveContextSync, newUuid } from "./utils";
import { normalizeRange } from "../utils/timeNavigatorHelpers";

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
  const { company, user_id } = getActiveContextSync();

  const now = new Date().toISOString();
  const expenseDate = date ? date.toISOString() : now;

  const expenseId = id || newUuid();
  const cleanAmount = parseFloat(amount) || 0;

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ UPSERT LOCAL EXPENSE
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

    await db.runAsync("COMMIT");

    // 2️⃣ SYNC EVENT (after commit only)
    syncEvent(db, {
      model: "expenses",
      operation: "upsert",
      payload: {
        id: expenseId,
        company,
        created_by: user_id,
        updated_by: user_id,

        title,
        amount: cleanAmount,
        category:category_id,
        note,
        payee,
        date: expenseDate,

        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    }).catch((err) => {
      console.error("Expense sync enqueue failed:", err);
    });

    return expenseId;

  } catch (error) {
    await db.runAsync("ROLLBACK");
    console.log(error, "upsert expense error");
    throw error;
  }
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
  const { company } = getActiveContextSync();
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
    syncEvent(db, {
      model: "expenses",
      operation: "delete",
      payload: {
        id,
        company,
        deleted_at: now,
        updated_at: now
      }
    })
    .catch(err => {
  console.error("Sync failed:", err);
});

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}




