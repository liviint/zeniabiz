import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { exportDatabase, importDatabase } from "../db/query/googleDrive";
import { getSetting, setSetting } from "../db/query/settings";

const FILE_NAME = "ZeniaBiz_Backup.json";

export const configureGoogleDrive = () => {
  GoogleSignin.configure({
    scopes: ["https://www.googleapis.com/auth/drive.file"],
    webClientId: "28706889001-ab7rmk5a8t678ebijhnmsmioj17p629p.apps.googleusercontent.com",
    offlineAccess: true,
  });
};

export const configureGoogleDriveLoginOnly = () => {
  GoogleSignin.configure({
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

  // ALWAYS search Drive during restore
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}'&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error("Failed to search backups");
  }

  const searchResult = await searchResponse.json();

  const file = searchResult.files?.[0];

  if (!file) {
    throw new Error("No backup found");
  }

  // Save fileId again locally
  await saveFileId(db, file.id);

  // Download backup
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to download backup");
  }

  const backup = await response.json();

  // Backup version validation
  if (backup.version !== 1) {
    throw new Error("Unsupported backup version");
  }

  await importDatabase(db, backup.data);
};


/**
 * Checks whether local DB has meaningful data
 * Customize this for your app
 */
export const hasLocalData = async (db) => {
  try {
    // Example:
    // Replace with your actual tables
    const products = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM products`
    );

    const expenses = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM expenses`
    );

    const sales = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM sales`
    );

    return products.count > 0 || expenses.count > 0 || sales.count > 0;
  } catch (error) {
    console.log("Local data check failed:", error);
    return false;
  }
};

/**
 * Gets local DB last modified time
 */
export const getLocalLastModified = async (db) => {
  return await getSetting(db, "last_backup_date");
};

export const findBackupFile = async (accessToken) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}'&spaces=drive&fields=files(id,name,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search backup file");
    }

    const result = await response.json();

    // No backup found
    if (!result.files || result.files.length === 0) {
      return null;
    }

    // If multiple backups exist,
    // use the most recently modified one
    const sortedFiles = result.files.sort(
      (a, b) =>
        new Date(b.modifiedTime).getTime() -
        new Date(a.modifiedTime).getTime()
    );

    return sortedFiles[0];
  } catch (error) {
    console.log("findBackupFile error:", error);
    throw error;
  }
};

export const determineSyncAction = async (db) => {
  try {
    const accessToken = await getAccessToken();

    // 1. Check local state
    const localHasData = await hasLocalData(db);

    const localLastModified =
      await getLocalLastModified(db);

    // 2. Check cloud backup
    const cloudFile =
      await findBackupFile(accessToken);

    // CASE: No cloud backup
    if (!cloudFile) {
      if (localHasData) {
        return {
          action: "UPLOAD",
          reason: "No cloud backup exists",
        };
      }

      return {
        action: "NOTHING",
        reason: "No local or cloud data",
      };
    }

    // 3. Download cloud metadata
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${cloudFile.id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch cloud backup");
    }

    const cloudBackup = await response.json();

    const cloudLastModified =
      cloudBackup.timestamp;

    // CASE: Fresh install/reset
    if (!localHasData && cloudBackup) {
      return {
        action: "PROMPT_RESTORE",
        reason: "Cloud backup exists but local DB empty",
        cloudBackup,
      };
    }

    // CASE: Local exists but cloud missing timestamp
    if (!cloudLastModified) {
      return {
        action: "UPLOAD",
        reason: "Cloud backup invalid",
      };
    }

    // 4. Compare timestamps
    const localTime = new Date(
      localLastModified || 0
    ).getTime();

    const cloudTime = new Date(
      cloudLastModified
    ).getTime();

    // CASE: Local newer
    if (localTime > cloudTime) {
      return {
        action: "UPLOAD",
        reason: "Local data newer",
      };
    }

    // CASE: Cloud newer
    if (cloudTime > localTime) {
      return {
        action: "PROMPT_RESTORE",
        reason: "Cloud backup newer",
        cloudBackup,
      };
    }

    // CASE: Same
    return {
      action: "NOTHING",
      reason: "Already synced",
    };
  } catch (error) {
    console.log("Sync decision failed:", error);

    return {
      action: "ERROR",
      reason: error.message,
    };
  }
};
