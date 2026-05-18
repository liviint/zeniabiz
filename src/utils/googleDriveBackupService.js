import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { exportDatabase, importDatabase } from "../db/googleDriveDb";
import { getSetting, setSetting } from "../db/settingsDb";

const FILE_NAME = "ZeniBiz_Backup.json";

export const configureGoogleDrive = () => {
  GoogleSignin.configure({
    scopes: ["https://www.googleapis.com/auth/drive.file"],
    webClientId: "28706889001-ab7rmk5a8t678ebijhnmsmioj17p629p.apps.googleusercontent.com",
    offlineAccess: true,
  });
};

export const getAccessToken = async () => {
  const { accessToken } = await GoogleSignin.getTokens();

  if (!accessToken) {
    throw new Error("No access token");
  }

  return accessToken;
};

export const getStoredFileId = async (db) => {
  return await getSetting(db, "gdrive_backup_file_id");
};

export const saveFileId = async (db, fileId) => {
  await setSetting(db, "gdrive_backup_file_id", fileId);
};

export const shouldBackupToday = async (db) => {
  const lastBackup = await getSetting(db, "last_backup_date");

  if (!lastBackup) return true;

  return (
    new Date(lastBackup).toDateString() !==
    new Date().toDateString()
  );
};

export const uploadBackup = async (db) => {
  const accessToken = await getAccessToken();

  const dbData = await exportDatabase(db);

  const backupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    app: "ZeniaHub",
    data: dbData,
  };

  let fileId = await getStoredFileId(db);

  // Create file once
  if (!fileId) {
    const createResponse = await fetch(
      "https://www.googleapis.com/drive/v3/files",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: FILE_NAME,
          mimeType: "application/json",
        }),
      }
    );

    const createdFile = await createResponse.json();

    fileId = createdFile.id;

    await saveFileId(db, fileId);
  }

  // Upload content
  const uploadResponse = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backupData),
    }
  );

  if (!uploadResponse.ok) {
    throw new Error("Backup upload failed");
  }

  await setSetting(
    db,
    "last_backup_date",
    new Date().toISOString()
  );
};

export const restoreBackup = async (db) => {
  const accessToken = await getAccessToken();

  const fileId = await getStoredFileId(db);

  if (!fileId) {
    throw new Error("No backup found");
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to restore backup");
  }

  const backup = await response.json();

  if (backup.version !== 1) {
    throw new Error("Unsupported backup version");
  }

  await importDatabase(db, backup.data);
};