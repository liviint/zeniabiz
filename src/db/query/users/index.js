import { newUuid } from "../../utils";

export async function ensureLocalUser(db) {
  const existing = await db.getFirstAsync(
  `SELECT * FROM local_user WHERE deleted_at IS NULL LIMIT 1`
);

  if (existing) return existing.uuid;

  const userId = newUuid();

  await db.runAsync(
    `INSERT INTO local_user (uuid, created_at) VALUES (?, datetime('now'))`,
    [userId]
  );

  return userId;
}

export async function upsertLocalUser(db, user) {
  const now = new Date().toISOString();

  try {
    console.log("🔄 upsertLocalUser START");
    console.log("👤 Incoming user:", user);

    const result = await db.runAsync(
      `
      UPDATE local_user
      SET 
        name = ?,
        email = ?,
        is_synced = 1,
        last_synced_at = ?,
        updated_at = ?
      WHERE uuid = ?
      `,
      [
        user.username || "",
        user.email || "",
        now,
        now,
        user?.uuid
      ]
    );

    console.log("✅ Local user updated successfully:", result);

  } catch (error) {
    console.error("❌ upsertLocalUser FAILED");
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);

    // optional: rethrow so UI can handle it
    throw error;
  } finally {
    console.log("🏁 upsertLocalUser END");
  }
}
export const getLocalUser = async (db) => {
  return await db.getFirstAsync(
    `SELECT * FROM local_user WHERE deleted_at IS NULL LIMIT 1`
  );
};

export async function getCurrentSession(db) {
    return await db.getFirstAsync(
        `SELECT * FROM app_session LIMIT 1`
    );
}

export async function getSessionCompany(db, user) {
  const session = await db.getFirstAsync(
    `SELECT company_uuid FROM app_session LIMIT 1`
  );

  return session?.company_uuid || user?.company_id || null;
}

export async function createSession(db, { user, access, refresh, company_uuid = null ,company_role=null  }) {
  const now = new Date().toISOString();

  try {
    const localUser = await db.getFirstAsync(
      `SELECT uuid FROM local_user LIMIT 1`
    );
    const user_id =  user?.uuid || localUser?.uuid

    let companyUuid = company_uuid || await getSessionCompany(db, user);

    console.log("📦 Local user from DB:", localUser);

    if (!localUser) {
      throw new Error("Local user missing in local_user table");
    }

    console.log("🧹 Clearing old session...");
    await db.runAsync(`DELETE FROM app_session`);

    console.log("💾 Inserting new session...");

    const result = await db.runAsync(
      `
      INSERT INTO app_session (
        user_uuid,
        email,
        company_uuid,
        company_role,
        access_token,
        refresh_token,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        user_id, 
        user?.email, 
        companyUuid,
        company_role,
        access ? access : null,
        refresh ? refresh : null,
        now,
        now
      ]
    );

    console.log("✅ Session created successfully:", result);

    return {
      user_uuid: user_id,
      access,
      refresh
    };

  } catch (error) {
    console.error("❌ createSession FAILED");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    throw error;

  } finally {
    console.log("🏁 createSession END");
  }
}