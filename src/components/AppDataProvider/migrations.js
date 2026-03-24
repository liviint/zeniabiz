export const addMoodsSyncColumnsIfNeeded = async (db) => {
  const columns = await db.getAllAsync(`PRAGMA table_info(moods);`);

  const hasDeletedAt = columns.some(col => col.name === "deleted_at");
  const hasSynced = columns.some(col => col.name === "synced");
  const hasUuid = columns.some(col => col.name === "uuid");

  if (!hasDeletedAt) {
    await db.runAsync(`
      ALTER TABLE moods
      ADD COLUMN deleted_at TEXT
    `);
  }

  if (!hasSynced) {
    await db.runAsync(`
      ALTER TABLE moods
      ADD COLUMN synced INTEGER DEFAULT 0
    `);
  }

  if (!hasUuid) {
    await db.runAsync(`
        ALTER TABLE moods
        ADD COLUMN uuid TEXT
    `);
  }
};


export const addHabitsDeletedAtColumnsIfNeeded = async (db) => {
  const columns = await db.getAllAsync(`PRAGMA table_info(habits);`);

  const hasDeletedAt = columns.some(col => col.name === "deleted_at");

  if (!hasDeletedAt) {
    await db.runAsync(`
      ALTER TABLE habits
      ADD COLUMN deleted_at TEXT
    `);
  }
};

export const addHabitEntriesDeletedAtColumnIfNeeded = async (db) => {
  const columns = await db.getAllAsync(`PRAGMA table_info(habit_entries);`);

  const hasDeletedAt = columns.some(col => col.name === "deleted_at");

  if (!hasDeletedAt) {
    await db.runAsync(`
      ALTER TABLE habit_entries
      ADD COLUMN deleted_at TEXT
    `);
  }
};



export const extraMigrations = async (db) => {
    await addMoodsSyncColumnsIfNeeded(db)
    await addHabitsDeletedAtColumnsIfNeeded(db)
    await addHabitEntriesDeletedAtColumnIfNeeded(db)
}