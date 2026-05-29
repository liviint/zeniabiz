import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  Alert,
} from "react-native";

import {
  BodyText,
  Card,
  SecondaryText,
  Input,
  TextArea,
  FormLabel
} from "../../../src/components/ThemeProvider/components";
import { newUuid } from "../../db/utils";
import { useSQLiteContext } from "expo-sqlite";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";

export default function RecordPaymentModal({
  visible,
  onClose,
  credit,
  onSuccess,
}) {
    const db = useSQLiteContext();
    const { globalStyles } = useThemeStyles();
  const remainingBalance = useMemo(
    () => Math.max(Number(credit?.balance_due || 0), 0),
    [credit]
  );

  const [amount, setAmount] = useState(
    remainingBalance.toString()
  );

  const [paymentMethod, setPaymentMethod] =
    useState("cash");

  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount(remainingBalance.toString());
      setPaymentMethod("cash");
      setNote("");
    }
  }, [visible, remainingBalance]);

    const handleSave = async () => {
        try {
            const parsedAmount = Number(amount || 0);

            if (!parsedAmount || parsedAmount <= 0) {
                Alert.alert(
                "Invalid Amount",
                "Enter a valid payment amount."
                );
                return;
            }

            if (parsedAmount > remainingBalance) {
                Alert.alert(
                "Amount Too Large",
                "Payment cannot exceed remaining balance."
                );
                return;
            }

            setLoading(true);

            const now = new Date().toISOString();

            const newAmountPaid =
                Number(credit.amount_paid || 0) +
                parsedAmount;

            const newBalance =
                Number(credit.total_amount || 0) -
                newAmountPaid;

            const paymentStatus =
                newBalance <= 0 ? "PAID" : "PARTIAL";

        await db.runAsync("BEGIN");

        try {
            // 1. Insert payment
            await db.runAsync(
            `
            INSERT INTO payments (
                id,
                company,
                sale_id,
                customer_id,
                payment_type,
                amount,
                payment_method,
                note,
                date,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                newUuid(),
                credit.company,
                credit.id,
                credit.customer_id,
                "OFFSET",
                parsedAmount,
                paymentMethod,
                note || null,
                now,
                now,
                now,
            ]
            );

            // 2. Update sale
            await db.runAsync(
            `
            UPDATE sales
            SET
                amount_paid = ?,
                balance_due = ?,
                payment_status = ?,
                updated_at = ?
            WHERE id = ?
            `,
            [
                newAmountPaid,
                Math.max(newBalance, 0),
                paymentStatus,
                now,
                credit.id,
            ]
            );

            await db.runAsync("COMMIT");

            onSuccess?.();

            onClose?.();
        } catch (err) {
            await db.runAsync("ROLLBACK");
            throw err;
        }
        } catch (err) {
        console.log(err);

        Alert.alert(
            "Failed",
            "Could not record payment."
        );
        } finally {
        setLoading(false);
        }
    };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Card>
            {/* Header */}
            <View style={styles.header}>
              <BodyText style={styles.title}>
                Record Payment
              </BodyText>

              <SecondaryText style={styles.subtitle}>
                Remaining Balance:
                {" "}
                {remainingBalance.toLocaleString()}
              </SecondaryText>
            </View>

            {/* Amount */}
            <View style={globalStyles.formGroup}>
              <FormLabel >
                Amount
              </FormLabel>

              <Input
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                style={styles.input}
              />
            </View>

            {/* Payment Method */}
            <View style={globalStyles.formGroup}>
              <SecondaryText style={styles.label}>
                Payment Method
              </SecondaryText>

              <Input
                value={paymentMethod}
                onChangeText={setPaymentMethod}
                placeholder="cash"
                style={styles.input}
              />
            </View>

            {/* Note */}
            <View style={globalStyles.formGroup}>
              <FormLabel style={styles.label}>
                Note
              </FormLabel>

              <TextArea
                value={note}
                onChangeText={setNote}
                placeholder="Optional note"
                multiline
                style={[styles.input, styles.noteInput]}
              />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                style={globalStyles.secondaryBtn}
                onPress={onClose}
              >
                <BodyText style={globalStyles.secondaryBtnText}>
                  Cancel
                </BodyText>
              </Pressable>

              <Pressable
                style={[
                  globalStyles.primaryBtn,
                  loading && { opacity: 0.7 },
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                <BodyText style={globalStyles.primaryBtnText}>
                  {loading
                    ? "Saving..."
                    : "Save Payment"}
                </BodyText>
              </Pressable>
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
  },

  container: {
    padding: 16,
    paddingBottom: 28,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 4,
  },

  noteInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    justifyContent:"flex-end",
  },

  saveText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});