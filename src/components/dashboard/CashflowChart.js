import { Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { chartConfig } from "../../helpers";
import { Card, BodyText } from "../ThemeProvider/components";

const screenWidth = Dimensions.get("window").width;

export default function CashflowChart() {
  const {colors} = useThemeStyles()
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
    console.log(chartData,"hello chart data")
    setChartData({
      labels,
      datasets: [{ data }],
    });
  };

  if (!chartData.datasets[0]?.data?.length) {
  return <Text style={{ padding: 16 }}>No data yet</Text>;
}

  return (
    <Card >
      <BodyText style={styles.title}>Cashflow (Last 7 days)</BodyText>

      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig(colors.primary,colors)}
        bezier
        style={{ borderRadius: 16 }}
      /> 
    </Card>
  );
}



const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
});