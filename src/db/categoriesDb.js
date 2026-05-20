import uuid from "react-native-uuid";
import {syncEvent} from "../cloudSync/syncEvent"
import { getActiveContextSync } from "./utils";

const newUuid = () => uuid.v4();

export const getCategoryById = async (db, id) => {
  const { company } = getActiveContextSync();

  return db.getFirstAsync(
    `
    SELECT *
    FROM expense_categories
    WHERE id = ?
    AND company = ?
    AND deleted_at IS NULL
    LIMIT 1
    `,
    [id, company]
  );
};

export const getCategories = async (db) => {
  const { company } = getActiveContextSync();

  return db.getAllAsync(
    `
    SELECT *
    FROM expense_categories
    WHERE company = ?
    AND deleted_at IS NULL
    ORDER BY name ASC
    `,
    [company]
  );
};

export const getUnsyncedCategories = (db) => {
  return db.getAllAsync(
    `
    SELECT *
    FROM expense_categories
    WHERE is_synced = 0
    `
  );
}

export const upsertCategory = async (db, { id, name, color, icon }) => {
  const { company, user_id } = getActiveContextSync();

  if (!company || !user_id) {
    throw new Error("Missing active company or user context");
  }

  const now = new Date().toISOString();
  const categoryId = id || newUuid();

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ Local DB write (idempotent)
    await db.runAsync(
      `
      INSERT INTO expense_categories (
        id,
        company,
        name,
        color,
        icon,
        created_at,
        updated_at,
        deleted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(company, name) DO UPDATE SET
        name = excluded.name,
        color = excluded.color,
        icon = excluded.icon,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
      `,
      [
        categoryId,
        company,
        name?.trim(),
        color,
        icon,
        now,
        now,
        null
      ]
    );

    await db.runAsync("COMMIT");

    // 2️⃣ Sync event (AFTER commit ONLY)
    syncEvent(db, {
      model: "expense_categories",
      operation: "upsert",
      payload: {
        id: categoryId,
        company,
        created_by: user_id,
        updated_by: user_id,

        name: name?.trim(),
        color,
        icon,

        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    }).catch((err) => {
      console.error("Category sync enqueue failed:", err);
    });

    return categoryId;
  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
};

export const deleteCategory = async (db, id) => {
  const { company, user_id } = getActiveContextSync();

  if (!company || !user_id) {
    throw new Error("Missing active company or user context");
  }

  const now = new Date().toISOString();

  // 🔎 check usage first
  const usage = await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM expenses WHERE category_id = ?`,
    [id]
  );

  if (usage.count > 0) {
    throw new Error("Cannot delete category in use");
  }

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 🗑 soft delete locally
    await db.runAsync(
      `
      UPDATE expense_categories
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      `,
      [now, now, id]
    );

    await db.runAsync("COMMIT");

    // 🔥 SYNC EVENT (after commit ONLY)
    syncEvent(db, {
      model: "expense_categories",
      operation: "delete",
      payload: {
        id,
        company,
        created_by: user_id,
        updated_by: user_id,

        deleted_at: now,
      },
    }).catch((err) => {
      console.error("Category delete sync failed:", err);
    });

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
};