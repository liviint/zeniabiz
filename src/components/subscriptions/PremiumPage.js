import React from "react";
import { 
    View, 
    StyleSheet, 
    TouchableOpacity, 
    Alert,
    ScrollView
} from "react-native";
import Purchases from "react-native-purchases";

import { useThemeStyles } from "@/src/hooks/useThemeStyles";
import {
  Card,
  BodyText,
  SecondaryText,
} from "@/src/components/ThemeProvider/components";

import SubscriptionStatusCard from "./SubscriptionStatusCard";

export default function PremiumPage({ premiumPlusOffering }) {
  const { globalStyles } = useThemeStyles();

  const handleRestorePurchases = async () => {
    try {
      await Purchases.restorePurchases();

      Alert.alert(
        "Purchases Restored",
        "Your subscriptions have been restored successfully."
      );
    } catch (error) {
      Alert.alert(
        "Restore Failed",
        "Unable to restore your purchases."
      );
    }
  };

  const handleUpgrade = async () => {
    if (!premiumPlusOffering) return;

    const monthly = premiumPlusOffering.availablePackages.find(
      (pkg) => pkg.packageType === "MONTHLY"
    );

    if (!monthly) {
      Alert.alert("Unavailable", "Premium Plus is currently unavailable.");
      return;
    }

    try {
      await Purchases.purchasePackage(monthly);
    } catch (error) {
      if (!error.userCancelled) {
        Alert.alert(
          "Upgrade Failed",
          "Unable to complete your upgrade."
        );
      }
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      <SubscriptionStatusCard
        title="Premium Active"
        description="Your business is protected with automatic Google Drive backups."
      />

      <Card style={styles.section}>
        <BodyText style={styles.heading}>
          Your Benefits
        </BodyText>

        <SecondaryText style={styles.feature}>
          ✓ Automatic Google Drive Backups
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Restore Backups Anytime
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Advanced Reports
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Export Reports
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Priority Support
        </SecondaryText>
      </Card>

      <Card style={styles.section}>
        <BodyText style={styles.heading}>
          Upgrade to Premium Plus
        </BodyText>

        <SecondaryText style={styles.description}>
          Sync your business in real time across multiple devices and unlock team features.
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Cloud Sync
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Multiple Devices
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Real-time Synchronization
        </SecondaryText>

        <TouchableOpacity
          style={{...globalStyles.primaryBtn,marginBottom:12}}
          onPress={handleUpgrade}
        >
          <BodyText style={globalStyles.primaryBtnText}>
            Upgrade to Premium Plus
          </BodyText>
        </TouchableOpacity>
      </Card>

      <TouchableOpacity
        style={globalStyles.secondaryBtn}
        onPress={handleRestorePurchases}
      >
        <BodyText style={globalStyles.secondaryBtnText}>
          Restore Purchases
        </BodyText>
      </TouchableOpacity>

      <SecondaryText style={styles.footer}>
        Your subscription renews automatically until cancelled through Google Play.
      </SecondaryText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },

  heading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },

  description: {
    lineHeight: 22,
    marginBottom: 15,
  },

  feature: {
    fontSize: 15,
    marginBottom: 10,
  },


  footer: {
    textAlign: "center",
    marginTop: 20,
    lineHeight: 20,
    fontSize: 12,
    marginBottom: 20,
  },
});