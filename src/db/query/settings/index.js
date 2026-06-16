
export const getSetting = async (db, key) => {
  try {
    const row = await db.getFirstAsync(
      `SELECT value FROM app_settings WHERE key = ?`,
      [key]
    );

    return row?.value ?? null;
  } catch (error) {
    console.warn("Failed to get setting:", error.message);
    return null;
  }
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

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
};
