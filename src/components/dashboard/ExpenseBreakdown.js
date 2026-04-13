import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

const screenWidth = Dimensions.get("window").width;

export default function ExpenseBreakdown() {
  const db = useSQLiteContext();
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const result = await db.getAllAsync(`
      SELECT category, SUM(amount) as total
      FROM expenses
      WHERE type='expense' AND deleted_at IS NULL
      GROUP BY category
    `);

    const colors = [
      "#FF6B6B",
      "#2E8B8B",
      "#F4E1D2",
      "#6C5CE7",
      "#00B894",
    ];

    const formatted = result.map((item, index) => ({
      name: item.category || "Other",
      amount: item.total,
      color: colors[index % colors.length],
      legendFontColor: "#333",
      legendFontSize: 12,
    }));

    setData(formatted);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expense Breakdown</Text>

      <PieChart
        data={data}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
}

const chartConfig = {
  color: () => "#2E8B8B",
};

const styles = StyleSheet.create({
  container: {
    margin: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333333",
  },
});