import React,{ useState, useEffect } from "react";
import { 
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

export default function PremiumPage() {
  const { globalStyles } = useThemeStyles();

    const [offerings, setOfferings] = useState({});
    const [purchasing, setPurchasing] = useState(false);
  
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
    
            } 
        };
    
        fetchOfferings();
    }, []);

  const handleRestorePurchases = async () => {
    try {

      const customerInfo = await Purchases.restorePurchases();

      if (Object.keys(customerInfo.entitlements.active).length > 0) {
          Alert.alert(
              "Purchases Restored",
              "Your subscriptions have been restored successfully."
          );
      } else {
          Alert.alert(
              "No Purchases Found",
              "No active subscriptions were found for this account."
          );
      }

    } catch (error) {
      Alert.alert(
        "Restore Failed",
        "Unable to restore your purchases."
      );
    }
  };


  const handleUpgrade = async (pkg) => {
    if (purchasing) return;

    setPurchasing(true);

    if (!pkg) {
      setPurchasing(false);
        Alert.alert(
            "Unavailable",
            "This subscription is currently unavailable."
        );
        return;
    }

    try {
        await Purchases.purchasePackage(pkg);
    } catch (error) {
        if (!error.userCancelled) {
            Alert.alert(
                "Upgrade Failed",
                "Unable to complete your upgrade."
            );
        }
    }
    finally {
        setPurchasing(false);
    }
};

    const monthlyPackage = offerings?.premiumPlus?.availablePackages?.find(
        pkg => pkg.packageType === "MONTHLY"
    );
    const yearlyPackage = offerings?.premiumPlus?.availablePackages?.find(
        pkg => pkg.packageType === "ANNUAL"
    );

    const monthlyPrice = monthlyPackage?.product?.price;
    const yearlyPrice = yearlyPackage?.product?.price;
    const savings =
        monthlyPrice && yearlyPrice
            ? monthlyPrice * 12 - yearlyPrice
            : 0;

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
            style={{...globalStyles.primaryBtn,marginBottom:15}}
            onPress={() => handleUpgrade(monthlyPackage)}
            disabled={!monthlyPackage || purchasing}
        >
            <BodyText style={globalStyles.primaryBtnText}>
              {monthlyPackage
                ? `Upgrade Monthly • ${monthlyPackage?.product?.priceString}`
              : "Monthly subscription unavailable"
              }
            </BodyText>
        </TouchableOpacity>

        <TouchableOpacity
            style={{...globalStyles.secondaryBtn, marginBottom:15}}
            onPress={() => handleUpgrade(yearlyPackage)}
            disabled={!yearlyPackage || purchasing}
        >
            <BodyText style={globalStyles.secondaryBtnText}>
              {
                yearlyPackage
                  ? `Upgrade Yearly • ${yearlyPackage.product.priceString}`
                  : 'Yearly subscription unavailable'
              }
            </BodyText>

            <SecondaryText style={styles.saveText}>
                Save {savings}
            </SecondaryText>
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