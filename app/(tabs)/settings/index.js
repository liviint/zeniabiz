import { View, StyleSheet, Switch, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "@/store/features/settingsSlice";
import { useThemeStyles } from "@/src/hooks/useThemeStyles";
import { Card, BodyText } from "@/src/components/ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { getSetting, setSetting } from "@/src/db/settingsDb";
import * as LocalAuthentication from "expo-local-authentication";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.settings.theme);
  const { globalStyles } = useThemeStyles();
  const db = useSQLiteContext();

  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const value = await getSetting(db, "app_lock_enabled");
      setAppLockEnabled(value === "true");
      setLoading(false);
    };
    loadSettings();
  }, []);

  const toggleAppLock = async () => {
    if (!appLockEnabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Screen lock required",
          "Please set up a device PIN, fingerprint, or Face ID to enable app lock."
        );
        return;
      }
    }

    const next = !appLockEnabled;
    setAppLockEnabled(next);
    await setSetting(db, "app_lock_enabled", next);
  };


  return (
    <View style={globalStyles.container}>
      <Card style={styles.card}>
        <BodyText style={styles.title}>Appearance</BodyText>

        <View style={styles.settingRow}>
          <BodyText>Dark mode</BodyText>
          <Switch
            value={theme === "dark"}
            onValueChange={() => dispatch(toggleTheme())}
          />
        </View>
      </Card>

      {/* Security */}
      <Card style={styles.card}>
        <BodyText style={styles.title}>Security</BodyText>

        <View style={styles.settingRow}>
          <BodyText>App lock</BodyText>
          <Switch
            value={appLockEnabled}
            onValueChange={toggleAppLock}
            disabled={loading}
          />
        </View>

        <BodyText style={styles.helperText}>
          Require device authentication to open the app
        </BodyText>
      </Card>
      
    </View>
  );
};

export default SettingsPage;

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 500,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
});

