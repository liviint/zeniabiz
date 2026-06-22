import { addColumnIfNotExists } from "./helpers"

export const addFieledsToCompaniesTable_22_06_2026 = async (db) => {
    await addColumnIfNotExists(
        db,
        "companies",
        "phone",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "companies",
        "email",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "companies",
        "address",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "companies",
        "country",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "companies",
        "receipt_footer",
        "TEXT"
    );
};