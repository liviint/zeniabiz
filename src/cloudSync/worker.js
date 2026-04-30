import { getPendingItems, markAsSynced, markAsFailed } from "./queue"
import { sendBulkSync } from "./api"


const SYNC_ORDER = [
  "expense_categories", 
  "products",
  "inventory_batches",
  "inventory_movements",
  "expenses",
];

export async function runSync(db) {
  let pending = await getPendingItems(db);

  if (pending.length === 0) return;

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
      return;
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

  console.log(
    "Models:",
    {
      [model]: items.length
    }
  );

  console.log(
    "Sample:",
    items.slice(0, 3).map(i => ({
      model: i.model,
      id: i.payload?.id,
    }))
  );

  await syncModel(db, model, items);
}
}


// sync/worker.js

async function syncModel(db, model, items) {
  const payload = items.map(item => ({
    ...item.payload,
    client_request_id: item.client_request_id
  }));

  const res = await sendBulkSync(model, payload);

  if (res.status !== 200 || !res.data) {
    console.log("❌ Sync failed:", model);
    console.log("Status:", res.status);
    console.log("Response:", res.data);
    return false;
  }

  const data = res.data;

  for (const accepted of data.accepted) {
    await markAsSynced(db, accepted.client_request_id);
  }

  for (const rejected of data.rejected) {
    const failedItem = items.find(
      i => i.client_request_id === rejected.client_request_id
    );

    if (!failedItem) continue;

    const errorText = JSON.stringify(rejected.error || "");

    const isDependencyError =
      errorText.includes("Invalid pk") ||
      errorText.includes("does not exist");

    if (isDependencyError) {
      console.log("Dependency error, will retry:", rejected.id);
      continue;
    }

    await markAsFailed(db, failedItem);
  }

  return true; // ✅ success
}

