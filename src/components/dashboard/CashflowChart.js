import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

const screenWidth = Dimensions.get("window").width;

export default function CashflowChart() {
  const db = useSQLiteContext();
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });

  useEffect(() => {
    loadChart();
  }, []);

  const loadChart = async () => {
    const result = await db.getAllAsync(`
      SELECT 
        date,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as net
      FROM expenses
      WHERE deleted_at IS NULL
      GROUP BY date
      ORDER BY date ASC
      LIMIT 7
    `);

    const labels = result.map((item) =>
      new Date(item.date).getDate().toString()
    );

    const data = result.map((item) => item.net || 0);

    setChartData({
      labels,
      datasets: [{ data }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cashflow (Last 7 days)</Text>

      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#FAF9F7",
  backgroundGradientTo: "#FAF9F7",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(46, 139, 139, ${opacity})`, // #2E8B8B
  labelColor: () => "#333",
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#FF6B6B",
  },
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