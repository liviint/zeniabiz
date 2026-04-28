import { useCallback, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useRouter , useFocusEffect, useLocalSearchParams} from "expo-router";
import { clearUserDetails } from "@/store/features/userSlice";
import { api } from "../../../api";
import AccountInfoPage from "../../../src/components/common/AccountInfoPage";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { Card, BodyText } from "../../../src/components/ThemeProvider/components";
import PageLoader from "../../../src/components/common/PageLoader";

const ProfileView = () => {
  const {globalStyles} = useThemeStyles()
  const router = useRouter();
  const {refresh} = useLocalSearchParams()
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.user?.userDetails);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const refereshToken = useSelector(
          (state) => state?.user?.userDetails?.refresh
      );

  const handleLogout = () => {
      api({
            url:"accounts/logout/",
            method:"POST",
            data:{refresh: refereshToken}
        }).then(res => {
        }).catch(error => console.log(error))
        .finally(() => {
          dispatch(clearUserDetails())
          router.push("/habits")
        })
    }

  const getUserData = async () => {
    setLoading(true)
    api.get("accounts/profile/")
    .then(res => {
        setUserData(res.data);
    }).catch(err =>  {
      console.error(err);
    })
    .finally(() =>  setLoading(false))
  };

  useFocusEffect(
    useCallback(() => {
      if (user) {
        getUserData();
      }
      else setUserData(null)
    }, [user, refresh])
  );

  if (loading) return <PageLoader />

  if (!userData) return <AccountInfoPage />

  return (
    <ScrollView contentContainerStyle={{...globalStyles.container,...styles.container}}>
      <Card style={styles.card}>

        <BodyText style={styles.username}>Username: {userData.username}</BodyText>
        <Text style={styles.email}>{userData.email}</Text>
        {userData.bio ? <BodyText style={styles.bio}>{userData.bio}</BodyText> : null}

        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              router.push("/profile/edit")
            }}
          >
            <Text style={styles.btnText}>Update Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.btnText}>Log Out</Text>
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
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  avatarWrapper: {
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FF6B6B",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FF6B6B",
    marginBottom: 5,
  },
  bio: {
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
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

sectionTitle: {
  fontSize: 14,
  fontWeight: "600",
  marginBottom: 12,
  opacity: 0.8,
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
