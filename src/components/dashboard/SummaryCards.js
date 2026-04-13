// components/dashboard/SummaryCards.js
import { View, StyleSheet } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

import { StatCard } from "../common/StatCard"; // adjust path if needed

export default function SummaryCards({ refreshKey }) {
  const db = useSQLiteContext();

  const [data, setData] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    stockValue: 0,
  });

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      const revenueRes = await db.getFirstAsync(`
        SELECT SUM(amount) as total 
        FROM expenses 
        WHERE type='income' AND deleted_at IS NULL
      `);

      const expenseRes = await db.getFirstAsync(`
        SELECT SUM(amount) as total 
        FROM expenses 
        WHERE type='expense' AND deleted_at IS NULL
      `);

      const stockRes = await db.getFirstAsync(`
        SELECT SUM(stock_quantity * cost_price) as total 
        FROM products
        WHERE deleted_at IS NULL
      `);

      const revenue = revenueRes?.total || 0;
      const expenses = expenseRes?.total || 0;
      const stockValue = stockRes?.total || 0;
      const profit = revenue - expenses;

      setData({
        revenue,
        expenses,
        profit,
        stockValue,
      });
    } catch (err) {
      console.log("Dashboard error:", err);
    }
  };

  const formatKES = (num) =>
    `${Number(num || 0).toLocaleString()}`;

  return (
    <View style={styles.container}>
      {/* ROW 1 */}
      <View style={styles.row}>
        <StatCard
          label="Revenue"
          value={formatKES(data.revenue)}
          subText="Total income"
          color="#2E8B8B"
        />

        <StatCard
          label="Expenses"
          value={formatKES(data.expenses)}
          subText="Total spending"
          color="#FF6B6B"
        />
      </View>

      {/* ROW 2 */}
      <View style={styles.row}>
        <StatCard
          label="Profit"
          value={formatKES(data.profit)}
          subText={
            data.profit >= 0 ? "You're making money" : "You're losing money"
          }
          color={data.profit >= 0 ? "#2E8B8B" : "#FF6B6B"}
        />

        <StatCard
          label="Stock Value"
          value={formatKES(data.stockValue)}
          subText="Inventory worth"
          color="#2E8B8B"
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