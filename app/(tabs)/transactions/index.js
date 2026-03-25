import { View, Text, FlatList, StyleSheet } from "react-native";
import { getTransactions } from "../../../src/db/transactionsDb";

export default function TransactionsScreen() {
  const { transactions } = getTransactions();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transactions</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isSale = item.type === "sale";

          return (
            <View style={styles.card}>
              <View>
                <Text style={styles.type}>
                  {isSale ? "Sale" : "Expense"}
                </Text>

                {item.category && (
                  <Text style={styles.category}>{item.category}</Text>
                )}

                {item.note && (
                  <Text style={styles.note}>{item.note}</Text>
                )}
              </View>

              <Text
                style={[
                  styles.amount,
                  { color: isSale ? "green" : "red" },
                ]}
              >
                {isSale ? "+" : "-"} KES {item.amount}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions yet</Text>
        }
      />
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
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    marginBottom: 10,
  },
  type: {
    fontWeight: "bold",
  },
  category: {
    fontSize: 12,
    color: "gray",
  },
  note: {
    fontSize: 12,
    color: "#666",
  },
  amount: {
    fontWeight: "bold",
    fontSize: 16,
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "gray",
  },
});