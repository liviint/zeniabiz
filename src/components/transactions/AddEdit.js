import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import {
  upsertTransaction
} from "../../db/transactionsDb";

export default function AddEdit() {
  const [type, setType] = useState<"sale" | "expense">("sale");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("Stock");

  const handleSave = () => {
    const value = Number(amount);

    if (!value) return;

    if (type === "sale") {
      upsertTransaction(value, note);
    } else {
      upsertTransaction(value, category, note);
    }

    // reset form
    setAmount("");
    setNote("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Transaction</Text>

      {/* Toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            type === "sale" && styles.activeSale,
          ]}
          onPress={() => setType("sale")}
        >
          <Text style={styles.toggleText}>Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            type === "expense" && styles.activeExpense,
          ]}
          onPress={() => setType("expense")}
        >
          <Text style={styles.toggleText}>Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <TextInput
        placeholder="Enter amount (KES)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />

      {/* Category (only for expense) */}
      {type === "expense" && (
        <TextInput
          placeholder="Category (e.g. Stock, Transport)"
          value={category}
          onChangeText={setCategory}
          style={styles.input}
        />
      )}

      {/* Note */}
      <TextInput
        placeholder="Note (optional)"
        value={note}
        onChangeText={setNote}
        style={styles.input}
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  toggle: {
    flexDirection: "row",
    marginBottom: 15,
  },

  toggleBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  activeSale: {
    backgroundColor: "#d4edda",
  },

  activeExpense: {
    backgroundColor: "#f8d7da",
  },

  toggleText: {
    fontWeight: "bold",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  button: {
    backgroundColor: "#2E8B8B", // Zenia color
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});