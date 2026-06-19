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
import { useSQLiteContext } from "expo-sqlite";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import PaymentMethodPicker from "../sales/PaymentMethodsPicker";
import { recordCreditPayment } from "../../../src/db/query/credits";

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

  const [paymentMethod, setPaymentMethod] = useState("cash");

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

      await recordCreditPayment(db, {
        credit,
        amount: parsedAmount,
        paymentMethod,
        note,
      });

      onSuccess?.();
      onClose?.();
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

            <PaymentMethodPicker 
              value={paymentMethod}
              handleMethodChange={(val) => setPaymentMethod(val)}
            />

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