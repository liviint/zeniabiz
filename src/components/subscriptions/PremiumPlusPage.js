import React from "react";
import { 
    StyleSheet, 
    TouchableOpacity, 
    Alert, 
    Linking,
    ScrollView
} from "react-native";

import { useThemeStyles } from "@/src/hooks/useThemeStyles";
import {
  Card,
  BodyText,
  SecondaryText,
} from "@/src/components/ThemeProvider/components";

import SubscriptionStatusCard from "./SubscriptionStatusCard";

import { useSubscription } from "../../../src/components/AppDataProvider/PremiumSubscriptionsProvider";
import { dateFormat } from "../../../utils/dateFormat";

export default function PremiumPlusPage() {
  const {
      subscription,
      refreshSubscription
  } = useSubscription();
  const { globalStyles } = useThemeStyles();

  const handleReFreshSubscription = async () => {
      try {
  
        refreshSubscription()
  
        Alert.alert(
          "Restore Complete",
          "Your purchases have been restored. Your subscription status is being refreshed."
        );
  
      } catch{
        Alert.alert(
          "Restore Failed",
          "Unable to restore your purchases."
        );
      }
    };

  const handleManageSubscription = () => {
    Linking.openURL(
      "https://play.google.com/store/account/subscriptions"
    );
  };

  return (
    <ScrollView style={globalStyles.container}>
      <SubscriptionStatusCard
        icon="👑"
        title="Premium Plus Active"
        description="You're enjoying every premium feature available in ZeniaBiz."
        expiryDate={subscription.billing_period === "lifetime" ? "No Expiry" :  dateFormat(subscription.expires_at)}
      />

      <Card style={styles.section}>
        <BodyText style={styles.heading}>
          Your Premium Plus Benefits
        </BodyText>

        <SecondaryText style={styles.feature}>
          ✓ Google Drive Backup
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Cloud Sync
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Unlimited Devices
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Real-time Synchronization
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Advanced Reports
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Priority Support
        </SecondaryText>

        <SecondaryText style={styles.feature}>
          ✓ Future Premium Features
        </SecondaryText>
      </Card>

      <Card style={styles.section}>
        <BodyText style={styles.heading}>
          Thank You ❤️
        </BodyText>

        <SecondaryText style={styles.description}>
          Your subscription directly supports the continued development of
          ZeniaBiz and helps us build better tools for businesses like yours.
        </SecondaryText>
      </Card>

      <TouchableOpacity
        style={{...globalStyles.primaryBtn,marginBottom:12}}
        onPress={handleManageSubscription}
      >
        <BodyText style={globalStyles.primaryBtnText}>
          Manage Subscription
        </BodyText>
      </TouchableOpacity>

      <TouchableOpacity
        style={globalStyles.secondaryBtn}
        onPress={handleReFreshSubscription}
      >
        <BodyText style={globalStyles.secondaryBtnText}>
          Refresh Subscription
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
  },

  feature: {
    fontSize: 15,
    marginBottom: 10,
  },

  footer: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 20,
  },
});