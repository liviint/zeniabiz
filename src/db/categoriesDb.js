import uuid from "react-native-uuid";
import { DEFAULT_CATEGORIES } from "../../utils/categoriesSeeder";

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


export const upsertCategory = async (
  db,
  { id, name, color, icon }
) => {
  const now = new Date().toISOString();
  const categoryId = id || newUuid();

  try {
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

    console.log("✅ Category upserted locally");
    return categoryId;
  } catch (error) {
    console.error("❌ Failed to upsert category:", error);
    throw error;
  }
};


export const deleteCategory = async (db, id) => {
  const usage = await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM expenses WHERE category_id = ?`,
    [id]
  );

  if (usage.count > 0) {
    throw new Error("Cannot delete category in use");
  }

  await db.runAsync(
    `DELETE FROM expense_categories WHERE id = ?`,
    [id]
  );
};

