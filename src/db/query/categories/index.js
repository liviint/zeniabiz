import { getActiveContextSync, newUuid, withTransaction } from "../../utils";
import { enqueueSync } from "../../../cloudSync/syncEvent";

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

export const upsertCategory = async (db, { id, name, color, icon }) => {
  return withTransaction(db,async() => {
    const { company, user_id } = getActiveContextSync();

    if (!company || !user_id) {
      throw new Error("Missing active company or user context");
    }

    const now = new Date().toISOString();
    const categoryId = id || newUuid();


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

    await enqueueSync(db,{
      model:"expense_categories",
      record_id:categoryId,
      operation:"upsert",
    })

    return categoryId;
  })
};

export const deleteCategory = async (db, id) => {
  return withTransaction(db,async() => {
    const { company, user_id } = getActiveContextSync();

    if (!company || !user_id) {
      throw new Error("Missing active company or user context");
    }

    const now = new Date().toISOString();

    const usage = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM expenses WHERE category_id = ?`,
      [id]
    );

    if (usage.count > 0) {
      throw new Error("Cannot delete category in use");
    }

 
    await db.runAsync(
      `
      UPDATE expense_categories
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      `,
      [now, now, id]
    );

    await enqueueSync(db,{
      model:"expense_categories",
      record_id:id,
      operation:"delete",
    })

  })
};