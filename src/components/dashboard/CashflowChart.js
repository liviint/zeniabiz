import { useIsFocused } from 'expo-router';
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useSelector } from "react-redux";
import { getCashFlow } from "../../db/query/dashboard";
import { chartConfig } from "../../helpers";
import { useDeferredEffect } from "../../hooks/useDeferredEffect";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { BodyText, Card } from "../ThemeProvider/components";

const screenWidth = Dimensions.get("window").width;
export default function CashflowChart({timeState}) {
  const isFocused = useIsFocused()
  const {colors} = useThemeStyles()
  const db = useSQLiteContext();
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);


  useDeferredEffect(async (isMounted) => {
    let res = await getCashFlow(db, timeState)
  
      if (isMounted()) {
        setChartData(res);
      }

    }, [db, isFocused, timeState, lastSyncedAt],{enabled: isFocused,});


  return (
    <Card >
      <BodyText style={styles.title}>Cashflow</BodyText>

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