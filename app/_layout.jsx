import analytics from "@react-native-firebase/analytics";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { BackHandler } from "react-native";
import "react-native-reanimated";
import AppLockProvider from "../src/components/AppDataProvider/AppLockProvider";
import AppDataProvider from "../src/components/AppDataProvider/index";
import Header from "../src/components/header";
import ThemeProvider from "../src/components/ThemeProvider";
import ReduxProvider from "../src/store/ReduxProvider";

export const unstable_settings = {
  anchor: "(tabs)",
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

  useEffect(() => {
    analytics().setAnalyticsCollectionEnabled(!__DEV__);
  }, []);

  return (
    <ReduxProvider>
      <ThemeProvider>
        <AppDataProvider>
            <AppLockProvider>
              <Stack>
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    header: () => <Header />,
                  }}
                />

                <Stack.Screen
                  name="modal"
                  options={{
                    presentation: "modal",
                    title: "Modal",
                    header: () => <Header />,
                  }}
                />
              </Stack>
            </AppLockProvider>
        </AppDataProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
