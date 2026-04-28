import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { api } from "../../../../api";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import { Card, BodyText, Input, TextArea } from "../../../../src/components/ThemeProvider/components";
import PageLoader from "../../../../src/components/common/PageLoader";

const ProfilePage = () => {
  const {globalStyles} = useThemeStyles()
  const router = useRouter();
  const user = useSelector((state) => state?.user?.userDetails);

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    profilePic: null,
    phone_number: "",
    bio: "",
    interests:1,
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [refresh,setRefresh] = useState(0)

  const getUserData = async () => {
    api({
        url:"accounts/profile/",
        method:"GET",
    }).then(res => {
        setFormData(res.data)
        setPreview(res.data.profilePic);
    }).catch(error => console.log(error))
    .finally(() => setLoading(false))

  };

  useEffect(() => {
    if (user) getUserData();
  }, [user]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    setUpdating(true);
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "profilePic") {
        if (value && typeof value === "object" && value.uri) {
          data.append("profilePic", {
            uri: value.uri,
            name: value.fileName || "profile.jpg",
            type: value.mimeType || "image/jpeg",
          });
        }
      }else {
            data.append(key, value);
          }
      });

        api({
            url:`accounts/profile/`,
            method:"PATCH",
            headers: {'content-type': 'multipart/form-data'},
            data,
        }).then(res => {
            Alert.alert("Success", "Profile updated successfully.");
            setRefresh(prev => prev + 1)
            router.push({
              pathname:"/profile",
              params:{refresh:refresh}
            });
        }).catch(error => {
            console.log(error.response.data)
            setError(error?.response?.data?.username?.[0] || "An error occurred.")
        })
        .finally(() => setUpdating(false))
};

  if (loading) return <PageLoader message={"Loading profile..."} /> 

  return (
    <ScrollView contentContainerStyle={{...globalStyles.container,...styles.container}}>
      <Card style={styles.form}>
        <Text style={styles.title}>Profile Form</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={globalStyles.formGroup}>
          <BodyText style={styles.label}>Username</BodyText>
          <Input
            value={formData.username}
            onChangeText={(text) => handleChange("username", text)}
            placeholder="Username"
          />
        </View>

        <View style={globalStyles.formGroup}>
          <BodyText style={styles.label}>Bio</BodyText>
          <TextArea
            multiline
            numberOfLines={3}
            value={formData.bio}
            onChangeText={(text) => handleChange("bio", text)}
            placeholder="A little about yourself..."
          />
        </View>

        <TouchableOpacity
          style={[styles.button, updating && { opacity: 0.6 }]}
          disabled={updating}
          onPress={handleSubmit}
        >
          <Text style={styles.btnText}>
            {updating ? "Updating..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

export default ProfilePage;



const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 500,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    color: "#FF6B6B",
    fontWeight: "700",
    marginBottom: 16,
  },
  label: {
    color: "#2E8B8B",
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: "#2E8B8B",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#F4E1D2",
  },
  uploadText: {
    color: "#2E8B8B",
    fontWeight: "600",
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FF6B6B",
    marginTop: 10,
    alignSelf: "center",
  },
  button: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 10,
  },
});
