import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { BodyText } from '../ThemeProvider/components';
import { 
  GoogleSignin, 
  statusCodes 
} from "@react-native-google-signin/google-signin";
import { useDispatch } from "react-redux";
import { setUserDetails } from "@/store/features/userSlice";
import { triggerSync } from "../../../src/store/features/syncSlice";
import { api } from "../../../api";
import { upsertLocalUser, createSession } from "../../../src/db/query/users";
import { useSQLiteContext } from "expo-sqlite";
import { loadActiveContext, getActiveContextSync } from "../../../src/db/utils";

const AccountInfoPage = () => {
  const db = useSQLiteContext();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();
  const dispatch = useDispatch();

  const handleGoogleSignIn = async () => {
    try {
      const {company, user_id} =  await getActiveContextSync(db);
      await GoogleSignin.hasPlayServices();

      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();


      const response = await api.post("accounts/login/google/", {
        id_token: idToken,
        uuid:user_id, 
        company:company,
      }); 

      console.log(response.data,"hello dta")

      const { access, refresh, user, company_uuid,company_role } = response.data;
      await upsertLocalUser(db, user);
      await createSession(db, { user, access, refresh,company_uuid ,company_role});
      await loadActiveContext(db)
      dispatch(triggerSync());
      dispatch(setUserDetails(response.data));
  
      Alert.alert(
        "Success",
        `Welcome ${userInfo.data.user.name}!`
      );

      router.push("/auth/profile");

    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      console.error(error);
      Alert.alert("Error", "Google sign in failed.");
    }
  };

  return (
    <ScrollView 
      style={{ ...globalStyles.container }}
      contentContainerStyle={styles.container}
      >
      <BodyText style={styles.heading}>
        Your Business Data
      </BodyText>

      <BodyText style={styles.subtext}>
          You can use ZeniaBiz without creating an account.
          {"\n\n"}
          All records are stored on this device and work fully offline.
          {"\n\n"}
          Creating an account is optional — it lets you back up your data, sync across devices, and collaborate with others to run your business.
      </BodyText>

      <View style={styles.buttonContainer}>
  <TouchableOpacity
    style={styles.googleButton}
    onPress={handleGoogleSignIn}
  >
    <Text style={styles.googleButtonText}>
      Continue with Google
    </Text>
  </TouchableOpacity>

  <Text style={styles.orText}>or</Text>

  <TouchableOpacity
    style={styles.primaryButton}
    onPress={() => router.push("/auth/signup")}
  >
    <Text style={styles.primaryButtonText}>
      Create Account
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.secondaryButton}
    onPress={() => router.push("/auth/login")}
  >
    <Text style={styles.secondaryButtonText}>
      Sign In
    </Text>
  </TouchableOpacity>
</View>

      {/* <BodyText style={styles.footerText}>
        Your data stays yours. No lock-in. No hidden costs.
      </BodyText> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#2E8B8B',
    paddingVertical: 14,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#2E8B8B',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADCE0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  googleButtonText: {
    color: "#202124",
    fontWeight: "600",
    fontSize: 16,
  },

  orText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 6,
  },
});

export default AccountInfoPage;