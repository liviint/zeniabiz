import { addColumnIfNotExists, deleteColumnIfExists } from "./helpers"

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

    await addColumnIfNotExists(
        db,
        "company_members",
        "username",
        "TEXT"
    );

    await addColumnIfNotExists(
        db,
        "company_members",
        "email",
        "TEXT"
    );

    await deleteColumnIfExists(
        db,
        "company_members",
        "role",
    );

    await addColumnIfNotExists(
        db,
        "company_members",
        "role",
        "TEXT"
    );

    await addColumnIfNotExists(
        db,
        "company_members",
        "is_active",
        "INTEGER NOT NULL DEFAULT 1"
    );

    await addColumnIfNotExists(
        db,
        "company_members",
        "joined_at",
        "TEXT"
    );
};