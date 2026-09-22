import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Alert,
} from "react-native";

import {
  BodyText,
  SecondaryText,
  Input,
  TextArea,
  FormLabel,
} from "../../../src/components/ThemeProvider/components";

import { useSQLiteContext } from "expo-sqlite";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";

import AddEditModal from "../common/addEditModal";

import { waiveCreditBalance } from "../../../src/db/query/credits";


export default function WaiveDebtModal({
  visible,
  onClose,
  credit,
  onSuccess,
}) {
  const db = useSQLiteContext();
  const { globalStyles } = useThemeStyles();

  const remainingBalance = useMemo(
    () =>
      Math.max(
        Number(credit?.balance_due || 0),
        0
      ),
    [credit]
  );

  const [amount, setAmount] = useState(
    remainingBalance.toString()
  );

  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (visible) {
      setAmount(
        remainingBalance.toString()
      );

      setNote("");
    }
  }, [visible, remainingBalance]);


  const handleSave = async () => {
    try {
      const parsedAmount = Number(
        amount || 0
      );


      if (!parsedAmount || parsedAmount <= 0) {
        Alert.alert(
          "Invalid Amount",
          "Enter a valid amount to waive."
        );

        return;
      }


      if (parsedAmount > remainingBalance) {
        Alert.alert(
          "Amount Too Large",
          "The waived amount cannot exceed the remaining balance."
        );

        return;
      }


      setLoading(true);


      await waiveCreditBalance(db, {
        credit,
        amount: parsedAmount,
        note,
      });


      onSuccess?.();
      onClose?.();

    } catch (err) {
      console.error(
        "Failed to waive debt:",
        err
      );

      Alert.alert(
        "Failed",
        "Could not waive the debt. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };


  const handleWaiveFullBalance = () => {
    setAmount(
      remainingBalance.toString()
    );
  };


  return (
    <AddEditModal
      visible={visible}
    >

      {/* Header */}
      <View style={styles.header}>

        <BodyText style={styles.title}>
          Waive Debt
        </BodyText>

        <SecondaryText style={styles.subtitle}>
          Outstanding Balance:{" "}
          {remainingBalance.toLocaleString()}
        </SecondaryText>

      </View>


      {/* Information */}
      <View style={styles.warningBox}>

        <BodyText style={styles.warningTitle}>
          Forgive customer debt
        </BodyText>

        <SecondaryText style={styles.warningText}>
          This amount will no longer be considered
          collectible from the customer.
        </SecondaryText>

      </View>


      {/* Amount */}
      <View style={globalStyles.formGroup}>

        <View style={styles.amountHeader}>

          <FormLabel>
            Amount to Waive
          </FormLabel>

          <Pressable
            onPress={handleWaiveFullBalance}
          >
            <BodyText style={styles.fullAmountButton}>
              Waive Full Balance
            </BodyText>
          </Pressable>

        </View>

        <Input
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          style={styles.input}
        />

      </View>


      {/* Remaining balance preview */}
      <View style={styles.preview}>

        <SecondaryText>
          Remaining After Waiver
        </SecondaryText>

        <BodyText style={styles.remainingAmount}>
          {Math.max(
            remainingBalance -
              Number(amount || 0),
            0
          ).toLocaleString()}
        </BodyText>

      </View>


      {/* Note */}
      <View style={globalStyles.formGroup}>

        <FormLabel>
          Note
        </FormLabel>

        <TextArea
          value={note}
          onChangeText={setNote}
          placeholder="Why is this debt being waived? (Optional)"
          multiline
          style={[
            styles.input,
            styles.noteInput,
          ]}
        />

      </View>


      {/* Actions */}
      <View style={styles.actions}>

        <Pressable
          style={globalStyles.secondaryBtn}
          onPress={onClose}
          disabled={loading}
        >
          <BodyText
            style={
              globalStyles.secondaryBtnText
            }
          >
            Cancel
          </BodyText>
        </Pressable>


        <Pressable
          style={[
            globalStyles.primaryBtn,
            loading && {
              opacity: 0.7,
            },
          ]}
          onPress={handleSave}
          disabled={loading}
        >
          <BodyText
            style={
              globalStyles.primaryBtnText
            }
          >
            {loading
              ? "Saving..."
              : "Waive Debt"}
          </BodyText>
        </Pressable>

      </View>

    </AddEditModal>
  );
}


const styles = StyleSheet.create({
  header: {
    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 4,
  },

  warningBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    marginBottom: 20,
  },

  warningTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },

  warningText: {
    fontSize: 13,
    lineHeight: 19,
  },

  amountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  fullAmountButton: {
    fontSize: 12,
    fontWeight: "600",
  },

  input: {
    width: "100%",
  },

  preview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16,
  },

  remainingAmount: {
    fontSize: 18,
    fontWeight: "700",
  },

  noteInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    justifyContent: "flex-end",
  },
});

