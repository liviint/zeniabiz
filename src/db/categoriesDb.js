import uuid from "react-native-uuid";
import { DEFAULT_CATEGORIES } from "../../utils/categoriesSeeder";

const newUuid = () => uuid.v4();

export const seedCategoriesIfEmpty = async (db, apiData = []) => {
  try {
    const rows = await db.getAllAsync(
      "SELECT COUNT(*) AS count FROM transaction_categories"
    );
    if (rows[0].count > 0) return;

    const categoriesToSeed = apiData.length ? apiData : DEFAULT_CATEGORIES;

    // Begin transaction
    await db.runAsync("BEGIN TRANSACTION");

    for (const cat of categoriesToSeed) {
      await db.runAsync(
        `INSERT INTO transaction_categories 
          (id, name, type, color, icon, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [newUuid(), cat.name, cat.type, cat.color, cat.icon]
      );
    }

    await db.runAsync("COMMIT");
    console.log("✅ Default categories seeded");
  } catch (error) {
    await db.runAsync("ROLLBACK");
    console.error("❌ Failed to seed categories:", error);
  }
};

/**
 * Get all categories or a single category by UUID
 */
export const getCategories = async (db, id = null) => {
  if (id) {
    const rows = await db.getAllAsync(
      `
      SELECT *
      FROM transaction_categories
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
    FROM transaction_categories
    WHERE deleted_at IS NULL
    ORDER BY name ASC
    `
  );
};

export const getUnsyncedCategories = (db) => {
  return db.getAllAsync(
    `
    SELECT *
    FROM transaction_categories
    WHERE is_synced = 0
    `
  );
}


export const upsertCategory = async (db, {id,name, type, color, icon }) => {
  const now = new Date().toISOString();
  id = id || newUuid() 
  try {
    await db.runAsync(
      `
      INSERT INTO transaction_categories (
        id,
        name,
        type,
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
      [id, name.trim(), type, color, icon, now, now]
    );
    console.log("✅ Category upserted locally");
  } catch (error) {
    console.error("❌ Failed to upsert category:", error);
    throw error;
  }
};

/**
 * Soft-delete a category by UUID
 */
export const deleteCategory = async (db, id) => {
  await db.runAsync(
    `
    UPDATE transaction_categories
    SET deleted_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
    `,
    [id]
  );
};

/**
 * Get categories by type (income/expense)
 */
export const getCategoriesByType = async (db, type) => {
  return db.getAllAsync(
    `
    SELECT *
    FROM transaction_categories
    WHERE type = ? AND deleted_at IS NULL
    ORDER BY name ASC
    `,
    [type]
  );
};

/**
 * Check if a category exists by UUID
 */
export const categoryExists = async (db, id) => {
  const row = await db.getFirstAsync(
    `
    SELECT 1
    FROM transaction_categories
    WHERE uuid = ? AND deleted_at IS NULL
    LIMIT 1
    `,
    [id]
  );
  return !!row;
};

export const syncCategoriesFromApi = async (db, remoteCategories = []) => {
  if (!remoteCategories || !Array.isArray(remoteCategories)) return;

  for (const cat of remoteCategories) {
    try {
      await upsertCategory(db, {
        uuid: cat.uuid,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
      });
    } catch (err) {
      console.error(`❌ Failed to sync category ${cat.uuid}:`, err);
    }
  }

  console.log(`✅ Synced ${remoteCategories.length} categories from API`);
};

