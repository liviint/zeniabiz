import { useState, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
    StyleSheet,
    Alert,
    TouchableOpacity,
    Switch,
    View,
    ScrollView,
} from "react-native";
import { useDispatch } from "react-redux";
import { Card, BodyText } from "@/src/components/ThemeProvider/components";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as SecureStore from "expo-secure-store";
import { useSQLiteContext } from "expo-sqlite";
import { setGoogleConnected, requestSync } from "../../../src/store/features/googleDriveSyncSlice";
import {
    configureGoogleDrive,
    uploadBackup,
    restoreBackup,
    getAccessToken,
} from "@/src/utils/googleDriveBackupService";
import { AnalyticsService } from "../../../src/utils/analyticsService";
import { getSetting, setSetting } from "../../../src/db/query/settings";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";

const GoogleBackUp = () => {
  const db = useSQLiteContext();
  const dispatch = useDispatch()
  const isFocused = useIsFocused();
  const [isConnected, setIsConnected] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  const { globalStyles } = useThemeStyles()

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
        await AnalyticsService.logFirstEvent('first_connected_google_drive');

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
    <ScrollView style={globalStyles.container}>
        <BodyText style={styles.pageTitle}>
            Google Drive Backup
        </BodyText>

        <BodyText style={styles.pageDescription}>
            Back up your business to your personal Google Drive. Recommended if
            you use one phone.
        </BodyText>

        <View style={styles.card}>
            <View style={styles.statusRow}>
                <View style={styles.iconCircle}>
                    <BodyText style={styles.icon}>☁️</BodyText>
                </View>

                <View style={{ flex: 1 }}>
                    <BodyText style={styles.cardTitle}>
                        {isConnected
                            ? "Google Drive Connected"
                            : "Google Drive Not Connected"}
                    </BodyText>

                    <BodyText style={styles.cardSubtitle}>
                        {isConnected
                            ? userEmail
                            : "Connect your Google account to automatically back up your business."}
                    </BodyText>
                </View>
            </View>

            {!isConnected && (
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleConnectGoogle}
                >
                    <BodyText style={styles.buttonText}>
                        Connect Google Drive
                    </BodyText>
                </TouchableOpacity>
            )}
        </View>

        {isConnected && (
            <>
                <View style={styles.card}>
                    <View style={styles.infoRow}>
                        <BodyText style={styles.infoLabel}>
                            Last Backup
                        </BodyText>

                        <BodyText style={styles.infoValue}>
                            {lastBackup || "Never"}
                        </BodyText>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <BodyText style={styles.infoLabel}>
                            Storage
                        </BodyText>

                        <BodyText style={styles.infoValue}>
                            Google Drive
                        </BodyText>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <BodyText style={styles.infoLabel}>
                            Automatic Daily Backup
                        </BodyText>

                        <Switch
                            value={autoBackupEnabled}
                            onValueChange={toggleAutoBackup}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleBackup}
                >
                    <BodyText style={styles.buttonText}>
                        Backup Now
                    </BodyText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleRestore}
                >
                    <BodyText style={styles.secondaryText}>
                        Restore Backup
                    </BodyText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={handleDisconnect}
                >
                    <BodyText style={styles.disconnectText}>
                        Disconnect Google Drive
                    </BodyText>
                </TouchableOpacity>
            </>
        )}

        <View style={styles.noteCard}>
            <BodyText style={styles.noteTitle}>
                Your privacy
            </BodyText>

            <BodyText style={styles.noteText}>
                Backups are stored inside your own Google Drive account. Only
                you can access them, and they can be restored if you replace or
                reset your phone.
            </BodyText>
        </View>
    </ScrollView>
);
};

export default GoogleBackUp;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#F7F7F7",
    },

    pageTitle: {
        fontSize: 26,
        fontWeight: "700",
    },

    pageDescription: {
        color: "#666",
        marginTop: 6,
        marginBottom: 20,
        lineHeight: 22,
    },

    card: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },

    statusRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    iconCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: "#2E8B8B",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },

    icon: {
        fontSize: 22,
    },

    cardTitle: {
        fontWeight: "700",
        fontSize: 16,
    },

    cardSubtitle: {
        marginTop: 4,
        color: "#666",
        lineHeight: 20,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
    },

    infoLabel: {
        color: "#666",
    },

    infoValue: {
        fontWeight: "600",
    },

    divider: {
        height: 1,
        backgroundColor: "#EFEFEF",
    },

    primaryButton: {
        backgroundColor: "#2E8B8B",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 12,
    },

    buttonText: {
        color: "#FFF",
        fontWeight: "700",
    },

    secondaryButton: {
        borderWidth: 1,
        borderColor: "#2E8B8B",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },

    secondaryText: {
        color: "#2E8B8B",
        fontWeight: "700",
    },

    disconnectButton: {
        marginTop: 24,
        alignItems: "center",
    },

    disconnectText: {
        color: "#888",
        textDecorationLine: "underline",
    },

    noteCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 18,
        marginTop: 24,
    },

    noteTitle: {
        fontWeight: "700",
        marginBottom: 8,
    },

    noteText: {
        color: "#666",
        lineHeight: 22,
    },
});