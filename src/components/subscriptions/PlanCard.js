import {
    View,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { useThemeStyles } from "@/src/hooks/useThemeStyles";
import {
    BodyText,
    SecondaryText,
    Card,
} from "@/src/components/ThemeProvider/components";

 const PlanCard = ({
  title,
  badge,
  offering,
  features,
  isActive,
  handlePurchase
}) => {

    const { globalStyles } = useThemeStyles()
  if (!offering) return null;

  const monthlyPackage = offering.availablePackages.find(
    (pkg) => pkg.packageType === "MONTHLY"
  );

  const yearlyPackage = offering.availablePackages.find(
    (pkg) => pkg.packageType === "ANNUAL"
  );

  const monthlyPrice = monthlyPackage?.product.price;
const yearlyPrice = yearlyPackage?.product.price;
    const savings =
        monthlyPrice && yearlyPrice
            ? monthlyPrice * 12 - yearlyPrice
            : 0;

  

  return (
    <Card>
      {/* Header */}
      <View style={styles.cardHeader}>
        <BodyText style={styles.cardTitle}>{title}</BodyText>

        {!!badge && (
          <View style={styles.badge}>
            <SecondaryText style={styles.badgeText}>
              {badge}
            </SecondaryText>
          </View>
        )}
      </View>

      {/* Active subscription */}
      {isActive && (
        <View style={styles.currentPlan}>
          <BodyText style={styles.currentPlanText}>
            ✓ Current Plan
          </BodyText>
        </View>
      )}

      {/* Features */}
      <View style={styles.featuresContainer}>
        {features.map((feature) => (
          <SecondaryText
            key={feature}
            style={styles.feature}
          >
            ✓ {feature}
          </SecondaryText>
        ))}
      </View>

      {/* Monthly */}
      {monthlyPackage && (
        <TouchableOpacity
          style={{...globalStyles.primaryBtn,marginBottom:15}}
          disabled={isActive}
          onPress={() => handlePurchase(monthlyPackage)}
        >
          <BodyText style={globalStyles.primaryBtnText}>
            Monthly • {monthlyPackage.product.priceString}
          </BodyText>
        </TouchableOpacity>
      )}

      {/* Yearly */}
      {yearlyPackage && (
        <TouchableOpacity
          style={globalStyles.secondaryBtn}
          disabled={isActive}
          onPress={() => handlePurchase(yearlyPackage)}
        >
          <BodyText style={globalStyles.secondaryBtnText}>
            Yearly • {yearlyPackage.product.priceString}
          </BodyText>

          <SecondaryText style={styles.saveText}>
            Save {savings}
          </SecondaryText>
        </TouchableOpacity>
      )}
    </Card>
  );
};

export default PlanCard

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },

  badge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 10,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  currentPlan: {
    alignSelf: "flex-start",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 18,
  },

  currentPlanText: {
    fontWeight: "700",
  },

  featuresContainer: {
    marginBottom: 20,
  },

  feature: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
  },

  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    fontWeight: "700",
    fontSize: 16,
  },

  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },

  saveText: {
    fontSize: 12,
    marginTop: 4,
  },
});