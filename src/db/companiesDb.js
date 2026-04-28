import uuid from "react-native-uuid";

const newUuid = () => uuid.v4();

export async function ensureLocalCompany(db, userUuid) {
  const existing = await db.getFirstAsync(
    `SELECT * FROM companies LIMIT 1`
  );

  const now = new Date().toISOString();

  // If company exists, just sync into session
  if (existing) {
    await db.runAsync(
      `
      UPDATE app_session
      SET company_uuid = ?, updated_at = ?
      `,
      [existing.uuid, now]
    );

    return existing;
  }

  const companyUuid = newUuid();
  const companyName = "My Business";

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 1. Create company
    await db.runAsync(
      `
      INSERT INTO companies (
        uuid,
        name,
        owner,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [companyUuid, companyName, userUuid, now, now]
    );

    // 2. Add owner as member
    await db.runAsync(
      `
      INSERT INTO company_members (
        uuid,
        company_id,
        user_id,
        role,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, 'owner', ?, ?)
      `,
      [newUuid(), companyUuid, userUuid, now, now]
    );

    // 3. Set active company in session (SOURCE OF TRUTH)
    await db.runAsync(
      `
      INSERT INTO app_session (
        user_uuid,
        company_uuid,
        created_at,
        updated_at
      )
      VALUES (
        (SELECT user_uuid FROM app_session LIMIT 1),
        ?,
        ?,
        ?
      )
      ON CONFLICT(user_uuid)
      DO UPDATE SET company_uuid = excluded.company_uuid
      `,
      [companyUuid, now, now]
    );

    await db.runAsync("COMMIT");

    return {
      uuid: companyUuid,
      name: companyName,
      owner: userUuid,
    };

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}
