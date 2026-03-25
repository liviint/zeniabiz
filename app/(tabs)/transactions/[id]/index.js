import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  getTransactionById,
  removeTransaction,
} from "@/src/features/transactions/transactions.queries";

export default function TransactionDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    if (id) {
      const data = getTransactionById(id);
      setTransaction(data);
    }
  }, [id]);

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text>Transaction not found</Text>
      </View>
    );
  }

  const isSale = transaction.type === "sale";

  const handleDelete = () => {
    removeTransaction(transaction.id);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isSale ? "Sale" : "Expense"}
      </Text>

      <Text style={styles.amount}>
        {isSale ? "+" : "-"} KES {transaction.amount}
      </Text>

      {transaction.category && (
        <Text style={styles.label}>
          Category: {transaction.category}
        </Text>
      )}

      {transaction.note && (
        <Text style={styles.label}>
          Note: {transaction.note}
        </Text>
      )}

      <Text style={styles.date}>
        {new Date(transaction.created_at).toLocaleString()}
      </Text>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete</Text>
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
  },

  amount: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 10,
  },

  label: {
    fontSize: 16,
    marginTop: 5,
  },

  date: {
    marginTop: 10,
    color: "gray",
  },

  deleteBtn: {
    marginTop: 30,
    backgroundColor: "#ff4d4d",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
});