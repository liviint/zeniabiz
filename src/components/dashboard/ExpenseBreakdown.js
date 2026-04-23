import { StyleSheet, Dimensions } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { PieChart } from "react-native-chart-kit";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Card,BodyText } from "../ThemeProvider/components";
import { getExpensesBreakDown } from "../../db/dashboardDb";
import { useThemeStyles } from "../../hooks/useThemeStyles";

const screenWidth = Dimensions.get("window").width;

export default function ExpenseBreakdown({timeState}) {
  const { colors:themeColors } = useThemeStyles()
  const isFocused = useIsFocused()
  const db = useSQLiteContext();
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, [isFocused, timeState]);

  const loadData = async () => {
    const result = await getExpensesBreakDown(db, timeState) 
    
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
      legendFontColor: themeColors.text,
      legendFontSize: 12,
    }));

    setData(formatted);
  };


  return (
    <Card >
      <BodyText style={styles.title}>Expense Breakdown</BodyText>

        {data?.length > 0 ? 
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
          : 
        <BodyText style={{ padding: 16 }}>No data yet</BodyText>
      }
    </Card>
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
  },
});