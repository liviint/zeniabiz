import { useEffect, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useSQLiteContext } from "expo-sqlite";
import {
  configureGoogleDrive,
  uploadBackup,
  shouldBackupToday,
  getAccessToken,
} from "@/src/utils/googleDriveBackupService";;
import { getSetting } from "@/src/db/settingsDb";

const isOnline = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};

const GoogleBackupProvider = ({ children }) => {
  const db = useSQLiteContext();

  const [isConnected, setIsConnected] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  const hasRunRef = useRef(false);

  // 1. Configure once
  useEffect(() => {
    configureGoogleDrive();
  }, []);

  // 2. Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const auto = await getSetting(db, "auto_backup_enabled");

      if (auto === null) {
        setAutoBackupEnabled(true);
      } else {
        setAutoBackupEnabled(auto === "true");
      }
    };

    loadSettings();
  }, [db]);

  // 3. Check Google connection
  const checkConnection = async () => {
    try {
      await getAccessToken();
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // 4. Daily backup runner
  const runDailyBackup = async () => {
    if (hasRunRef.current) return;
    if (!autoBackupEnabled) return;

    const online = await isOnline();
    if (!online) return;

    try {
      const shouldRun = await shouldBackupToday(db);

      if (!shouldRun) return;

      hasRunRef.current = true;

      await uploadBackup(db);
    } catch (error) {
      console.log("Auto backup failed:", error);
    }
  };

  // 5. Trigger when ready
  useEffect(() => {
    if (isConnected && autoBackupEnabled) {
      runDailyBackup();
    }
  }, [isConnected, autoBackupEnabled]);

  return children;
};

export default GoogleBackupProvider;