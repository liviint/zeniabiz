import uuid from "react-native-uuid";
import { DEFAULT_CATEGORIES } from "../../utils/categoriesSeeder";
import {syncEvent} from "../cloudSync/syncEvent"
import { getActiveContextSync } from "./utils";

const newUuid = () => uuid.v4();

export const seedCategoriesIfEmpty = async (db, apiData = []) => {
  try {
    const rows = await db.getAllAsync(
      "SELECT COUNT(*) AS count FROM expense_categories"
    );

    if (rows[0].count > 0) return;

    const categoriesToSeed = apiData.length
      ? apiData
      : DEFAULT_CATEGORIES;

    await db.runAsync("BEGIN TRANSACTION");

    for (const cat of categoriesToSeed) {
      await db.runAsync(
        `INSERT INTO expense_categories 
          (id, name, color, icon, created_at, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          newUuid(),
          cat.name,
          cat.color,
          cat.icon,
        ]
      );
    }

    await db.runAsync("COMMIT");
    console.log("✅ Default categories seeded");
  } catch (error) {
    await db.runAsync("ROLLBACK");
    console.error("❌ Failed to seed categories:", error);
  }
};

export const getCategories = async (db, id = null) => {
  if (id) {
    const rows = await db.getAllAsync(
      `
      SELECT *
      FROM expense_categories
      WHERE id = ? 
      LIMIT 1
      `,
      [id]
    );
    return rows[0] || null;
  }

  return db.getAllAsync(
    `
    SELECT *
    FROM expense_categories
    WHERE deleted_at IS NULL
    ORDER BY name ASC
    `
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
  const { company_id, user_id } = getActiveContextSync();

  if (!company_id || !user_id) {
    throw new Error("Missing active company or user context");
  }

  const now = new Date().toISOString();
  const categoryId = id || newUuid();

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ Local write
    await db.runAsync(
      `
      INSERT INTO expense_categories (
        id,
        name,
        color,
        icon,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        color = excluded.color,
        icon = excluded.icon,
        updated_at = excluded.updated_at
      `,
      [
        categoryId,
        name?.trim(),
        color,
        icon,
        now,
        now,
      ]
    );

    await db.runAsync("COMMIT");

    // 2️⃣ Sync event (after commit only)
    syncEvent(db, {
      model: "expense_categories",
      operation: "upsert",
      payload: {
        id: categoryId,

        company_id,
        user_id,

        name: name?.trim(),
        color,
        icon,

        created_at: now,
        updated_at: now,
        deleted_at: null
      }
    })
    .catch(err => {
  console.error("Sync failed:", err);
});

    return categoryId;

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
};

export const deleteCategory = async (db, id) => {
  const now = new Date().toISOString();

  const usage = await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM expenses WHERE category_id = ?`,
    [id]
  );

  if (usage.count > 0) {
    throw new Error("Cannot delete category in use");
  }

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 🗑 Soft delete
    await db.runAsync(
      `
      UPDATE expense_categories
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      `,
      [now, now, id]
    );

    await db.runAsync("COMMIT");

    // 🔥 SYNC EVENT (after commit)
    syncEvent(db, {
      model: "expense_categories",
      operation: "delete",
      payload: {
        id,
        deleted_at: now
      }
    })
    .catch(err => {
  console.error("Sync failed:", err);
});

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
};

