import { addColumnIfNotExists } from "./helpers"

export const addFieledsToAppSession_15_07_2026 = async (db) => {
    await addColumnIfNotExists(
        db,
        "app_session",
        "email",
        "TEXT"
    );

}