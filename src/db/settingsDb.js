import { syncEvent } from "../cloudSync/syncEvent";

export const getSetting = async (db, key) => {
    const row = await db.getFirstAsync(
        `SELECT value FROM app_settings WHERE key = ?`,
        [key]
    );
    return row?.value ?? null;
};

export const setSetting = async (db, key, value) => {
  const now = new Date().toISOString();

  if (!key) {
    throw new Error("Setting key is required");
  }

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1️⃣ Local persistence (source of truth offline)
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

    // 2️⃣ SYNC EVENT (AFTER COMMIT ONLY)
    await syncEvent(db, {
      model: "app_settings",
      operation: "upsert",
      payload: {
        key,
        value: String(value),
        updated_at: now,
        deleted_at: null
      }
    });

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
};
