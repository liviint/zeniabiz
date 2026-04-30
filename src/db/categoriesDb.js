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


    await db.runAsync("BEGIN TRANSACTION");

    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        `INSERT INTO expense_categories 
          (id, name, color, icon, created_at, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          cat.id,   
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

export async function syncDefaultCategories(db) {
  const alreadySynced = await db.getFirstAsync(
    `SELECT value FROM app_settings WHERE key = 'default_categories_synced'`
  );

  if (alreadySynced) return;
  const now = new Date().toISOString();
  for (const cat of DEFAULT_CATEGORIES) {
    await syncEvent(db, {
      model: "expense_categories",
      operation: "upsert",
      payload: {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        company: getActiveContextSync().company,
        created_at: now,
        updated_at: now,
      }
    });
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
    ["default_categories_synced", "1"]
  );
}

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
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        color = excluded.color,
        icon = excluded.icon,
        updated_at = excluded.updated_at
      `,
      [
        categoryId,
        company,
        name?.trim(),
        color,
        icon,
        now,
        now,
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