import { loadActiveContext } from "@/src/db/utils";
import { clearSyncRequest } from "@/src/store/features/googleDriveSyncSlice";
import {
    determineSyncAction,
    configureGoogleDriveLoginOnly,
    restoreBackup,
    uploadBackup,
} from "@/src/utils/googleDriveBackupService";
import NetInfo from "@react-native-community/netinfo";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setSetting , getSetting} from "../../db/query/settings";
import * as SecureStore from "expo-secure-store";

const AUTO_SYNC_INTERVAL = 24 * 60 * 60 * 1000; 

const GoogleBackupProvider = ({ children }) => {
  const db = useSQLiteContext();
  const dispatch = useDispatch();

  const syncRequested = useSelector(
    (state) => state.googleDriveSync.syncRequested
  );

  const syncingRef = useRef(false);

  const shouldRunDailyBackup = async () => {
      const lastBackup = await getSetting(db, "last_backup_date");

      if (!lastBackup) {
          return true;
      }

      const last = new Date(lastBackup).getTime();
      const now = Date.now();

      return now - last >= AUTO_SYNC_INTERVAL;
  };

  const executeSync = async (force = false) => {
    if (syncingRef.current) {
      console.log("Sync already running");
      return;
    }

    if (!force) {
      const shouldBackup = await shouldRunDailyBackup();

      if (!shouldBackup) {
          console.log("Daily backup not due yet.");
          return;
      }
    }

    const token = await SecureStore.getItemAsync("gdrive_token");

    if (!token) {
        return;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      console.log("No internet connection");
      return;
    }

    syncingRef.current = true;

    try {
      const result = await determineSyncAction(db);

      console.log(result, "SYNC RESULT");

      switch (result.action) {
        case "UPLOAD":
          try {
            
            await uploadBackup(db);
            const now = new Date().toISOString();
            await setSetting(db, "last_backup_date", now);

          } catch (error) {
            console.log("UPLOAD ERROR", error);

            Alert.alert(
              "Backup Failed",
              "Unable to upload backup. Please try again later."
            );
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
                    syncingRef.current = true;

                    await restoreBackup(db);

                    await loadActiveContext(db);

                    Alert.alert(
                      "Restore Complete",
                      "Backup restored successfully."
                    );
                  } catch (error) {
                    console.log("RESTORE ERROR", error);

                    Alert.alert(
                      "Restore Failed",
                      "Unable to restore backup."
                    );
                  } finally {
                    syncingRef.current = false;
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

        default:
          console.log("Unknown sync action");
          break;
      }
    } catch (error) {
      console.log("SYNC ERROR", error);
    } finally {
      syncingRef.current = false;
      dispatch(clearSyncRequest());
    }
  };

  useEffect(() => {
    configureGoogleDriveLoginOnly();
  }, []);

  /**
   * Manual sync request
   */
  useEffect(() => {
    if (!syncRequested) return;

    executeSync(true);
  }, [syncRequested]);


  /**
   * Backup when app goes to background
   */
  useEffect(() => {
    executeSync();
  }, []);

  return children;
};

export default GoogleBackupProvider;