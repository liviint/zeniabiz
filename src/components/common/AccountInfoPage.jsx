import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { BodyText } from '../ThemeProvider/components';

const AccountInfoPage = () => {
  const router = useRouter();
  const { globalStyles } = useThemeStyles();

  return (
    <View style={{ ...globalStyles.container, ...styles.container }}>
      <BodyText style={styles.heading}>
        Your profile
      </BodyText>

      <BodyText style={styles.subtext}>
        You can use ZeniaHub without an account.
        {"\n\n"}
        Your journals and habits are stored safely on this device and work fully offline.
        {"\n\n"}
        Creating an account is optional — it lets you back up your data, sync across devices, and restore it if you change phones.
      </BodyText>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.primaryButtonText}>
            Create account (optional)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.secondaryButtonText}>
            Sign in to sync
          </Text>
        </TouchableOpacity>
      </View>

      <BodyText style={styles.footerText}>
        No ads. No pressure. Your data stays yours.
      </BodyText>
    </View>
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
  footerText: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default AccountInfoPage;
