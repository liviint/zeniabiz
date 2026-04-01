import { Stack, useRouter } from 'expo-router';
import 'react-native-reanimated';
import ReduxProvider from '../src/store/ReduxProvider';
import { useEffect } from 'react';
import Header from '../src/components/header';
import { BackHandler } from 'react-native';
import ThemeProvider from "../src/components/ThemeProvider"
import AppDataProvider from "../src/components/AppDataProvider/index"
import AppLockProvider from "../src/components/AppDataProvider/AppLockProvider"
import DonateProvider from "../src/components/AppDataProvider/DonateProvider"

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const router = useRouter();

  // Handle Android hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [router]);

  return (
    <ReduxProvider>
      <ThemeProvider >
        <AppDataProvider>
          <AppLockProvider>
            <DonateProvider>
              <Stack>
                {/* Main Tabs */}
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    header: () => <Header />,
                  }}
                />

                {/* Modal screen */}
                <Stack.Screen
                  name="modal"
                  options={{
                    presentation: 'modal',
                    title: 'Modal',
                    header: () => <Header />,
                  }}
                />
              </Stack>
            </DonateProvider>
          </AppLockProvider>
        </AppDataProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}