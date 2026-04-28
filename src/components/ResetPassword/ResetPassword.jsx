import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { api } from "@/api";
import { useRouter } from "expo-router";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { validateEmail } from "../../helpers";
import { BodyText, FormLabel, Input , Card} from "../ThemeProvider/components";

const ResetPassword = () => {
  const { globalStyles } = useThemeStyles();
  const router = useRouter()
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    let isEmailValid = validateEmail(email)
    if (!isEmailValid.isValid) {
      setError(isEmailValid.errorMessage);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/accounts/password-reset/", { email:email.trim().toLowerCase() });
      console.log("Reset email sent:", response.data);
      setSuccess("Password reset link sent to your email.");
      setEmail("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to send reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{...styles.container}}>
      <BodyText style={globalStyles.title}>Reset Your Password</BodyText>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.formGroup}>
        <FormLabel >Email Address</FormLabel>
        <Input
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <BodyText style={styles.hint}>
        Remember your password?{" "}
        <Text
          style={styles.link}
          onPress={() => router.push("/login")}
        >
          Back to Login
        </Text>
      </BodyText>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  formGroup: {
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  success: {
    color: "green",
    marginBottom: 10,
    textAlign: "center",
  },
  hint: {
    textAlign: "center",
    marginTop: 10,
  },
  link: {
    color: "#2E8B8B",
    textDecorationLine: "underline",
  },
});

export default ResetPassword;
