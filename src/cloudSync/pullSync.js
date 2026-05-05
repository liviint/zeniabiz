import { getSyncCursor, saveSyncCursor } from "./syncState";
import { api } from "@/api";

// -------------------------
// MODEL FIELD WHITELIST
// -------------------------
const MODEL_FIELDS = {
  sales: [
    "id",
    "company",
    "title",
    "note",
    "amount",
    "date",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  sale_items: [
    "id",
    "company",
    "created_by",
    "updated_by",

    "sale_id",
    "product_id",

    "quantity",
    "price",
    "cost_price",

    "created_at",
    "updated_at",
    "deleted_at",
  ],
  expenses: [
    "id",
    "company",
    "amount",
    "title",
    "date",
    "category_id",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  products: [
    "id",
    "company",
    "name",
    "selling_price",
    "cost_price",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  expense_categories: [
    "id",
    "company",
    "name",
    "color",
    "icon",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  expense_templates: [
    "id",
    "company",
    "created_by",
    "updated_by",

    "title",
    "amount",
    "type",

    "category",
    "category_id",
    "usage_count",

    "payee",
    "note",

    "created_at",
    "updated_at",
    "deleted_at",
  ],
  inventory_batches: [
    "id",
    "company",
    "product_id",
    "quantity_remaining",
    "cost_price",
    "selling_price",
    "date",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  inventory_movements: [
    "id",
    "company",
    "product_id",
    "unit_cost",
    "quantity",
    "type",
    "reference_id",
    "date",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
};

// -------------------------
// PULL SYNC
// -------------------------
export async function pullServerChanges(db, model, endpoint) {
  const state = await getSyncCursor(db, model);

  const res = await api.get(endpoint, {
    params: {
      cursor: state.cursor ? JSON.stringify(state.cursor) : null,
      version: state.version,
    },
  });

  // console.log(res.data,"hello res.data")

  if (!res.data) return false;

  const { data, cursor: nextCursor, has_more } = res.data;

  await applyServerChanges(db, model, data || []);

  if (nextCursor) {
    await saveSyncCursor(db, model, nextCursor);
  }

  if (has_more) {
    return pullServerChanges(db, model, endpoint);
  }

  return true;
}

// -------------------------
// APPLY SERVER CHANGES
// -------------------------
export async function applyServerChanges(db, model, items) {
  const fields = MODEL_FIELDS[model];

  if (!fields) {
    throw new Error(`No schema defined for model: ${model}`);
  }

  for (const item of items) {
    // -------------------------
    // DELETE SYNC
    // -------------------------
    if (item.deleted_at) {
      await db.runAsync(
        `UPDATE ${model} SET deleted_at = ? WHERE id = ?`,
        [item.deleted_at, item.id]
      );
      continue;
    }

    // -------------------------
    // FILTER SAFE FIELDS ONLY
    // -------------------------
    const filtered = {};
    for (const f of fields) {
      filtered[f] = item[f] ?? null;
    }

    const columns = Object.keys(filtered).join(", ");
    const placeholders = Object.keys(filtered).map(() => "?").join(", ");
    const values = Object.values(filtered);

    // -------------------------
    // UPSERT WITH CONFLICT SAFETY
    // -------------------------
    await db.runAsync(
      `
      INSERT INTO ${model} (${columns})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${Object.keys(filtered)
          .filter((k) => k !== "id")
          .map(
            (k) => `
              ${k} = CASE 
                WHEN excluded.updated_at >= ${model}.updated_at 
                THEN excluded.${k} 
                ELSE ${model}.${k} 
              END
            `
          )
          .join(", ")}
      `,
      values
    );
  }
}