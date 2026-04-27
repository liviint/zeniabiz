import uuid from "react-native-uuid";

const newUuid = () => uuid.v4();

export async function ensureLocalUser(db) {
  const existing = await db.getFirstAsync(
    `SELECT * FROM local_user LIMIT 1`
  );

  if (existing) return existing.id;

  const userId = newUuid();

  await db.runAsync(
    `INSERT INTO local_user (id, created_at) VALUES (?, datetime('now'))`,
    [userId]
  );

  return userId;
}
export async function ensureLocalCompany(db, userId) {
  const existing = await db.getFirstAsync(
    `SELECT * FROM companies LIMIT 1`
  );

  if (existing) return existing;

  const now = new Date().toISOString();
  const companyId = newUuid();

  const companyName = "My Business";

  await db.runAsync(
    `
    INSERT INTO companies (
      id,
      name,
      owner_id,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [companyId, companyName, userId, now, now]
  );

  await db.runAsync(
    `
    INSERT INTO company_members (
      id,
      company_id,
      user_id,
      role,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, 'owner', ?, ?)
    `,
    [newUuid(), companyId, userId, now, now]
  );

  return {
    id: companyId,
    name: companyName,
    owner_id: userId
  };
}

