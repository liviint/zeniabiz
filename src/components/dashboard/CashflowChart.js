import { StyleSheet, Dimensions } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { chartConfig } from "../../helpers";
import { Card, BodyText } from "../ThemeProvider/components";
import { getCashFlow } from "../../db/dashboardDb";

const screenWidth = Dimensions.get("window").width;
export default function CashflowChart() {
  const isFocused = useIsFocused()
  const {colors} = useThemeStyles()
  const db = useSQLiteContext();
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });

  useEffect(() => {
    loadChart();
  }, [isFocused]);

  const loadChart = async () => {
    let res = await getCashFlow(db)
    setChartData(res);
  };

  return (
    <Card >
      <BodyText style={styles.title}>Cashflow (Last 7 days)</BodyText>

      {
        chartData.datasets[0]?.data?.length ? 
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig(colors.primary,colors)}
          bezier
          style={{ borderRadius: 16 }}
      /> 
      : 
      <BodyText style={{ padding: 16 }}>No data yet</BodyText>
    }
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