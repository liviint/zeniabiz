import { syncEvent } from "../cloudSync/syncEvent";
import { getActiveContextSync , newUuid} from "./utils";

export const upsertExpenseTemplate = async (db, template) => {
  const {
    id,
    title,
    amount,
    category = null,
    category_id = null,
    payee = null,
    note = null,
  } = template;

  const { company, user_id } = getActiveContextSync();

  if (!company || !user_id) {
    throw new Error("Missing active company or user context");
  }

  const templateId = id || newUuid();
  const now = new Date().toISOString();

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ Local write
    await db.runAsync(
      `
      INSERT INTO expense_templates (
        id,
        company,
        title,
        amount,
        category,
        category_id,
        payee,
        note,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        amount = excluded.amount,
        category = excluded.category,
        category_id = excluded.category_id,
        payee = excluded.payee,
        note = excluded.note,
        updated_at = excluded.updated_at
      `,
      [
        templateId,
        company,
        title,
        amount,
        category,
        category_id,
        payee,
        note,
        now,
        now,
      ]
    );

    await db.runAsync("COMMIT");

    // 2️⃣ Sync event (after commit ONLY)
    syncEvent(db, {
      model: "expense_templates",
      operation: "upsert",
      payload: {
        id: templateId,

        company,
        created_by: user_id,
        updated_by: user_id,

        title,
        amount,
        category:category_id,
        payee,
        note,

        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    }).catch((err) => {
      console.error("Expense template sync failed:", err);
    });

    return templateId;
  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
};

export const getTransactionTemplates = async (db) => {
  const {company} = getActiveContextSync()
  return await db.getAllAsync(`
    SELECT *
    FROM expense_templates
    WHERE company = ?
    AND deleted_at IS NULL
    ORDER BY usage_count DESC, updated_at DESC
  `,[company]);
};

export const getTransactionTemplateByid = async (db, id) => {
  const { company } = getActiveContextSync();

  return await db.getFirstAsync(
    `
    SELECT *
    FROM expense_templates
    WHERE id = ?
      AND company = ?
      AND deleted_at IS NULL
    `,
    [id, company]
  );
};

export const deleteTransactionTemplate = async (db, id) => {
  const { company } = getActiveContextSync(db);
  const now = new Date().toISOString();

  await db.runAsync(
    `
    UPDATE expense_templates
    SET deleted_at = ?,
        updated_at = ?
    WHERE id = ?
    `,
    [now, now, id]
  );

  // 🔥 SYNC EVENT
  await syncEvent(db, {
    model: "expense_templates",
    operation: "delete",
    payload: {
      id,
      company,
      deleted_at: now,
      updated_at: now,
    }
  });
};

export const restoreTransactionTemplate = async (db, uuid) => {
  await db.runAsync(
    `
    UPDATE expense_templates
    SET deleted_at = NULL,
        updated_at = datetime('now'),
        is_synced = 0
    WHERE uuid = ?
    `,
    [uuid]
  );
};


export const markTemplateAsSynced = async (db, uuid) => {
  await db.runAsync(
    `
    UPDATE expense_templates
    SET is_synced = 1,
        updated_at = datetime('now')
    WHERE uuid = ?
    `,
    [uuid]
  );
};

export const getUnsyncedTemplates = async (db) => {
  return await db.getAllAsync(`
    SELECT *
    FROM expense_templates
    WHERE is_synced = 0
  `);
};

export const markTemplatesAsSynced = async (db, uuids) => {
  if (!uuids.length) return;
  const placeholders = uuids.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE expense_templates
      SET is_synced = 1
      WHERE uuid IN (${placeholders})`,
    uuids
  );
};

export const hardDeleteTransactionTemplate = async (db, uuid) => {
  await db.runAsync(
    `
    DELETE FROM expense_templates
    WHERE uuid = ?
    `,
    [uuid]
  );
};
