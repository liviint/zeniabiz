import { getPendingItems, markAsSynced, markAsFailed } from "./queue"
import { sendBulkSync } from "./api"


const SYNC_ORDER = [
  "expense_categories", 
  "products",
  "inventory_batches",
  "inventory_movements",
  "expenses",
  "expense_templates",
  "customers",
  "sales",
  "sale_items", 
  "payments",
];

export async function pushLocalChanges(db) {
  let pending = await getPendingItems(db);

  if (pending.length === 0) {
    return true;
  }

  const grouped = pending.reduce((acc, item) => {
    if (!acc[item.model]) {
      acc[item.model] = [];
    }

    acc[item.model].push(item);
    return acc;
  }, {});

  // sync ordered models first
  for (const model of SYNC_ORDER) {
    const items = grouped[model];

    if (!items?.length) continue;

    const success = await syncModel(
      db,
      model,
      items
    );

    if (!success) {
      console.log(
        "Stopping sync due to failure in:",
        model
      );
      return false;
    }
  }

  // sync any models not explicitly ordered
  for (const [model, items] of Object.entries(grouped)) {
    if (SYNC_ORDER.includes(model)) continue;

    const success = await syncModel(
      db,
      model,
      items
    );

    if (!success) {
      console.log(
        "Stopping sync due to failure in:",
        model
      );
      return false;
    }
  }

  return true;
}

async function syncModel(db, model, items) {
  const payload = items.map(item => ({
    ...item.payload,
    client_request_id: item.client_request_id
  }));

  const res = await sendBulkSync(model, payload);

  // ❌ handle wrapper failure
  if (!res.ok) {
    console.log(`❌ Sync failed: ${model}`);
    console.log("Type:", res.type);
    console.log("Error:", res.error);
    return false;
  }

  const data = res.data;

  console.log(`📦 Sync response: ${model}`);
  console.log("accepted:", data.accepted?.length || 0);
  console.log("❌ rejected:", data.rejected?.length || 0);

  for (const accepted of data.accepted || []) {
    await markAsSynced(db, accepted.client_request_id);
  }

  for (const rejected of data.rejected || []) {
    const failedItem = items.find(
      i => i.client_request_id === rejected.client_request_id
    );

    if (!failedItem) continue;

    const errorText = JSON.stringify(rejected.error || "");

    const isDependencyError =
      errorText.includes("Invalid pk") ||
      errorText.includes("does not exist");

    if (isDependencyError) {
      console.log("🔁 Dependency retry:", rejected.client_request_id);
      continue;
    }

    await markAsFailed(db, failedItem);
  }

  return true;
}


