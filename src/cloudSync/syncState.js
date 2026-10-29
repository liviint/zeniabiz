import { getActiveContextSync } from "../db/utils";

export async function getSyncCursor(db, model) {
    const { company } = getActiveContextSync();
    const row = await db.getFirstAsync(
        `
        SELECT cursor, version
        FROM sync_state
        WHERE company = ?
          AND model = ?
        `,
        [company, model]
    );

    return {
        cursor: row?.cursor != null
            ? Number(row.cursor)
            : 0,

        version: row?.version ?? 0,
    };
}

export async function saveSyncCursor(db, model, cursor) {
    const { company } = getActiveContextSync();
    await db.runAsync(
        `
        INSERT INTO sync_state (
            company,
            model,
            cursor,
            version,
            updated_at
        )
        VALUES (?, ?, ?, 1, datetime('now'))

        ON CONFLICT(company, model)
        DO UPDATE SET
            cursor = excluded.cursor,
            version = sync_state.version + 1,
            updated_at = excluded.updated_at
        `,
        [company, model, String(cursor)]
    );
}