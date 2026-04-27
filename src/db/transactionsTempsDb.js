import uuid from "react-native-uuid";
import { syncEvent } from "../cloudSync/syncEvent";

const newUuid = () => uuid.v4();

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

  const templateId = id || newUuid();
  const now = new Date().toISOString();

  await db.runAsync(
    `
    INSERT INTO expense_templates (
      id,
      title,
      amount,
      category,
      category_id,
      payee,
      note,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

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

  // 🔥 SYNC EVENT (after local success)
  await syncEvent(db, {
    model: "expense_templates",
    operation: "upsert",
    payload: {
      id: templateId,
      title,
      amount,
      category,
      category_id,
      payee,
      note,
      updated_at: now
    }
  });

  return templateId;
};

export const getTransactionTemplates = async (db) => {
  return await db.getAllAsync(`
    SELECT *
    FROM expense_templates
    WHERE deleted_at IS NULL
    ORDER BY usage_count DESC, updated_at DESC
  `);
};

export const getTransactionTemplateByid = async (db, id) => {
  return await db.getFirstAsync(
    `
    SELECT *
    FROM expense_templates
    WHERE id = ?
    `,
    [id]
  );
};

export const deleteTransactionTemplate = async (db, id) => {
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
      deleted_at: now
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
