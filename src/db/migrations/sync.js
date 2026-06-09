import {addColumnIfNotExists, deleteColumnIfExists} from "./helpers"

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
    await deleteColumnIfExists(
        db,
        "sync_queue",
        "payload",
    );
};