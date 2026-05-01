export async function getSyncCursor(db, model) {
  const row = await db.getFirstAsync(
    `SELECT cursor, version FROM sync_state WHERE model = ?`,
    [model]
  );

  return {
    cursor: row?.cursor ? JSON.parse(row.cursor) : null,
    version: row?.version ?? 0,
  };
}

export async function saveSyncCursor(db, model, cursor) {
  await db.runAsync(
    `
    INSERT INTO sync_state (model, cursor, version, updated_at)
    VALUES (?, ?, COALESCE((SELECT version FROM sync_state WHERE model = ?), 0) + 1, datetime('now'))
    ON CONFLICT(model) DO UPDATE SET
      cursor = excluded.cursor,
      version = sync_state.version + 1,
      updated_at = excluded.updated_at
    `,
    [model, JSON.stringify(cursor), model]
  );
}