import { newUuid, getActiveContextSync } from "../db/utils";

export async function enqueueSync(db, {
  model,
  record_id,
  operation,
  client_request_id = null,
}) {
  const { company } =  await getActiveContextSync(db);
  const now = new Date().toISOString();

  const existing = await db.getFirstAsync(
    `SELECT id FROM sync_queue
      WHERE model = ?
      AND record_id = ?
      AND status = 'pending'`,
    [model, record_id]
  );

  if (existing) {
    await db.runAsync(
      `UPDATE sync_queue
        SET updated_at = ?
        WHERE id = ?`,
      [now, existing.id]
    );

    return existing.id;
  }

  const id = newUuid()

  await db.runAsync(
    `INSERT INTO sync_queue (
      id,
      model,
      record_id,
      operation,
      company,
      client_request_id,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      id,
      model,
      record_id,
      operation,
      company,
      client_request_id,
      now,
      now,
    ]
  );

  return id;
}