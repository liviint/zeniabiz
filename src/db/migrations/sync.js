import {addColumnIfNotExists} from "./helpers"

export const applySyncMigrationsV1 = async (db) => {
    await addColumnIfNotExists(
        db,
        "sync_queue",
        "record_id",
        "TEXT NOT NULL"
    );
    await addColumnIfNotExists(
        db,
        "sync_queue",
        "error_message",
        "TEXT"
    );
};