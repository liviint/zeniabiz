import { useIsFocused } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { StatCard } from "../common/StatCard";
import { getExpenseStats } from "../../db/transactionsDb";
import { useThemeStyles } from "../../hooks/useThemeStyles";

export default function SummaryCards({ refreshKey }) {
  const { colors } = useThemeStyles()
  const isFocused = useIsFocused();
  const db = useSQLiteContext();

  const [stats, setStats] = useState({
    revenue: 0,
    expenses: 0,
    cost: 0,
    grossProfit: 0,
    netProfit: 0,
    stockValue: 0,
  });

  const fetchStats = async () => {
    const summary = await getExpenseStats(db);
    setStats(summary);
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey, isFocused]);

  const formatNumber = (num) =>
    Number(num || 0).toLocaleString();

  const isProfitPositive = stats.netProfit >= 0;

  return (
    <View style={styles.container}>
      {/* ROW 1 */}
      <View style={styles.row}>
        <StatCard
          label="Revenue"
          value={formatNumber(stats.revenue)}
          subText="Total income"
          color="#2E8B8B"
        />

        <StatCard
          label="Expenses"
          value={formatNumber(stats.expenses)}
          subText="Operating costs"
          color="#FF6B6B"
        />
      </View>

      {/* ROW 2 */}
      <View style={styles.row}>
        <StatCard
          label="Gross Profit"
          value={formatNumber(stats.grossProfit)}
          subText="Revenue - Cost of goods"
          color="#2E8B8B"
        />

        <StatCard
          label="Net Profit"
          value={formatNumber(stats.netProfit)}
          subText={
            isProfitPositive
              ? "You're profitable 📈"
              : "You're losing money 📉"
          }
          color={isProfitPositive ? "#2E8B8B" : "#FF6B6B"}
        />
      </View>

      {/* ROW 3 (optional but powerful) */}
      <View style={styles.row}>
        <StatCard
          label="Stock Value"
          value={formatNumber(stats.stockValue)}
          subText="Inventory worth"
          color={colors.text}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    marginTop: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});