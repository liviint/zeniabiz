import { getSyncCursor, saveSyncCursor } from "./syncState";
import { api } from "@/api";

// -------------------------
// MODEL FIELD WHITELIST
// -------------------------
const MODEL_CONFIG = {
  sales: {
    fields: [
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
    conflictKeys: ["id"],
  },

  sale_items: {
    fields: [
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
    conflictKeys: ["id"],
  },

  expenses: {
    fields: [
      "id",
      "company",
      "amount",
      "payee",
      "title",
      "date",
      "category_id",
      "created_at",
      "updated_at",
      "deleted_at",
    ],
    conflictKeys: ["id"],
  },

  products: {
    fields: [
      "id",
      "company",
      "name",
      "selling_price",
      "cost_price",
      "created_at",
      "updated_at",
      "deleted_at",
    ],
    conflictKeys: ["id"],
  },

  expense_categories: {
    fields: [
      "id",
      "company",
      "name",
      "color",
      "icon",
      "created_at",
      "updated_at",
      "deleted_at",
    ],
    conflictKeys: ["company", "name"]
  },

  expense_templates: {
    fields: [
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
    conflictKeys: ["id"],
  },

  inventory_batches: {
    fields: [
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
    conflictKeys: ["id"],
  },

  inventory_movements: {
    fields: [
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
    conflictKeys: ["id"],
  },
};

// -------------------------
// PULL SYNC
// -------------------------
export async function pullServerChanges(db, model, endpoint) {
  const state = await getSyncCursor(db, model);

  const currentCursor = state?.cursor || 0;

  const res = await api.get(endpoint, {
    params: {
      cursor: currentCursor,
    },
  });

  if (!res.data) {
    return false;
  }

  let {
    data,
    cursor: nextCursor,
    has_more,
  } = res.data;


  // 🔥 apply incoming events
  
  await applyServerChanges(db, model, data|| []);

  // 🔥 save latest revision cursor
  if (nextCursor !== undefined && nextCursor !== null) {
    await saveSyncCursor(db, model, nextCursor);
  }

  // 🔥 continue pulling until exhausted
  if (has_more) {
    return await pullServerChanges(
      db,
      model,
      endpoint
    );
  }

  return true;
}

// -------------------------
// APPLY SERVER CHANGES
// -------------------------
export async function applyServerChanges(db, model, items) {
  if(model === "sale_items") console.log(items, "hello  sale items current cursor");
  const config = MODEL_CONFIG[model];

  if (!config) {
    throw new Error(`No schema defined for model: ${model}`);
  }

  const { fields, conflictKeys = ["id"] } = config;

  for (const event of items) {
    const item = event.payload ?? event;

    if (item.deleted_at) {
      await db.runAsync(
        `UPDATE ${model} SET deleted_at = ? WHERE id = ?`,
        [item.deleted_at, item.id]
      );
      continue;
    }

    if (model === "sale_items") {
      item.sale_id = item.sale_id ?? item.sale;
    }

    if (model === "expenses") {
      item.category_id = item.category_id ?? item.category;
    }

    if (model === "expense_templates") {
      item.category_id = item.category_id ?? item.category;
    }

    const filtered = {};
    for (const f of fields) {
      filtered[f] = item[f] ?? null;
    }

    const columns = Object.keys(filtered).join(", ");
    const placeholders = Object.keys(filtered).map(() => "?").join(", ");
    const values = Object.values(filtered);

    const updateClause = Object.keys(filtered)
      .filter((k) => !conflictKeys.includes(k))
      .map((k) => `${k} = excluded.${k}`)
      .join(", ");

    const conflictClause = `(${conflictKeys.join(", ")})`;

    try {
      await db.runAsync(
        `
        INSERT INTO ${model} (${columns})
        VALUES (${placeholders})
        ON CONFLICT ${conflictClause} DO UPDATE SET
          ${updateClause}
        `,
        values
      );
  
    } catch (error) {
      console.log(error,"hello apply server changes error")
    }

  }

}