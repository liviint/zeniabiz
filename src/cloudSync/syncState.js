export async function getSyncCursor(db, model) {
  const row = await db.getFirstAsync(
    `SELECT cursor FROM sync_state WHERE model = ?`,
    [model]
  );

  return row?.cursor ? JSON.parse(row.cursor) : null;
}

export async function saveSyncCursor(db, model, cursor) {
  await db.runAsync(
    `
    INSERT INTO sync_state (model, cursor, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(model) DO UPDATE SET
      cursor = excluded.cursor,
      updated_at = excluded.updated_at
    `,
    [model, JSON.stringify(cursor)]
  );
}