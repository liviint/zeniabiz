import { useEffect, useRef } from "react";
import { Alert, AppState } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useDispatch, useSelector } from "react-redux";
import {
  determineSyncAction,
  uploadBackup,
  restoreBackup,
} from "@/src/utils/googleDriveBackupService";
import { loadActiveContext } from "@/src/db/utils";
import { clearSyncRequest } from "@/src/store/features/googleDriveSyncSlice";
import NetInfo from "@react-native-community/netinfo";

const AUTO_SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

const GoogleBackupProvider = ({ children }) => {
  const db = useSQLiteContext();
  const dispatch = useDispatch();

  const syncRequested = useSelector(
    (state) => state.googleDriveSync.syncRequested
  );

  const syncingRef = useRef(false);
  const intervalRef = useRef(null);

  /**
   * Prevent multiple syncs running simultaneously
   */
  const executeSync = async () => {
    if (syncingRef.current) {
      console.log("Sync already running");
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

            Alert.alert(
              "Backup Complete",
              "Your data has been backed up successfully."
            );
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

  /**
   * Manual sync request
   */
  useEffect(() => {
    if (!syncRequested) return;

    executeSync();
  }, [syncRequested]);

  /**
   * Automatic daily sync
   */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      console.log("Running automatic daily backup...");

      executeSync();
    }, AUTO_SYNC_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Backup when app goes to background
   */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "background") {
          console.log("App moved to background");

          await executeSync();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return children;
};

export default GoogleBackupProvider;