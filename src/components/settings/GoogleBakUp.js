import { useState, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  StyleSheet,
  Alert,
  TouchableOpacity,
  Switch,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { Card, BodyText } from "@/src/components/ThemeProvider/components";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as SecureStore from "expo-secure-store";
import { useSQLiteContext } from "expo-sqlite";
import { setGoogleConnected, requestSync } from "../../store/features/googleDriveSyncSlice";
import {
  configureGoogleDrive,
  uploadBackup,
  restoreBackup,
  getAccessToken,
} from "@/src/utils/googleDriveBackupService";

import { getSetting, setSetting } from "../../db/query/settings";

const GoogleBackUp = () => {
  const db = useSQLiteContext();
  const dispatch = useDispatch()
  const isFocused = useIsFocused();
  const [isConnected, setIsConnected] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  // 1. Configure Google once
  useEffect(() => {
    configureGoogleDrive();
    checkConnection();
    loadSettings();
  }, [isFocused]);

  useEffect(() => {
    
    
  },[])

  // 2. Load settings
  const loadSettings = async () => {
    const last = await getSetting(db, "last_backup_date");
    let email = await getSetting(db, "gdrive_email")

    if (last) {
      setLastBackup(new Date(last).toLocaleString());
      setUserEmail(email)
    }

    const auto = await getSetting(db, "auto_backup_enabled");

    if (auto === null) {
      await setSetting(db, "auto_backup_enabled", "true");
      setAutoBackupEnabled(true);
    } else {
      setAutoBackupEnabled(auto === "true");
    }
  };

  // 3. Check login state
  const checkConnection = async () => {
    try {
      await getAccessToken();
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  };

  // 4. Toggle auto backup
  const toggleAutoBackup = async () => {
    const newValue = !autoBackupEnabled;

    setAutoBackupEnabled(newValue);

    await setSetting(
      db,
      "auto_backup_enabled",
      newValue ? "true" : "false"
    );

    Alert.alert(
      newValue ? "Auto Backup Enabled" : "Auto Backup Disabled",
      newValue
        ? "Your data will be backed up daily."
        : "You can still backup manually anytime."
    );
  };

  // 5. Connect Google
  const handleConnectGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const { accessToken } = await GoogleSignin.getTokens();

      if (accessToken) {
        await SecureStore.setItemAsync("gdrive_token", accessToken);
        setIsConnected(true);

        dispatch(setGoogleConnected(true));
        dispatch(requestSync());
        
        await setSetting(db,"gdrive_email",userInfo?.data?.user?.email)
        setUserEmail(userInfo?.data?.user?.email)

        Alert.alert(
          "Connected",
          `Signed in as ${userInfo?.data?.user?.email}`
        );
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Cancelled", "Login was cancelled");
      } else {
        console.error(error);
        Alert.alert("Error", "Could not connect to Google");
      }
    }
  };

  // 6. Manual backup
  const handleBackup = async () => {
    try {
      await uploadBackup(db);

      const now = new Date().toISOString();

      await setSetting(db, "last_backup_date", now);

      setLastBackup(new Date(now).toLocaleString());

      Alert.alert("Success", "Backup completed successfully");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Backup failed");
    }
  };

  // 7. Restore backup
  const handleRestore = async () => {
    Alert.alert(
      "Restore data?",
      "This will replace your local data with cloud backup.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            try {
              await restoreBackup(db);
              Alert.alert("Success", "Data restored successfully");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Restore failed");
            }
          },
        },
      ]
    );
  };

  // 8. Disconnect
  const handleDisconnect = async () => {
    try {
      await GoogleSignin.signOut();
      await SecureStore.deleteItemAsync("gdrive_token");

      setIsConnected(false);
      setLastBackup(null);

      Alert.alert("Disconnected", "You have been signed out.");
    } catch (error) {
      console.error(error);
    }
  };

  // 9. UI
  return (
    <Card style={styles.card}>
      <BodyText style={styles.title}>Cloud Backup</BodyText>

      <BodyText style={styles.helperText}>
        Back up your data securely to your private Google Drive folder.
      </BodyText>

      {!isConnected ? (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleConnectGoogle}
        >
          <BodyText style={styles.buttonText}>
            Connect Google Drive
          </BodyText>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBackup}
          >
            <BodyText style={styles.buttonText}>
              Backup Now
            </BodyText>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            {userEmail && (
              <BodyText style={styles.helperText}>
                Signed in as: {userEmail}
              </BodyText>
            )}
          </View>

          <View style={styles.settingRow}>
            <BodyText>Automatic Daily Backup</BodyText>
            <Switch
              value={autoBackupEnabled}
              onValueChange={toggleAutoBackup}
            />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRestore}
          >
            <BodyText style={styles.secondaryButtonText}>
              Restore Data
            </BodyText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleDisconnect}
          >
            <BodyText style={styles.logoutText}>
              Disconnect Account
            </BodyText>
          </TouchableOpacity>

          {lastBackup && (
            <BodyText style={styles.helperText}>
              Last sync: {lastBackup}
            </BodyText>
          )}
        </>
      )}
    </Card>
  );
};

export default GoogleBackUp;

const styles = StyleSheet.create({
  card: { width: "100%", maxWidth: 500, padding: 20, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  primaryButton: { marginTop: 16, backgroundColor: "#FF6B6B", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  secondaryButton: { marginTop: 10, borderWidth: 1, borderColor: "#FF6B6B", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  logoutButton: { marginTop: 20, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  secondaryButtonText: { color: "#FF6B6B", fontWeight: "600" },
  logoutText: { color: "#999", fontSize: 13, textDecorationLine: 'underline' },
  helperText: { fontSize: 13, color: "#666", marginTop: 8, lineHeight: 18 },
  settingRow:{
    justifyContent:"space-between",
    flexDirection: "row",
    alignItems: "center",
    paddingTop:15,
    paddingBottom:10,
  }
});