import { enqueueSync } from "../../../cloudSync/syncEvent";
import { getActiveContextSync, newUuid, withTransaction } from "../../utils";

export async function getSuppliers(
    db,
    {
        sort = "business_name_asc",
    } = {}
) {
    const whereClauses = ["deleted_at IS NULL"];
    const params = [];

    let orderBy = "business_name ASC";

    switch (sort) {
        case "newest":
            orderBy = "created_at DESC";
        break;

        case "oldest":
            orderBy = "created_at ASC";
        break;

        case "business_name_desc":
            orderBy = "business_name DESC";
        break;

        case "business_name_asc":
            orderBy = "business_name ASC";
        break;
    }

    const query = `
        SELECT *
        FROM suppliers
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY ${orderBy}
    `;

    return await db.getAllAsync(query, params);
}

export async function getSupplierById(db, id) {
    return await db.getFirstAsync(
        `
            SELECT *
                FROM suppliers
                WHERE id = ?
                AND deleted_at IS NULL
        `,
        [id]
    );
}

export async function upsertSupplier(
    db,
    {
        id,
        business_name,
        contact_person = null,
        phone = null,
        email = null,
        address = null,
        notes = null,
    }
) {
    return withTransaction(db, async () => {
        const { company, user_id } = getActiveContextSync(db);

        const now = new Date().toISOString();

        const supplier_id = id || newUuid();

        await db.runAsync(
        `
            INSERT INTO suppliers (
                id,
                company,
                business_name,
                contact_person,
                phone,
                email,
                address,
                notes,
                created_by,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            ON CONFLICT(id) DO UPDATE SET
                business_name = excluded.business_name,
                contact_person = excluded.contact_person,
                phone = excluded.phone,
                email = excluded.email,
                address = excluded.address,
                notes = excluded.notes,
                updated_at = excluded.updated_at
            `,
            [
                supplier_id,
                company,
                business_name,
                contact_person,
                phone,
                email,
                address,
                notes,
                user_id,
                now,
                now,
            ]
        );

        await enqueueSync(db, {
            model: "suppliers",
            record_id: supplier_id,
            operation: "upsert",
        });

        return supplier_id;
    });
}

export async function deleteSupplier(db, id) {
    if (!id) {
        throw new Error("Supplier id is required");
    }

    const now = new Date().toISOString();

    return withTransaction(db, async () => {
        await db.runAsync(
        `
            UPDATE suppliers
            SET
                deleted_at = ?,
                updated_at = ?
            WHERE id = ?
        `,
        [now, now, id]
        );

        await enqueueSync(db, {
            model: "suppliers",
            record_id: id,
            operation: "delete",
        });
    });
}