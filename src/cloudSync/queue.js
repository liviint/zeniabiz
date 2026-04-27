import {getNextRetryTime} from "./utils"

export async function addToQueue(db, event) {
  await db.runAsync(
    `INSERT INTO sync_queue 
    (id, model, operation, payload, client_request_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.model,
      event.operation,
      JSON.stringify(event.payload),
      event.client_request_id,
      event.status,
      event.created_at,
      event.created_at
    ]
  );
}

export async function getPendingItems(db) {
  const rows = await db.getAllAsync(`
    SELECT * FROM sync_queue 
    WHERE status = 'pending'
    AND (
      next_retry_at IS NULL 
      OR datetime(next_retry_at) <= datetime('now')
    )
    ORDER BY created_at ASC
  `)

  return rows.map(row => ({
    ...row,
    payload: JSON.parse(row.payload)
  }))
}

export async function markAsSynced(db, client_request_id) {
  await db.runAsync(
    `UPDATE sync_queue 
      SET status = 'synced', updated_at = datetime('now') 
      WHERE client_request_id = ?`,
    [client_request_id]
  )
}

export async function markAsFailed(db, item) {
  const nextRetry = getNextRetryTime(item.retry_count || 0)

  await db.runAsync(`
    UPDATE sync_queue 
    SET 
      retry_count = retry_count + 1,
      next_retry_at = ?,
      updated_at = datetime('now')
    WHERE client_request_id = ?
  `, [nextRetry, item.client_request_id])
}