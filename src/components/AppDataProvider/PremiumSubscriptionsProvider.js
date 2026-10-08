import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/api";
import { getActiveContextSync } from "@/src/db/utils";
import Purchases from "react-native-purchases";

const SubscriptionContext = createContext(null);

export const useSubscription = () => useContext(SubscriptionContext);

export default function PremiumSubscriptionsProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  const [hasPremium, setHasPremium] = useState(false);
  const [hasPremiumPlus, setHasPremiumPlus] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState(null);

  const refreshSubscription = async () => {
    setReload((prev) => prev + 1);
  };

  useEffect(() => {
    const ctx = getActiveContextSync();

    async function initializeRevenueCat() {
      try {
        if (!ctx?.company) {
          console.warn(
            "[RevenueCat] Cannot initialize: company is missing"
          );
          return;
        }

        const apiKey =
          "goog_FvtuWxXkoVKtGqnJREUOfdOiEhi"

        if (!apiKey) {
          console.warn(
            "[RevenueCat] Android API key is missing"
          );
          return;
        }

        await Purchases.configure({
          apiKey,
          appUserID: ctx.company,
        });

        console.log(
          "[RevenueCat] Initialized successfully for company:",
          ctx.company
        );
      } catch (error) {
        console.error(
          "[RevenueCat] Initialization failed:",
          error
        );
      }
    }

    initializeRevenueCat();
  }, []);

  useEffect(() => {
    let mounted = true;

    const ctx = getActiveContextSync();

    async function init() {
      try {
        setLoading(true);

        let response = await api.get(
          "/payments/subscriptions/",
          {
            params: {
              company_id: ctx.company,
            },
          }
        );

        response = response.data.results;

        const currentSubscription =
          Array.isArray(response)
            ? response[0] ?? null
            : response?.subscription ?? response ?? null;

        if (!mounted) return;

        setSubscription(currentSubscription);

        const status =
          currentSubscription?.status?.toUpperCase();

        const expiresAt =
          currentSubscription?.expires_at;

        const hasNotExpired =
          !expiresAt ||
          new Date(expiresAt).getTime() > Date.now();

        const isActive =
          !!currentSubscription &&
          (!status ||
            status === "ACTIVE" ||
            status === "TRIALING") &&
          hasNotExpired;

        setHasPremium(
          isActive &&
          currentSubscription?.plan?.code === "premium"
        );

        setHasPremiumPlus(
          isActive &&
          currentSubscription?.plan?.code === "premium_plus"
        );
      } catch (error) {
        console.error(
          "[Subscription] Initialization failed:",
          error
        );

        if (mounted) {
          setSubscription(null);
          setHasPremium(false);
          setHasPremiumPlus(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [reload]);

  return (
    <SubscriptionContext.Provider
      value={{
        loading,
        subscription,
        hasPremium,
        hasPremiumPlus,

        expiresAt:
          subscription?.expires_at ?? null,

        billingPeriod:
          subscription?.billing_period ?? null,

        plan:
          subscription?.plan ?? null,

        status:
          subscription?.status ?? null,

        refreshSubscription,

        cancelling,
        message,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}