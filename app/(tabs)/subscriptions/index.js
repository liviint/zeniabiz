import { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

import Purchases from "react-native-purchases";

import { useThemeStyles } from "@/src/hooks/useThemeStyles";
import {
  BodyText,
  SecondaryText,
} from "@/src/components/ThemeProvider/components";

import { useRevenueCat } from "@/src/components/AppDataProvider/RevenueCatProvider";
import PlanCard from "../../../src/components/subscriptions/PlanCard"

const SupportPage = () => {
  const { globalStyles } = useThemeStyles();
const { hasPremium, hasPremiumPlus } = useRevenueCat();

const [offerings, setOfferings] = useState({});
const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchOfferings = async () => {
    try {
      const revenueCatOfferings = await Purchases.getOfferings();

      setOfferings({
        premium: revenueCatOfferings.all["premium"],
        premiumPlus: revenueCatOfferings.all["premium_plus"],
      });

    } catch (err) {
      console.warn("RevenueCat fetch error", err);

      let message = "Something went wrong. Please try again.";

      if (err.message?.toLowerCase().includes("network")) {
        message = "No internet connection. Please check and try again.";
      }

      Alert.alert("Subscriptions", message);

    } finally {
      setLoading(false);
    }
  };

  fetchOfferings();
}, []);

  const handlePurchase = async (pkg) => {
  try {
    await Purchases.purchasePackage(pkg);

    Alert.alert(
      "Subscription Activated",
      "Your subscription is now active."
    );

  } catch (err) {
    console.warn("Purchase error:", err);

    if (!err.userCancelled) {
      Alert.alert(
        "Purchase Failed",
        "Your payment couldn't be completed. Please try again."
      );
    }
  }
};

const handleRestorePurchases = async () => {
  try {
    await Purchases.restorePurchases();

    Alert.alert(
      "Purchases Restored",
      "Your subscriptions have been restored successfully."
    );
  } catch (error) {
    console.warn(error);

    Alert.alert(
      "Restore Failed",
      "Unable to restore your purchases. Please try again."
    );
  }
};

  return (
  <ScrollView
  style={globalStyles.container}
  contentContainerStyle={styles.container}
  showsVerticalScrollIndicator={false}
>
    <BodyText style={globalStyles.title}>
    ZeniaBiz Premium
  </BodyText>

  <SecondaryText style={styles.subtitle}>
    Unlock premium features to protect your business data, access advanced reports,
    and keep your business synced across all your devices.
  </SecondaryText>
    <PlanCard
    title="Premium"
    handlePurchase={handlePurchase}
    badge="Most Popular"
    offering={offerings.premium}
    isActive={hasPremium && !hasPremiumPlus}
    features={[
        "Google Drive Backup",
        "Automatic Backups",
        "Restore Backups",
        "Advanced Reports",
        "Export Reports",
        "Priority Support",
    ]}
/>

<PlanCard
    title="Premium Plus"
    handlePurchase={handlePurchase}
    badge="Best Value"
    offering={offerings.premiumPlus}
    isActive={hasPremiumPlus}
    features={[
        "Everything in Premium",
        "Cloud Sync",
        "Multiple Devices",
        "Real-time Sync",
        "Future Team Access",
    ]}
/>
<TouchableOpacity
  style={styles.restoreButton}
  onPress={handleRestorePurchases}
>
  <BodyText style={styles.restoreButtonText}>
   Restore Subscription
  </BodyText>
</TouchableOpacity>

<SecondaryText style={styles.footerText}>
  Subscriptions renew automatically unless cancelled at least 24 hours before the
  end of the current billing period. You can manage or cancel your subscription at
  any time through Google Play.
</SecondaryText>

<SecondaryText style={styles.footerText}>
  By subscribing you agree to the Terms of Service and Privacy Policy.
</SecondaryText>

  </ScrollView>
);
};

export default SupportPage;



const styles = StyleSheet.create({
  subtitle: {
  textAlign: "center",
  marginTop: 10,
  marginBottom: 25,
  lineHeight: 22,
},

restoreButton: {
  marginTop: 10,
  marginBottom: 20,
  alignSelf: "center",
},

restoreButtonText: {
  fontWeight: "600",
},

footerText: {
  textAlign: "center",
  fontSize: 12,
  lineHeight: 18,
  marginBottom: 12,
},
});