import { newUuid, getActiveContextSync, withTransaction } from "./utils";
import { enqueueSync } from "../cloudSync/syncEvent";

export async function getCustomers(db) {
  return await db.getAllAsync(
    `
    SELECT *
    FROM customers
    WHERE deleted_at IS NULL
    ORDER BY name ASC
    `
  );
}

export async function createCustomer(
  db,
  {
    name,
    phone = null,
    note = null,
  }
) {

  return withTransaction(db,async ()=> {
    const { company, user_id } =
    getActiveContextSync(db);

    const now = new Date().toISOString();

    const id = newUuid();

    await db.runAsync(
      `
      INSERT INTO customers (
        id,
        company,
        name,
        phone,
        note,
        created_by,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        company,
        name,
        phone,
        note,
        user_id,
        now,
        now,
      ]
    );

    await enqueueSync(db, {
      model: "customers",
      record_id: id,
      operation: "upsert",
    });

    return id;
  })
}