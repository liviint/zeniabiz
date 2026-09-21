import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../../../../api";
import AccountInfoPage from "../../../../src/components/common/AccountInfoPage";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import {
  Card,
  BodyText,
} from "../../../../src/components/ThemeProvider/components";
import PageLoader from "../../../../src/components/common/PageLoader";
import {
  useIsFocused,
  useRouter,
  useLocalSearchParams,
} from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getActiveContextSync } from "../../../../src/db/utils";
import { logoutUser } from "../../../../src/utils/auth/logout";

import {
  triggerManualSync,
} from "../../../../src/store/features/syncSlice";
import { dateFormat } from "../../../../utils/dateFormat";

const ProfileView = () => {
  const db = useSQLiteContext();
  const { globalStyles } = useThemeStyles();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { refresh } = useLocalSearchParams();
  const dispatch = useDispatch();

  const [activeContext, setActiveContext] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync state
  const {
    isSyncing,
    lastSyncedAt,
    error: syncError,
  } = useSelector((state) => state.sync);

  const handleLogoutOk = async () => {
    await logoutUser({
      db,
      dispatch,
      router,
      refreshToken: activeContext?.refresh_token,
    });
  };

  const handleTriggerLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => handleLogoutOk(),
        },
      ],
      { cancelable: true },
    );
  };

  const handleSync = () => {
    if (isSyncing) return;

    dispatch(triggerManualSync());
  };

  useEffect(() => {
    (async () => {
      let ctx = await getActiveContextSync(db);
      setActiveContext(ctx);
    })();
  }, [isFocused]);

  useEffect(() => {
    const getUserData = async () => {
      setLoading(true);

      api
        .get("accounts/profile/")
        .then((res) => {
          setUserData(res.data);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setLoading(false));
    };

    if (activeContext?.access_token) {
      getUserData();
    } 
  }, [activeContext, refresh, isFocused]);

  if (loading) return <PageLoader />;

  if (!userData) return <AccountInfoPage />;

  return (
    <ScrollView
      contentContainerStyle={{
        ...globalStyles.container,
        ...styles.container,
      }}
    >
      <Card style={styles.card}>

        <BodyText style={styles.username}>
          Email: {userData.email}
        </BodyText>

        {userData.username ? (
          <BodyText style={styles.bio}>
            UserName: {userData.username}
          </BodyText>
        ) : null}

        {/* Data Sync */}
        <View style={styles.syncSection}>

          <View style={styles.syncHeader}>
            <View style={styles.syncInfo}>
              <BodyText style={styles.sectionTitle}>
                Data Sync
              </BodyText>

              <BodyText style={styles.syncDescription}>
                Your data automatically syncs every 2 minutes.
              </BodyText>
            </View>

            <BodyText
              style={[
                styles.syncStatus,
                isSyncing
                  ? styles.syncingStatus
                  : syncError
                    ? styles.errorStatus
                    : styles.syncedStatus,
              ]}
            >
              {isSyncing
                ? "Syncing..."
                : syncError
                  ? "Sync failed"
                  : "✓ Synced"}
            </BodyText>
          </View>

          {lastSyncedAt && !isSyncing && (
            <BodyText style={styles.lastSync}>
              Last synced:{" "}
              {dateFormat(lastSyncedAt,true)}
            </BodyText>
          )}

          {syncError && (
            <Text style={styles.syncError}>
              {syncError}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.syncButton,
              isSyncing && styles.disabledButton,
            ]}
            onPress={handleSync}
            disabled={isSyncing}
          >
            <Text style={styles.btnText}>
              {isSyncing
                ? "Syncing..."
                : "↻ Sync Now"}
            </Text>
          </TouchableOpacity>

        </View>

        {/* Profile Actions */}
        <View style={styles.btnGroup}>

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              router.push("/auth/profile/edit");
            }}
          >
            <Text style={styles.btnText}>
              Update Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.logoutButton,
            ]}
            onPress={handleTriggerLogout}
          >
            <Text style={styles.btnText}>
              Log Out
            </Text>
          </TouchableOpacity>

        </View>

      </Card>
    </ScrollView>
  );
};

export default ProfileView;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF9F7",
  },

  card: {
    borderRadius: 20,
    padding: 25,
    width: "100%",
    maxWidth: 500,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 6,
    elevation: 5,
  },

  username: {
    fontSize: 16,
  },

  bio: {
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },

  /* Sync */

  syncSection: {
    width: "100%",
    marginTop: 25,
    paddingTop: 18,
    borderTopWidth: 1,
    borderColor: "#E5E5E5",
  },

  syncHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  syncInfo: {
    flex: 1,
    paddingRight: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 5,
  },

  syncDescription: {
    fontSize: 13,
    opacity: 0.65,
    lineHeight: 19,
  },

  syncStatus: {
    fontSize: 13,
    fontWeight: "600",
  },

  syncedStatus: {
    color: "#2E8B8B",
  },

  syncingStatus: {
    color: "#2E8B8B",
  },

  errorStatus: {
    color: "#FF6B6B",
  },

  lastSync: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 10,
  },

  syncError: {
    fontSize: 13,
    color: "#FF6B6B",
    marginTop: 8,
    lineHeight: 19,
  },

  syncButton: {
    backgroundColor: "#2E8B8B",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
    width: "100%",
  },

  disabledButton: {
    opacity: 0.6,
  },

  /* Profile buttons */

  btnGroup: {
    flexDirection: "column",
    gap: 10,
    marginTop: 20,
    width: "100%",
  },

  button: {
    backgroundColor: "#2E8B8B",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  logoutButton: {
    backgroundColor: "#FF6B6B",
  },

  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  settingsSection: {
    width: "100%",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "#E5E5E5",
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingLabel: {
    fontSize: 15,
  },
});