import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { api } from "../../../api";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { validateEmail } from "../../../src/helpers";
import { Card, FormLabel, Input, BodyText } from "../../../src/components/ThemeProvider/components";
import { useRouter } from "expo-router";

const Signup = () => {
  const router = useRouter()
  const { globalStyles } = useThemeStyles();
  let initialForm = {
    email: "",
    password: "",
    source:"app",
  }
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    setErrors({ ...errors, [key]: "" });
    setServerError("");
  };

  const validateForm = () => {
    let newErrors = {};

    let isEmailValid = validateEmail(formData.email)
    if(isEmailValid.errorMessage) newErrors.email = isEmailValid.errorMessage 

    if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setServerError("");
    setSuccess(false);

    try {
      await api.post("/accounts/register/", {...formData,email: formData.email.trim().toLowerCase()});
      setSuccess(true);
      setFormData(initialForm);
      Alert.alert("Success", "A verification link has been sent to your email.");
    } catch (error) {
      const data = error?.response?.data;
      let errMsg = "Something went wrong. Please try again.";
      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        if (Array.isArray(data[firstKey])) {
          errMsg = data[firstKey][0];
        }
      }
    setServerError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.container}>
      <Card style={styles.form}>
        <BodyText style={globalStyles.title}>Create an Account</BodyText>

        {serverError ? <Text style={styles.error}>{serverError}</Text> : null}
        {success ? (
          <Text style={styles.success}>
            A verification link has been sent to your email.
          </Text>
        ) : null}

        <View style={styles.formGroup}>
          <FormLabel >Email</FormLabel>
          <Input
            placeholder="Enter email"
            value={formData.email}
            onChangeText={(value) => handleChange("email", value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
        </View>

        <View style={styles.formGroup}>
          <FormLabel >Password</FormLabel>
          <View style={globalStyles.passwordWrapper}>
            <Input
              placeholder="Enter password"
              value={formData.password}
              onChangeText={(value) => handleChange("password", value)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
                style={globalStyles.togglePassword}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Text style={globalStyles.togglePasswordText}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
            {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating account…" : "Sign Up"}
          </Text>
        </TouchableOpacity>
        <BodyText style={styles.hint}>
          Already have an account?{" "}
          <Text
            style={styles.link}
            onPress={() => router.push("/login")}
          >
            Log in
        </Text>
</BodyText>

      </Card>
    </ScrollView>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
  },
  form: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  formGroup: {
    marginBottom: 15,
  },
  
  error: {
    color: "#FF6B6B",
    marginTop: 5,
    fontSize: 13,
  },
  success: {
    color: "#2E8B8B",
    marginBottom: 10,
    textAlign: "center",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
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
