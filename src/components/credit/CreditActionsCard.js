import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import {
  BodyText,
  Card,
  SecondaryText,
} from "../../../src/components/ThemeProvider/components";

export function CreditActionsCard({
  credit,
  onAddPayment,
  onMarkPaid,
}) {
  const router = useRouter();

  const remainingBalance = Math.max(
    Number(credit.balance_due || 0),
    0
  );

  const isFullyPaid = remainingBalance <= 0;

  const handleMarkPaid = () => {
    Alert.alert(
      "Mark Credit as Paid",
      `Offset remaining balance of ${remainingBalance.toLocaleString()}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => {
            onMarkPaid?.();
          },
        },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      <SecondaryText style={styles.label}>
        Credit Actions
      </SecondaryText>

      <View style={styles.actions}>
        {/* Record Payment */}
        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={onAddPayment}
        >
          <BodyText style={styles.primaryButtonText}>
            Record Payment
          </BodyText>
        </Pressable>

        {/* Offset Remaining */}
        {!isFullyPaid && (
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={handleMarkPaid}
          >
            <BodyText style={styles.secondaryButtonText}>
              Offset Balance
            </BodyText>
          </Pressable>
        )}

        {/* View Customer */}
        {!!credit.customer_id && (
          <Pressable
            style={[styles.button, styles.outlineButton]}
            onPress={() =>
              router.push(
                `/customers/${credit.customer_id}`
              )
            }
          >
            <BodyText style={styles.outlineButtonText}>
              View Customer
            </BodyText>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    marginBottom: 14,
  },

  actions: {
    gap: 12,
  },

  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButton: {
    backgroundColor: "#2E8B8B",
  },

  secondaryButton: {
    backgroundColor: "#FF6B6B",
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  outlineButtonText: {
    fontWeight: "600",
  },
});