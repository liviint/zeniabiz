import { getPendingItems, markAsSynced, markAsFailed } from "./queue"
import { sendBulkSync } from "./api"

export async function runSync(db) {
  const pending = await getPendingItems(db)

  if (pending.length === 0) return

  const grouped = {}

  for (const item of pending) {
    if (!grouped[item.model]) {
      grouped[item.model] = []
    }
    grouped[item.model].push(item)
  }

  for (const model in grouped) {
    await syncModel(db, model, grouped[model])
  }
}

// sync/worker.js

async function syncModel(db, model, items) {
  const payload = items.map(item => ({
    ...item.payload,
    client_request_id: item.client_request_id
  }))

  const res = await sendBulkSync(model, payload)

  if (!res.ok) {
    console.log("Sync failed:", res.type)

    // 🔁 retry ALL items
    for (const item of items) {
      await markAsFailed(db, item)
    }

    return
  }

  const data = res.data

  for (const accepted of data.accepted) {
    await markAsSynced(db, accepted.client_request_id)
  }

  for (const rejected of data.rejected) {
    const failedItem = items.find(
      i => i.client_request_id === rejected.client_request_id
    )

    if (failedItem) {
      await markAsFailed(db, failedItem)
    }
  }
}