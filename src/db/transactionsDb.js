import uuid from "react-native-uuid";

const newUuid = () => uuid.v4();

// ------------------------
// Upsert a Transaction
// ------------------------
export async function upsertTransaction(
  db,
  {
    uuid,
    type,
    amount,
    category = null,
    note = null,
    date,
    created_at,
    source = "manual",
  }
) {
  const now = new Date().toISOString();
  const transactionDate = date ? date.toISOString() : now;
  amount = parseFloat(amount) || 0;

  await db.runAsync("BEGIN TRANSACTION");

  try {
    const localUuid = uuid ? uuid : newUuid();

    await db.runAsync(
      `
      INSERT INTO biz_transactions (
        uuid,
        type,
        amount,
        category,
        note,
        source,
        created_at,
        updated_at,
        date,
        is_synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)

      ON CONFLICT(uuid) DO UPDATE SET
        type = excluded.type,
        amount = excluded.amount,
        category = excluded.category,
        note = excluded.note,
        updated_at = excluded.updated_at,
        date = excluded.date,
        is_synced = 0
      `,
      [
        localUuid,
        type,
        amount,
        category,
        note,
        source,
        created_at,
        now,
        transactionDate,
      ]
    );

    await db.runAsync("COMMIT");
    return localUuid;
  } catch (error) {
    await db.runAsync("ROLLBACK");
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
    FROM biz_transactions
    WHERE deleted_at IS NULL
      AND date >= ?
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
    SELECT * FROM biz_transactions
    WHERE id = ? AND deleted_at IS NULL
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
    UPDATE biz_transactions
    SET deleted_at = ?, updated_at = ?, is_synced = 0
    WHERE id = ? AND deleted_at IS NULL
    `,
    [now, now, id]
  );
}

// ------------------------
// Get Transaction Stats
// ------------------------
export async function getTransactionStats(db, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

  const result = await db.getFirstAsync(
    `
    SELECT
      SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END) AS sales,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
    FROM biz_transactions
    WHERE deleted_at IS NULL
      AND date >= ?
      AND date < ?
    `,
    [start, end]
  );

  const sales = result?.sales || 0;
  const expenses = result?.expenses || 0;

  return {
    sales,
    expenses,
    profit: sales - expenses,
  };
}

// ------------------------
// Sync Transactions from API
// ------------------------
export const syncTransactionsFromApi = async (db, transactions = []) => {
  if (!Array.isArray(transactions) || transactions.length === 0) return;

  for (const tx of transactions) {
    const { uuid, type, amount, category, note, source, date, created_at, updated_at, deleted_at } = tx;

    if (deleted_at) {
      await db.runAsync(
        `
        UPDATE biz_transactions
        SET deleted_at = ?, updated_at = ?, is_synced = 1
        WHERE uuid = ?
        `,
        [deleted_at, updated_at, uuid]
      );
      continue;
    }

    await db.runAsync(
      `
      INSERT INTO biz_transactions (
        uuid,
        type,
        amount,
        category,
        note,
        source,
        date,
        created_at,
        updated_at,
        is_synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(uuid) DO UPDATE SET
        type = excluded.type,
        amount = excluded.amount,
        category = excluded.category,
        note = excluded.note,
        source = excluded.source,
        date = excluded.date,
        updated_at = excluded.updated_at,
        deleted_at = NULL,
        is_synced = 1
      `,
      [uuid, type, amount, category, note, source, date, created_at, updated_at]
    );
  }

  console.log("✅ Transactions synced from API");
};

// ------------------------
// Get Unsynced Transactions
// ------------------------
export async function getUnsyncedTransactions(db) {
  return await db.getAllAsync(
    `
    SELECT *
    FROM biz_transactions
    WHERE is_synced = 0
    `
  );
}

// ------------------------
// Mark Transactions as Synced
// ------------------------
export const markTransactionsAsSynced = async (db, uuids) => {
  if (!uuids.length) return;
  const placeholders = uuids.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE biz_transactions
      SET is_synced = 1
      WHERE uuid IN (${placeholders})`,
    uuids
  );
};