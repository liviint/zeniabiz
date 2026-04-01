import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity,StyleSheet, ActivityIndicator, Alert } from "react-native";
import Purchases from 'react-native-purchases';
import { useThemeStyles } from "@/src/hooks/useThemeStyles";
import {  BodyText, SecondaryText } from "@/src/components/ThemeProvider/components";

const SupportPage = () => {
  const {globalStyles} = useThemeStyles()
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchProducts = async () => {
    try {
      const offerings = await Purchases.getOfferings();

      if (offerings.current) {
        setProducts(offerings.current.availablePackages);
      } else {
        Alert.alert(
          "Unavailable",
          "Support options are not available right now. Please try again later."
        );
      }

    } catch (err) {
      console.warn("RevenueCat fetch error", err);

      let message = "Something went wrong. Please try again.";

      if (err.message?.includes("network")) {
        message = "No internet connection. Please check and try again.";
      }

      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, []);

  const handlePurchase = async (pkg) => {
    try {
      await Purchases.purchasePackage(pkg);

      Alert.alert("Thank you 💖", "Your support keeps ZeniaBiz running!");

    } catch (err) {
      console.warn("Purchase error", err);

      if (!err.userCancelled) {
        Alert.alert(
          "Payment failed",
          "Your payment didn't go through. Please try again."
        );
      }
    }
  };

  return (
  <View style={{...globalStyles.container,...styles.container}}>
    
    <BodyText style={globalStyles.title}>❤️ Support ZeniaBiz</BodyText>

    <BodyText style={styles.subtitle}>
      This app is free. Your support helps keep it growing for everyone.
    </BodyText>

    <View style={styles.divider} />

    {/* Loading */}
    {loading ? (
      <ActivityIndicator size="large" color="#FF6B6B" />
    ) : products.length > 0 ? (

      <>
        {/* Support Options */}
        {products.map((pkg) => (
          <TouchableOpacity
            key={pkg.identifier}
            style={styles.card}
            onPress={() => handlePurchase(pkg)}
            activeOpacity={0.85}
          >
            <Text style={styles.amount}>
              {pkg.product.priceString}
            </Text>

            <Text style={styles.label}>
              {pkg.product.title.split("(")[0].trim()}
            </Text>
          </TouchableOpacity>
        ))}

        <SecondaryText style={styles.microcopy}>
          No subscription • Secure via Google Play (M-Pesa supported)
        </SecondaryText>
      </>

    ) : (
      <Text style={styles.error}>
        Support options unavailable. Please try again later.
      </Text>
    )}

  </View>
);
};

export default SupportPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF6B6B",
    marginBottom: 10,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },

  divider: {
    height: 1,
    width: "80%",
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 20,
  },

  card: {
    width: "90%",
    backgroundColor: "#FF6B6B",
    paddingVertical: 18,
    borderRadius: 16,
    marginVertical: 8,
    alignItems: "center",
  },

  amount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FAF9F7",
  },

  label: {
    fontSize: 14,
    color: "#FAF9F7",
    opacity: 0.9,
    marginTop: 4,
  },

  microcopy: {
    marginTop: 20,
    fontSize: 13,
    textAlign: "center",
  },

  error: {
    color: "#999",
    textAlign: "center",
  },
});