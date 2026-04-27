import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, SectionList, StyleSheet, View } from "react-native";
import { BodyText, Card, SecondaryText } from "../../../src/components/ThemeProvider/components";
import { AddButton } from "../../../src/components/common/AddButton";
import ButtonLinks from "../../../src/components/common/ButtonLinks";
import EmptyState from "../../../src/components/common/EmptyState";
import TimeFilters from "../../../src/components/common/TimeFilters";
import { getExpenses } from "../../../src/db/expensesDb"
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { dateFormat } from "../../../utils/dateFormat";
import { groupDataIntoSections } from "../../../src/helpers";

export default function FinanceListPage() {
    const db = useSQLiteContext()
    const router = useRouter();
    const [expenses,setTransactions] = useState([])
    const [isLoading,setIsLoading] = useState(true)
    const isFocused = useIsFocused()
    const {globalStyles} = useThemeStyles()
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    let fetchExpenses = async() => {
        let expenses = await getExpenses(db, selectedMonth)
        setTransactions(expenses)
    }

    useEffect(() => {
    if (isFocused) {
      fetchExpenses()
    }
    setIsLoading(false)
    },[isFocused, selectedMonth])

  let grouped = groupDataIntoSections(expenses)

  const sections = [
    { title: "Today", data: grouped.today },
    { title: "Yesterday", data: grouped.yesterday },
    { title: "Earlier This Week", data: grouped.thisWeek },
    { title: "Earlier This Month", data: grouped.thisMonth },
    { title: "Older", data: grouped.older },
  ].filter(section => section.data.length > 0);

  const renderItem = ({ item }) => (
    <Pressable onPress={() => router.push(`/expenses/${item.id}`)}>
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
            style={[styles.amount, styles.expense]}
          >
            { "-"}
            {Math.abs(item?.amount || 0).toLocaleString()}
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
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        }
        ListEmptyComponent={
          <EmptyState 
            title="No expenses yet"
            description="Record a sale or expense to start tracking your business."
        />
        }
        contentContainerStyle={{ paddingBottom: 96 }}
      />
    </> 

      <AddButton 
        primaryAction={{route:"/expenses/add",label:"Add Expense"}}
        secondaryActions={[
          {route:"/expenses/categories/add/modal",label:"Add Category"},
          {route:"/expenses/templates/add/",label:"Add Template"},
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

    <ButtonLinks 
      links={[
        {name:"View Templates", route:"/expenses/templates"},
        {name:"View Categories", route:"/expenses/categories"},
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
  expense: {
    color: "#FF6B6B",
  },
});