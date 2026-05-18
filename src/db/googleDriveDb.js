export const exportDatabase = async (db) => {
  const exportData = {};

  // Get tables
  const tablesResult = await db.getAllAsync(
    "SELECT name FROM sqlite_master WHERE type='table';"
  );

  const tables = tablesResult
    .map(t => t.name)
    .filter(name => name !== "sqlite_sequence");

  for (const table of tables) {
    const rows = await db.getAllAsync(`SELECT * FROM ${table}`);
    exportData[table] = rows;
  }

  return exportData;
};

export const importDatabase = async (db, data) => {
  try {
    // Optional: disable foreign keys temporarily (prevents constraint issues)
    await db.execAsync("PRAGMA foreign_keys = OFF;");

    for (const table of Object.keys(data)) {
      // ⚠️ Clear table first
      await db.execAsync(`DELETE FROM ${table};`);

      const rows = data[table];

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);

        const placeholders = columns.map(() => "?").join(",");

        await db.runAsync(
          `INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders});`,
          values
        );
      }
    }

    // Re-enable foreign keys
    await db.execAsync("PRAGMA foreign_keys = ON;");

    return true;
  } catch (error) {
    console.error("Import Error:", error);
    throw error;
  }
};