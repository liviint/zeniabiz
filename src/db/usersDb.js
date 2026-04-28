import uuid from "react-native-uuid";
const newUuid = () => uuid.v4();

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

  const session = await db.getFirstAsync(
    `SELECT user_uuid FROM app_session LIMIT 1`
  );

  if (!session) {
    throw new Error("No active session");
  }

  await db.runAsync(
    `
    UPDATE local_user
    SET 
      server_user_id = ?,
      name = ?,
      email = ?,
      is_synced = 1,
      last_synced_at = ?,
      updated_at = ?
    WHERE uuid = ?
    `,
    [
      user.id,
      user.username || "",
      user.email || "",
      now,
      now,
      session.user_uuid
    ]
  );

  return session.user_uuid;
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

export async function createSession(db, { user, access, refresh }) {
  const now = new Date().toISOString();

  const localUser = await db.getFirstAsync(
    `SELECT uuid FROM local_user LIMIT 1`
  );

  if (!localUser) {
    throw new Error("Local user missing");
  }

  await db.runAsync(`DELETE FROM app_session`);

  await db.runAsync(
  `
  INSERT INTO app_session (
    user_uuid,
    company_uuid,
    access_token,
    refresh_token,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?)
  `,
  [
    localUser.uuid,
    null, // or active company later
    access,
    refresh,
    now,
    now,
  ]
);

}