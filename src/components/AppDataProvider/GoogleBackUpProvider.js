import { useEffect } from "react";
import { Alert } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useSelector } from "react-redux";
import {
  determineSyncAction,
  uploadBackup,
  restoreBackup,
} from "@/src/utils/googleDriveBackupService";


const GoogleBackupProvider = ({ children }) => {
  const db = useSQLiteContext();
  const syncRequested = useSelector(
    (state) => state.googleDriveSync.syncRequested
  );

  useEffect(() => {
    if (!syncRequested) return;
    const initializeSync = async () => {
      const result =
        await determineSyncAction(db);

      console.log(result, "SYNC RESULT");

      switch (result.action) {
        case "UPLOAD":
          try {
            await uploadBackup(db);
          } catch (error) {
            console.log(error);
          }
          break;

        case "PROMPT_RESTORE":
          Alert.alert(
            "Restore Backup",
            "We found a newer cloud backup. Restore it?",
            [
              {
                text: "Skip",
                style: "cancel",
              },
              {
                text: "Restore",
                onPress: async () => {
                  try {
                    await restoreBackup(db);

                    Alert.alert(
                      "Success",
                      "Backup restored successfully"
                    );
                  } catch (error) {
                    console.log(error);
                  }
                },
              },
            ]
          );
          break;

        case "NOTHING":
          console.log("Already synced");
          break;

        case "ERROR":
          console.log(result.reason);
          break;
      }
    };

    initializeSync();
  }, [syncRequested]);

  return children;
};

export default GoogleBackupProvider;