import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { View, StyleSheet } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { StatCard } from "../common/StatCard";
import {getFinancialStats } from "../../db/dashboardDb";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { SecondaryText } from "../ThemeProvider/components";

export default function SummaryCards({ isSyncing,timeState }) {
  const { colors } = useThemeStyles()
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);

  const [stats, setStats] = useState({
    revenue: 0,
    expenses: 0,
    cashCollected:0,
    outstandingCredit:0,
    cost: 0,
    grossProfit: 0,
    netProfit: 0,
    stockValue: 0,
  });

  const fetchStats = async () => {
    const summary = await getFinancialStats(db,timeState);
    setStats(summary);
  };

  useEffect(() => {
    fetchStats();
  }, [lastSyncedAt, isFocused, timeState]);

  const formatNumber = (num) =>
    Number(num || 0).toLocaleString();

  const availableCash = stats.availableCash;
  const isPositiveCash = availableCash > 0;
  const isZeroCash = availableCash === 0;
  const cashRemark = isZeroCash
    ? "No cash available right now"
    : isPositiveCash
      ? "Cash flow is healthy"
      : "Cash flow is tight";

  const isProfitPositive = stats.netProfit >= 0;
  const profitRemark = stats.netProfit === 0 ? "" : stats.netProfit > 0
            ? "You're making money 📈"
            : "You're losing money 📉"

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatCard
          label="Cash on Hand"
          value={formatNumber(stats.availableCash)}
          subText={cashRemark}
          color={isPositiveCash ? "#2E8B8B" : "#FF6B6B"}
          style={heroStyles.card}
          labelStyle={heroStyles.label}
          valueStyle={heroStyles.value}
          subTextStyle={heroStyles.subText}
        />
      
      </View>
      <View style={{
        marginVertical: 10,
        borderTopWidth: 1,
        borderColor:colors.text,
        opacity: 0.08
      }} 
    />

    <View style={styles.breakdown}>
      <SecondaryText style={{ marginLeft: 8, marginBottom: 4, opacity: 0.6 }}>
      Breakdown
    </SecondaryText>
      <View style={styles.row}>
        <StatCard
          label="Revenue"
          value={formatNumber(stats.revenue)}
          subText="Sales made"
          color="#2E8B8B"
        />

        <StatCard
          label="Cost"
          value={formatNumber(stats.cost)}
          subText="Cost of Goods"
          color="#FF6B6B"
        />
        
      </View>

      <View style={styles.row}>
        <StatCard
          label="Gross Profit"
          value={formatNumber(stats.grossProfit)}
          subText="Revenue - Cost of goods"
          color="#2E8B8B"
        />
        <StatCard
          label="Expenses"
          value={formatNumber(stats.expenses)}
          subText="Business expenses"
          color="#FF6B6B"
        />
      </View>
      <View style={styles.row}>
        <StatCard
          label="Cash Collected"
          value={formatNumber(stats.cashCollected)}
          subText="Payments received"
          color="#2E8B8B"
        />
        <StatCard
          label="Outstanding Credit"
          value={formatNumber(stats.outstandingCredit)}
          subText="Customer balances"
          color="#FF6B6B"
        />
      </View>
    </View>

      <View style={styles.row}>
        <StatCard
          label="Net Profit"
          value={formatNumber(stats.netProfit)}
          subText={profitRemark}
          color={isProfitPositive ? "#2E8B8B" : "#FF6B6B"}
          style={heroStyles.card}
          labelStyle={heroStyles.label}
          valueStyle={heroStyles.value}
          subTextStyle={heroStyles.subText}
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

  heroCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const heroStyles = {
  card: {
    padding: 24,
    borderRadius: 24,
    margin: 12,
    alignItems: "center",

    // Softer, premium feel
    elevation: 6,

    // Add subtle emphasis
    transform: [{ scale: 1.02 }],
  },

  label: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  value: {
    fontSize: 34, // bigger than normal cards
    fontWeight: "800",
    marginBottom: 6,
  },

  subText: {
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    opacity: 0.8,
  },
};