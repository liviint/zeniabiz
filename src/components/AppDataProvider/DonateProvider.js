import { useEffect } from "react";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import Constants from "expo-constants";

export default function RevenueCatProvider({ children }) {
  useEffect(() => {
    const isExpoGo = Constants.appOwnership === "expo";

    if (isExpoGo) {
      console.log("Running in Expo Go → Skipping RevenueCat");
      return;
    }

    try {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

      const androidApiKey = 'goog_FvtuWxXkoVKtGqnJREUOfdOiEhi';

      Purchases.configure({ apiKey: androidApiKey });
      console.log("RevenueCat initialized");
    } catch (error) {
      console.log("RevenueCat init failed:", error);
    }
  }, []);

  return children;
}