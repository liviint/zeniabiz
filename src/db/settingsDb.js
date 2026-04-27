import { syncEvent } from "../cloudSync/enqueue";

export const getSetting = async (db, key) => {
    const row = await db.getFirstAsync(
        `SELECT value FROM app_settings WHERE key = ?`,
        [key]
    );
    return row?.value ?? null;
};

export const setSetting = async (db, key, value) => {
  const now = new Date().toISOString();

  await db.runAsync("BEGIN TRANSACTION");

  try {
    await db.runAsync(
      `
      INSERT INTO app_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value
      `,
      [key, String(value)]
    );

    await db.runAsync("COMMIT");

    // 🔥 SYNC EVENT (AFTER COMMIT)
    await syncEvent(db, {
        model: "app_settings",
        operation: "upsert",
        payload: {
            key,
            value: String(value),
            updated_at: now
        }
    });

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
};
