import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
} from "react-native-purchases";

import Constants from "expo-constants";

const RevenueCatContext = createContext(null);

export const useRevenueCat = () => useContext(RevenueCatContext);

export default function RevenueCatProvider({ children }) {
  const [customerInfo, setCustomerInfo] = useState(null);

  const [loading, setLoading] = useState(true);

  const hasPremium =
  !!customerInfo?.entitlements.active["premium"] ||
  !!customerInfo?.entitlements.active["premium_plus"];

const hasPremiumPlus =
  !!customerInfo?.entitlements.active["premium_plus"];

  useEffect(() => {
    async function init() {
      const isExpoGo = Constants.appOwnership === "expo";

      if (isExpoGo) {
        setLoading(false);
        return;
      }

      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

      Purchases.configure({
        apiKey: "goog_FvtuWxXkoVKtGqnJREUOfdOiEhi",
      });

      const info = await Purchases.getCustomerInfo();

      setCustomerInfo(info);

      setLoading(false);

      Purchases.addCustomerInfoUpdateListener((info) => {
        setCustomerInfo(info);
      });
    }

    init();
  }, []);

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