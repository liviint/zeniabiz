import { getSyncCursor, saveSyncCursor } from "./syncState";
import { api } from "@/api";

// -------------------------
// MODEL FIELD WHITELIST
// -------------------------
const MODEL_CONFIG = {
  customers: {
    fields: [
      "id",
      "company",
      "created_by",
      "updated_by",
      "name",
      "phone",
      "note",
      "created_at",
      "updated_at",
      "deleted_at",
    ],
    conflictKeys: ["id"],
  },
  sales: {
    fields: [
      "id",
      "company",
      "created_by",
      "updated_by",
      "title",
      "note",
      "amount",
      "customer_id",
      "total_amount",
      "amount_paid",
      "balance_due",
      "is_credit_sale",
      "discount",
      "discount_type",
      "payment_status",
      "due_date",
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
      "purchase_movement_id",
      "batch_id",
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
      "minimum_quantity",
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
      "created_by",
      "updated_by",
      "product_id",
      "quantity_on_hand",
      "cost_price",
      "selling_price",
      "batch_number",
      "expiry_date",
      "purchase_date",
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
      "created_by",
      "updated_by",
      "product_id",
      "unit_cost",
      "selling_price",
      "quantity",
      "type",
      "reason",
      "reference_id",
      "batch_id",
      "date",
      "processed_at",
      "created_at",
      "updated_at",
      "deleted_at",
    ],
    conflictKeys: ["id"],
  },

  payments: {
    fields: [
      "id",
      "company",
      "created_by",
      "updated_by",
      "sale_id",
      "customer_id",
      "payment_type",
      "amount",
      "payment_method",
      "note",
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
  console.log(model,items,"hello model items")
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

    if (model === "payments") {
      item.sale_id = item.sale_id ?? item.sale;
      item.customer_id = item.customer_id ?? item.customer;
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