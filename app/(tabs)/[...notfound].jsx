import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStyles } from '../../src/hooks/useThemeStyles';
import { BodyText } from '../../src/components/ThemeProvider/components';

export default function NotFound() {
  const router = useRouter();
  const { globalStyles } = useThemeStyles();

  return (
    <View style={{...globalStyles.container,...styles.container}}>
      <BodyText style={styles.title}>404</BodyText>
      <BodyText style={styles.message}>
        Oops! Page not found.
      </BodyText>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={globalStyles.primaryBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        >
          <Text style={globalStyles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={globalStyles.secondaryBtn}
          onPress={() => router.replace('/')}
        >
          <Text style={globalStyles.secondaryBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 18,
    marginVertical: 12,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
