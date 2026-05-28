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