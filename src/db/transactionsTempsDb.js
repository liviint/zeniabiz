import uuid from "react-native-uuid";

const newUuid = () => uuid.v4();
export const upsertTransactionTemplate = async (db, template) => {
  const {

    title,
    amount,
    type,

    category = null,
    category_uuid = null,

    payee = null,
    note = null,

    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString(),

    deleted_at = null,
    is_synced = 0,
  } = template;
  let uuid = template.uuid || newUuid()

  await db.runAsync(
    `
    INSERT INTO transaction_templates (
      uuid,
      title,
      amount,
      type,
      category,
      category_uuid,
      payee,
      note,
      created_at,
      updated_at,
      deleted_at,
      is_synced
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    ON CONFLICT(uuid) DO UPDATE SET
      title = excluded.title,
      amount = excluded.amount,
      type = excluded.type,
      category = excluded.category,
      category_uuid = excluded.category_uuid,
      payee = excluded.payee,
      note = excluded.note,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      is_synced = excluded.is_synced
    `,
    [
      uuid,
      title,
      amount,
      type,
      category,
      category_uuid,
      payee,
      note,
      created_at,
      updated_at,
      deleted_at,
      is_synced,
    ]
  );

  return uuid;
};

export const syncTemplatesFromApi = async (db, templates = []) => {
  if (!Array.isArray(templates) || templates.length === 0) {
    return;
  }

  for (const tpl of templates) {
    const {
      uuid,
      title,
      amount,
      type,
      category,
      category_uuid,
      payee,
      note,
      created_at,
      updated_at,
      deleted_at,
    } = tpl;

    if (deleted_at) {
      await db.runAsync(
        `
        UPDATE transaction_templates
        SET deleted_at = ?, updated_at = ?, is_synced = 1
        WHERE uuid = ?
        `,
        [deleted_at, updated_at, uuid]
      );
      continue;
    }

    await db.runAsync(
      `
      INSERT INTO transaction_templates (
        uuid,
        title,
        amount,
        type,
        category,
        category_uuid,
        payee,
        note,
        created_at,
        updated_at,
        is_synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        amount = excluded.amount,
        type = excluded.type,
        category = excluded.category,
        category_uuid = excluded.category_uuid,
        payee = excluded.payee,
        note = excluded.note,
        updated_at = excluded.updated_at,
        deleted_at = NULL,
        is_synced = 1
      `,
      [
        uuid,
        title,
        amount,
        type,
        category,
        category_uuid,
        payee,
        note,
        created_at,
        updated_at,
      ]
    );
  }

  console.log("✅ Templates synced from API");
};


export const getTransactionTemplates = async (db) => {
  return await db.getAllAsync(`
    SELECT *
    FROM transaction_templates
    WHERE deleted_at IS NULL
    ORDER BY usage_count DESC, updated_at DESC
  `);
};

export const getTransactionTemplateByUuid = async (db, uuid) => {
  return await db.getFirstAsync(
    `
    SELECT *
    FROM transaction_templates
    WHERE uuid = ?
      AND deleted_at IS NULL
    `,
    [uuid]
  );
};

export const deleteTransactionTemplate = async (db, uuid) => {
  await db.runAsync(
    `
    UPDATE transaction_templates
    SET deleted_at = datetime('now'),
        updated_at = datetime('now'),
        is_synced = 0
    WHERE uuid = ?
    `,
    [uuid]
  );
};

export const restoreTransactionTemplate = async (db, uuid) => {
  await db.runAsync(
    `
    UPDATE transaction_templates
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
    UPDATE transaction_templates
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
    FROM transaction_templates
    WHERE is_synced = 0
  `);
};

export const markTemplatesAsSynced = async (db, uuids) => {
  if (!uuids.length) return;
  const placeholders = uuids.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE transaction_templates
      SET is_synced = 1
      WHERE uuid IN (${placeholders})`,
    uuids
  );
};

export const hardDeleteTransactionTemplate = async (db, uuid) => {
  await db.runAsync(
    `
    DELETE FROM transaction_templates
    WHERE uuid = ?
    `,
    [uuid]
  );
};
