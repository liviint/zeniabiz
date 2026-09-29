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
    let listener;

    async function init() {
      try {
        const isExpoGo = Constants.appOwnership === "expo";

        if (isExpoGo) {
          setLoading(false);
          return;
        }

        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        // Configure RevenueCat
        Purchases.configure({
          apiKey: "goog_FvtuWxXkoVKtGqnJREUOfdOiEhi",
        });

        // Listen for subscription/customer-info changes
        listener = Purchases.addCustomerInfoUpdateListener((info) => {
          console.log("[RevenueCat] Customer info updated");
          setCustomerInfo(info);
        });

        // Get active ZeniaBiz context
        const context = getActiveContextSync();

        const companyId = context.company;

        console.log(
          "[RevenueCat] ZeniaBiz company:",
          companyId
        );

        if (!companyId) {
          console.warn(
            "[RevenueCat] No ZeniaBiz company found."
          );

          const info = await Purchases.getCustomerInfo();

          setCustomerInfo(info);
          setLoading(false);
          return;
        }

        // IMPORTANT:
        // RevenueCat customer = Company, not individual user
        const { customerInfo: info } =
          await Purchases.logIn(companyId);

        console.log(
          "[RevenueCat] RevenueCat customer:",
          info.originalAppUserId
        );

        console.log(
          "[RevenueCat] Current App User ID:",
          await Purchases.getAppUserID()
        );

        setCustomerInfo(info);
        setLoading(false);

      } catch (error) {
        console.error(
          "[RevenueCat] Initialization failed:",
          error
        );

        setLoading(false);
      }
    }

    init();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
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