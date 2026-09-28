import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSQLiteContext } from "expo-sqlite";
import Purchases, {
  LOG_LEVEL,
} from "react-native-purchases";
import Constants from "expo-constants";
import { getActiveContextSync } from "@/src/db/utils";

const RevenueCatContext = createContext(null);

export const useRevenueCat = () => useContext(RevenueCatContext);

export default function RevenueCatProvider({ children }) {
  const db = useSQLiteContext();

  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const hasPremium =
    !!customerInfo?.entitlements.active["premium"] ||
    !!customerInfo?.entitlements.active["premium_plus"];

  const hasPremiumPlus =
    !!customerInfo?.entitlements.active["premium_plus"];

  useEffect(() => {
    async function init() {
      try {
        const isExpoGo = Constants.appOwnership === "expo";

        if (isExpoGo) {
          setLoading(false);
          return;
        }

        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        // Get the currently logged-in ZeniaBiz user
        const { user_id } = await getActiveContextSync(db);

        console.log(
          "[RevenueCat] ZeniaBiz user ID:",
          user_id
        );

        if (!user_id) {
          console.warn(
            "[RevenueCat] No ZeniaBiz user ID found."
          );

          Purchases.configure({
            apiKey: "goog_FvtuWxXkoVKtGqnJREUOfdOiEhi",
          });

          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info);

          setLoading(false);
          return;
        }

        // Configure RevenueCat
        Purchases.configure({
          apiKey: "goog_FvtuWxXkoVKtGqnJREUOfdOiEhi",
        });

        // Identify the RevenueCat customer using
        // the same ID as the ZeniaBiz account.
        const { customerInfo: info } =
          await Purchases.logIn(user_id);

        console.log(
          "[RevenueCat] Logged in customer:",
          info.originalAppUserId
        );

        console.log(
          "[RevenueCat] Current App User ID:",
          await Purchases.getAppUserID()
        );

        setCustomerInfo(info);

        const listener =
          Purchases.addCustomerInfoUpdateListener((info) => {
            setCustomerInfo(info);
          });

        setLoading(false);

        return () => listener.remove();
      } catch (error) {
        console.error(
          "[RevenueCat] Initialization failed:",
          error
        );

        setLoading(false);
      }
    }

    init();
  }, [db]);


  return (
    <RevenueCatContext.Provider
      value={{
        loading,
        customerInfo,
        hasPremium,
        hasPremiumPlus,
      }}
    >
        {children}
    </RevenueCatContext.Provider>
);
}