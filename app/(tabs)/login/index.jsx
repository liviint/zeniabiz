import  { useState} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useDispatch } from "react-redux";
import { Link, useRouter } from "expo-router";
import { setUserDetails } from "@/store/features/userSlice";
import { api } from "../../../api";
import { safeLocalStorage } from "../../../utils/storage";
import * as WebBrowser from "expo-web-browser";
import { validateEmail } from "../../../src/helpers";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { Card, BodyText, FormLabel, Input } from "../../../src/components/ThemeProvider/components";

WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const { globalStyles } = useThemeStyles();
  const router = useRouter();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
    setServerError("");
  };

  const validateForm = () => {
      const newErrors = {};
      let isEmailValid = validateEmail(formData.email)
      if(isEmailValid.errorMessage) newErrors.email = isEmailValid.errorMessage 

      if (!formData.password.trim()) newErrors.password = "Please enter your password.";

      setErrors(newErrors);
      console.log(newErrors,"hello new erro")
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setServerError("");
    setSuccess(false);

    try {
      const response = await api.post("accounts/login/", {...formData,email: formData.email.trim().toLowerCase()});
      dispatch(setUserDetails(response.data));
      safeLocalStorage.setItem("token", response.data.access);
      setSuccess(true);
      router.push("/profile");
      setFormData({ email: "", password: "" });
    } catch (error) {
      console.error("Login failed:", error?.response);
      setServerError(
        error.response?.data?.message || error?.response?.data?.non_field_errors ||
          "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{...globalStyles.container,...styles.container}}>
      <Card style={styles.form}>
        <BodyText style={styles.title}>Welcome Back</BodyText>

        {serverError ? <Text style={styles.error}>{serverError}</Text> : null}
        {success ? (
          <Text style={styles.success}>Login successful!</Text>
        ) : null}

        <View style={styles.formGroup}>
          <FormLabel style={styles.label}>Email</FormLabel>
          <Input
            placeholder="Enter email"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(value) => handleChange("email", value)}
          />
          {errors.email ? (
            <Text style={styles.error}>{errors.email}</Text>
          ) : null}
        </View>

        <View style={styles.formGroup}>
          <FormLabel >Password</FormLabel>
          <View style={globalStyles.passwordWrapper}>
            <Input
              style={styles.input}
              placeholder="Enter password"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => handleChange("password", value)}
            />
            <TouchableOpacity
                style={globalStyles.togglePassword}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Text style={globalStyles.togglePasswordText}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
            {errors.password ? (
              <Text style={styles.error}>{errors.password}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.forgotPass}>
          <Link style={styles.forgotPassText} href="/reset-password">
            Forgot password?
          </Link>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <BodyText style={styles.hint}>
          Don’t have an account?{" "}
          <Text style={styles.link} onPress={() => router.push("/signup")}>
            Sign up
          </Text>
        </BodyText>
      </Card>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  form: {
    padding: 20,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 24,
    fontWeight: "700",
    color: "#FF6B6B",
  },
  formGroup: {
    marginBottom: 16,
  },

  button: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  googleBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 15,
  },
  googleText: {
    fontWeight: "600",
    color: "#333",
  },
  error: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: 4,
  },
  success: {
    color: "#2E8B8B",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "700",
  },
  forgotPass: { marginTop: 10, alignItems: "flex-end" },
  forgotPassText: {
    color: "#2E8B8B",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  hint: {
    textAlign: "center",
    marginTop: 16,
    opacity: 0.7,
    fontSize: 15,
  },

  link: {
    color: "#FF6B6B", 
    fontWeight: "600",
  },
});
