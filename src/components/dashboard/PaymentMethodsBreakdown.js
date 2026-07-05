import { StyleSheet, Dimensions } from "react-native";
import { useSelector } from "react-redux";
import { useIsFocused } from "@react-navigation/native";
import { PieChart } from "react-native-chart-kit";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Card, BodyText } from "../ThemeProvider/components";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { getPaymentsBreakdown } from "../../db/query/dashboard";
import { useDeferredEffect } from "../../hooks/useDeferredEffect";

const screenWidth = Dimensions.get("window").width;

export default function PaymentMethodsBreakdown({ timeState }) {
  const { colors: themeColors } = useThemeStyles();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const [data, setData] = useState([]);
  const lastSyncedAt = useSelector((state) => state.sync.lastSyncedAt);


  useDeferredEffect(async (isMounted) => {
      const result = await getPaymentsBreakdown(db, timeState);

      const colors = [
        "#2E8B8B",
        "#FF6B6B",
        "#6C5CE7",
        "#00B894",
        "#F39C12",
      ];

      const formatted = result.map((item, index) => ({
        name: formatMethod(item.payment_method),
        amount: item.total,
        color: colors[index % colors.length],
        legendFontColor: themeColors.text,
        legendFontSize: 12,
      }));

    
    if (isMounted()) {
      setData(formatted);
    }
  }, [db, isFocused, timeState, lastSyncedAt],{enabled: isFocused,});

  return (
    <Card>
      <BodyText style={styles.title}>
        Payment Methods Breakdown
      </BodyText>

      {data?.length > 0 ? (
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
      ) : (
        <BodyText style={{ padding: 16 }}>
          No payment data yet
        </BodyText>
      )}
    </Card>
  );
}

const formatMethod = (method) => {
  switch (method) {
    case "cash":
      return "Cash";
    case "mpesa":
      return "M-Pesa";
    case "card":
      return "Card";
    case "bank":
      return "Bank Transfer";
    default:
      return "Other";
  }
};

const chartConfig = {
  color: () => "#2E8B8B",
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
});