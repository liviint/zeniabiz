import { getSyncCursor, saveSyncCursor } from "./syncState";
import { api } from "@/api";


const SYNC_ORDER = [
  "expense_categories", 
  "products",
  "inventory_batches",
  "inventory_movements",
  "expenses",
  "expense_templates",
  "sales",
  "sale_items", 
];


export async function pullServerChanges(db, model, endpoint) {
  const cursor = await getSyncCursor(db, model);

  const res = await api.get(endpoint, {
    params: {
      cursor: cursor ? JSON.stringify(cursor) : null,
    },
  });

  if (!res.data) return false;

  const { data, cursor: nextCursor, has_more } = res.data;

  // 1. apply changes locally
  await applyServerChanges(db, model, data[model] || []);

  // 2. update cursor
  if (nextCursor) {
    await saveSyncCursor(db, model, nextCursor);
  }

  // 3. if more → recursively continue
  if (has_more) {
    return pullServerChanges(db, model, endpoint);
  }

  return true;
}


export async function applyServerChanges(db, model, items) {
  for (const item of items) {
    if (item.deleted_at) {
      await db.runAsync(
        `UPDATE ${model} SET deleted_at = ? WHERE id = ?`,
        [item.deleted_at, item.id]
      );
      continue;
    }

    const columns = Object.keys(item).join(", ");
    const placeholders = Object.keys(item).map(() => "?").join(", ");
    const values = Object.values(item);

    await db.runAsync(
      `
      INSERT INTO ${model} (${columns})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${Object.keys(item)
          .filter(k => k !== "id")
          .map(k => `${k} = excluded.${k}`)
          .join(", ")}
      `,
      values
    );
  }
}


