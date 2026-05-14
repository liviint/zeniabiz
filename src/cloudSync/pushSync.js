import { getPendingItems, markAsSynced, markAsFailed } from "./queue"
import { sendBulkSync } from "./api"


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

export async function pushLocalChanges(db) {
  let pending = await getPendingItems(db);
  console.log(pending,"hello pending...")
  if (pending.length === 0) return true;

  for (const model of SYNC_ORDER) {
    // 🔥 regroup every iteration using latest state
    const grouped = {};

    for (const item of pending) {
      if (!grouped[item.model]) {
        grouped[item.model] = [];
      }
      grouped[item.model].push(item);
    }

    if (grouped[model] && grouped[model].length > 0) {
      const success = await syncModel(db, model, grouped[model]);

      // 🔥 CRITICAL: stop everything if failed
      if (!success) {
        console.log("Stopping sync due to failure in:", model);
        return false
      }
  }

    // 🔥 refresh pending after syncing this model
    pending = await getPendingItems(db);
  }

  // ⚠️ handle any other models not in SYNC_ORDER
  const remainingGrouped = {};

  for (const item of pending) {
    if (!SYNC_ORDER.includes(item.model)) {
      if (!remainingGrouped[item.model]) {
        remainingGrouped[item.model] = [];
      }
      remainingGrouped[item.model].push(item);
    }
  }

  for (const model in remainingGrouped) {
    const items = remainingGrouped[model];
    const success = await syncModel(db, model, items);
      if (!success) {
        console.log("Stopping sync due to failure in:", model);
        return false
      }
    
  }
  return true
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
  console.log("✅ accepted:", data.accepted?.length || 0);
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


