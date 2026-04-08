import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { View, StyleSheet, Pressable, SectionList } from "react-native";
import { Card, BodyText, SecondaryText } from "../../../src/components/ThemeProvider/components";
import { AddButton } from "../../../src/components/common/AddButton";
import { useRouter } from "expo-router";
import { getTransactions, getTransactionStats } from "../../../src/db/transactionsDb";
import { useSQLiteContext } from "expo-sqlite";
import { dateFormat } from "../../../utils/dateFormat";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles"
import ButtonLinks from "../../../src/components/common/ButtonLinks";
import EmptyState from "../../../src/components/common/EmptyState";
import TimeFilters from "../../../src/components/common/TimeFilters";

export default function FinanceListPage() {
    const db = useSQLiteContext()
    const router = useRouter();
    const [transactions,setTransactions] = useState([])
    const [isLoading,setIsLoading] = useState(true)
    const isFocused = useIsFocused()
    const {globalStyles} = useThemeStyles()
    const [stats, setStats] = useState({
        profit: 0,
        revenue: 0,
        expenses: 0,
      });
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    let fetchTransactions = async() => {
        let transactions = await getTransactions(db, selectedMonth)
        setTransactions(transactions)
    }
    const fetchStats = async () => {
      const summary = await getTransactionStats(db,selectedMonth);
      setStats(summary);
    };

    useEffect(() => {
    if (isFocused) {
      fetchTransactions()
      fetchStats()
    }
    setIsLoading(false)
    },[isFocused, selectedMonth])

    const groupTransactions = (transactions) => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfWeek.getDate() - 7);

      const groups = {
        Today: [],
        Yesterday: [],
        "This Week": [],
        "Last Week": [],
        Older: [],
  };

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const dateStr = date.toISOString().slice(0, 10);

    if (dateStr === todayStr) {
      groups.Today.push(transaction);
    } else if (dateStr === yesterdayStr) {
      groups.Yesterday.push(transaction);
    } else if (date >= startOfWeek) {
      groups["This Week"].push(transaction);
    } else if (date >= startOfLastWeek && date < startOfWeek) {
      groups["Last Week"].push(transaction);
    } else {
      groups.Older.push(transaction);
    }
  });

  return Object.keys(groups)
    .map((key) => ({
      title: key,
      data: groups[key],
    }))
    .filter((section) => section.data.length > 0);
};

  const sections = groupTransactions(transactions);

  const renderItem = ({ item }) => (
    <Pressable onPress={() => router.push(`/transactions/${item.id}`)}>
      <Card>
        <View style={styles.row}>
          <View style={styles.left}>
            <BodyText
              style={styles.title}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {item.title}
            </BodyText>

            <SecondaryText
              style={styles.meta}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.category} • {dateFormat(item?.date)}
              {item.payee ? ` • ${item.payee}` : ""}
            </SecondaryText>
          </View>
          <BodyText
            style={[
              styles.amount,
              item.type === "expense" ? styles.expense : styles.income,
            ]}
          >
            {item.type === "expense" ? "-" : "+"}
            KES {Math.abs(item?.amount || 0).toLocaleString()}
          </BodyText>
        </View>
      </Card>
    </Pressable>
  );

    

  return (
    <View style={globalStyles.container}>
      <View style={styles.headerRow}>
        <BodyText style={globalStyles.title}>
          My Expenses
        </BodyText>
      </View>
      
      <>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <BodyText style={{ fontWeight: "bold", padding: 10 }}>
            {title}
          </BodyText>
        )}
        ListHeaderComponent={
          <ListHeader
            stats={stats}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        }
        ListEmptyComponent={
          <EmptyState 
            title="No transactions yet"
            description="Record a sale or expense to start tracking your business."
        />
        }
        contentContainerStyle={{ paddingBottom: 96 }}
      />
    </> 

      <AddButton 
        primaryAction={{route:"/transactions/add",label:"Add Expense"}}
        secondaryActions={[
          {route:"/categories/add/modal",label:"Add Category"},
          {route:"/transactions-templates/add/",label:"Add Template"},
        ]}
      />
  </View>
  )
}

const ListHeader = ({ stats, selectedMonth, onMonthChange}) => {
  return <>
    <TimeFilters 
          selectedMonth={selectedMonth}
          onMonthChange={onMonthChange}
        />
    <Card style={styles.balanceCard}>
      
      <SecondaryText style={styles.balanceLabel}>
        Net Profit
      </SecondaryText>
      <BodyText
        style={[
          styles.balanceAmount,
          { color: stats.netProfit >= 0 ? "#2E8B8B" : "#FF6B6B" },
        ]}
      >
        KES {stats?.netProfit?.toLocaleString()}
      </BodyText>
    </Card>

    <View style={styles.statRow}>
      <Card style={styles.statCard}>
        <SecondaryText style={styles.statLabel}>Revenue</SecondaryText>
        <BodyText style={[styles.statAmount, styles.income]}>
          +KES {stats.revenue.toLocaleString()}
        </BodyText>
      </Card>

      <Card style={styles.statCard}>
        <SecondaryText style={styles.statLabel}>Expenses</SecondaryText>
        <BodyText style={[styles.statAmount, styles.expense]}>
          -KES {stats.expenses.toLocaleString()}
        </BodyText>
      </Card>
      
    </View>

    <ButtonLinks 
      links={[
        {name:"View Templates", route:"/transactions-templates"},
       /*  {name:"View Statistics", route:"/transactions/stats"}, */
      ]}
    />
    
  </>
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
  },
  subHeader: {
    fontSize: 14,
    marginTop: 2,
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  viewStatsRow: {
    display:"flex",
    alignItems: "flex-end",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap:12,
    marginTop: 12,
  },

  viewStatsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E8B8B",
  },

  balanceCard: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left:{
    flex:1,
    marginRight:12,
    minWidth: 0,
  },
  statsButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  statsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E8B8B",
  },

  card: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontWeight: "600",
    maxWidth:"100%",
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 0,
  },
  income: {
    color: "#2E8B8B",
  },
  expense: {
    color: "#FF6B6B",
  },
});