import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDispatch } from "react-redux";
import { setUserDetails } from "../../../../store/features/userSlice";
import { api } from "../../../../api";
import { safeLocalStorage } from "../../../../utils/storage";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import { upsertLocalUser, createSession } from "../../../../src/db/query/users";
import { loadActiveContext } from "../../../../src/db/utils";
import { useSQLiteContext } from "expo-sqlite";
import { triggerSync } from "../../../../src/store/features/syncSlice";

export default function VerifyEmail() {
  const db = useSQLiteContext();
  const {globalStyles} = useThemeStyles()
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const [status, setStatus] = useState("loading"); 
  const [message, setMessage] = useState("");

  useEffect(() => {
    const uid = searchParams.uid;
    const token = searchParams.token;

    if (!uid || !token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verifyEmail = () => {
      api.get(`/accounts/verify-email/?uid=${uid}&token=${token}`)
      .then(async(response) => {
            const { access, refresh, user, company_uuid, company_role } = response.data;
            await upsertLocalUser(db, user);
            await createSession(db, { user, access, refresh,company_uuid, company_role });
            await loadActiveContext(db)
            dispatch(triggerSync());
            dispatch(setUserDetails(response.data));
      })
      .then(() => {
        setStatus("success");
        setMessage("Email verified and logged in! Redirecting...");
        router.push("/auth/profile");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.detail || "Verification failed.");
      })
    };

    verifyEmail();
  }, []);

  return (
    <View style={{...globalStyles.container,...styles.container}}>
      {status === "loading" && (
        <>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.text}>Verifying your email...</Text>
        </>
      )}
      {status === "success" && <Text style={[styles.text, { color: "green" }]}>{message}</Text>}
      {status === "error" && <Text style={[styles.text, { color: "red" }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
});
