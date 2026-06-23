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
    await addColumnIfNotExists(
        db,
        "companies",
        "tax_pin",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "companies",
        "business_registration_number",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "companies",
        "website",
        "TEXT"
    );
    await addColumnIfNotExists(
        db,
        "companies",
        "default_tax_rate",
        "TEXT"
    );
};