// sync/api.js

export async function sendBulkSync(model, items) {
  const res = await fetch(`/api/${model}/bulk_sync/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ items })
  })

  if (!res.ok) {
    throw new Error("Sync failed")
  }

  return res.json()
}