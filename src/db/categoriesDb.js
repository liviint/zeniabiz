import uuid from "react-native-uuid";
import { DEFAULT_CATEGORIES } from "../../utils/categoriesSeeder";

const newUuid = () => uuid.v4();

export const seedCategoriesIfEmpty = async (db,apiData=[]) => {
  const rows = await db.getAllAsync(
    "SELECT COUNT(*) as count FROM finance_categories"
  );
  if (rows[0].count > 0) return;

  let defaults = apiData?.length ? apiData : DEFAULT_CATEGORIES

  for (const cat of defaults) {
    await db.runAsync(
      `INSERT INTO finance_categories 
        (uuid, name, type, color, icon, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [newUuid(), cat.name, cat.type, cat.color, cat.icon]
    );
  }

  console.log("✅ Default categories seeded");
};

/**
 * Get all categories or a single category by UUID
 */
export const getCategories = async (db, uuid = null) => {
  if (uuid) {
    const rows = await db.getAllAsync(
      `
      SELECT *
      FROM finance_categories
      WHERE uuid = ? AND deleted_at IS NULL
      LIMIT 1
      `,
      [uuid]
    );
    return rows[0] || null;
  }

  return db.getAllAsync(
    `
    SELECT *
    FROM finance_categories
    WHERE deleted_at IS NULL
    ORDER BY name ASC
    `
  );
};

export const getUnsyncedCategories = (db) => {
  return db.getAllAsync(
    `
    SELECT *
    FROM finance_categories
    WHERE is_synced = 0
    `
  );
}


export const upsertCategory = async (db, { id = null, uuid, name, type, color, icon }) => {
  const now = new Date().toISOString();

  try {
    await db.runAsync(
      `
      INSERT INTO finance_categories (
        id,
        uuid,
        name,
        type,
        color,
        icon,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        color = excluded.color,
        icon = excluded.icon,
        updated_at = excluded.updated_at
      `,
      [id, uuid || newUuid(), name.trim(), type, color, icon, now, now]
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
export const deleteCategory = async (db, uuid) => {
  await db.runAsync(
    `
    UPDATE finance_categories
    SET deleted_at = datetime('now'), updated_at = datetime('now')
    WHERE uuid = ?
    `,
    [uuid]
  );
};

/**
 * Get categories by type (income/expense)
 */
export const getCategoriesByType = async (db, type) => {
  return db.getAllAsync(
    `
    SELECT *
    FROM finance_categories
    WHERE type = ? AND deleted_at IS NULL
    ORDER BY name ASC
    `,
    [type]
  );
};

/**
 * Check if a category exists by UUID
 */
export const categoryExists = async (db, uuid) => {
  const row = await db.getFirstAsync(
    `
    SELECT 1
    FROM finance_categories
    WHERE uuid = ? AND deleted_at IS NULL
    LIMIT 1
    `,
    [uuid]
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

