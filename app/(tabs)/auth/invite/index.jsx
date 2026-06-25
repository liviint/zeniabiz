import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BodyText } from "../../../../src/components/ThemeProvider/components";
import { getActiveContextSync, loadActiveContext } from "../../../../src/db/utils";
import { api } from "../../../../api";
import { createSession } from "../../../../src/db/query/users";
import { useSQLiteContext } from "expo-sqlite";

export default function AcceptInviteScreen() {
  const db = useSQLiteContext();
  const {globalStyles} = useThemeStyles()
  const router = useRouter();

  const { token } = useLocalSearchParams();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [activeContext,setActiveContext] = useState(null)

  useEffect(() => {
    let ctx = getActiveContextSync()
    if(!ctx.access_token) router.push("/auth/login")
    setActiveContext(ctx)

    if (token) {
      loadInvite();
    }

  }, [token]);

  const loadInvite = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/core/company-invites/view/${token}/`
      );

      setInvite(response.data);
      
    } catch (err) {
      console.log(err);

      setError(
        err?.response?.data?.detail ||
        "Invalid or expired invitation."
      );

    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    try {
      setAccepting(true);

      const response = await api.post(
        `/core/company-invites/accept/${token}/`
      );

      console.log("Invite accepted:", response.data);

      Alert.alert(
        "Success",
        "Invitation accepted successfully."
      );
      
      const { company } = response.data;

      await createSession(db, {
        user:null,
        access: activeContext.access_token,
        refresh: activeContext.refresh_token,
        company_uuid:company?.id,
      });
      await loadActiveContext(db)

      router.push("/auth/profile");

    } catch (err) {
      console.log(err);

      setError(
        err?.response?.data?.detail ||
        "Failed to accept invitation."
      );

    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View style={{...globalStyles.container,...styles.center}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{...globalStyles.container,...styles.center}}>
        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={globalStyles.primaryBtn}
          onPress={() => router.replace("/")}
        >
          <Text style={globalStyles.primaryBtnText}>
            Go Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{...globalStyles.container,...styles.container}}>
      <BodyText style={styles.title}>
        Company Invitation
      </BodyText>

      <BodyText style={styles.message}>
        You have been invited to join
      </BodyText>

      <BodyText style={styles.companyName}>
        {invite?.company_name}
      </BodyText>

      <BodyText style={styles.role}>
        Role: {invite?.role}
      </BodyText>

      <BodyText style={styles.email}>
        Invited Email: {invite?.email}
      </BodyText>

      <TouchableOpacity
        style={[
          globalStyles.primaryBtn,
          accepting && { opacity: 0.7 },
        ]}
        onPress={handleAcceptInvite}
        disabled={accepting}
      >
        {accepting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={globalStyles.primaryBtnText}>
            Accept Invitation
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },

  message: {
    fontSize: 16,
    textAlign: "center",
  },

  companyName: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
    color: "#FF6B6B",
  },

  role: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    textTransform: "capitalize",
  },

  email: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom:10,
  },

  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
  },

  backBtn: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  backBtnText: {
    fontWeight: "600",
  },
});