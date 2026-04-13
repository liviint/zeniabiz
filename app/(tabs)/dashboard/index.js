import { View, ScrollView, StyleSheet, Text, RefreshControl } from "react-native";
import { useState, useCallback } from "react";

import SummaryCards from "../../../src/components/dashboard/SummaryCards"
import CashflowChart from "../../../src/components/dashboard/CashflowChart";
import ExpenseBreakdown from "../../../src/components/dashboard/ExpenseBreakdown";

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Zeniabiz Dashboard</Text>
        <Text style={styles.subtitle}>
          Track your business performance
        </Text>
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* SUMMARY */}
        <SummaryCards />

        {/* CASHFLOW */}
        <CashflowChart />

        {/* EXPENSES */}
        <ExpenseBreakdown />

        {/* SPACING */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F7", // brand background
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FAF9F7",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333333",
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
});