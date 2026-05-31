import { useIsFocused } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, SectionList, StyleSheet, View, RefreshControl } from "react-native";
import { BodyText, Card, SecondaryText } from "../../../src/components/ThemeProvider/components";
import { AddButton } from "../../../src/components/common/AddButton";
import ButtonLinks from "../../../src/components/common/ButtonLinks";
import EmptyState from "../../../src/components/common/EmptyState";
import { getExpenses } from "../../../src/db/expensesDb"
import { getCategories } from "../../../src/db/categoriesDb";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { dateFormat } from "../../../utils/dateFormat";
import { groupDataIntoSections } from "../../../src/helpers";
import { useManualSync } from "../../../src/hooks/useManualSync";
import { setCategoriesMap } from "../../../src/store/features/cetegoriesSlice";
import TimeNavigator from "../../../src/components/common/TimeNavigator"
import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { StatCard } from "../../../src/components/common/StatCard";

export default function FinanceListPage() {
    const { onRefresh, refreshing } = useManualSync();
    const db = useSQLiteContext()
    const router = useRouter();
    const dispatch = useDispatch()
    const [expenses,setTransactions] = useState([])
    const [stats, setStats] = useState({})
    const [categoriesMap,setCategoriesMapLocal] = useState({})
    const [isLoading,setIsLoading] = useState(true)
    const isFocused = useIsFocused()
    const {globalStyles} = useThemeStyles()
    const [timeState, setTimeState] = useState(createRange("month"));
    const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);

    const loadCategories = async () => {
      const categories = await getCategories(db)
      let map = {}
      categories.map(cat => {
        map[cat.id] = cat.name
      })
      dispatch(setCategoriesMap(map))
      setCategoriesMapLocal(map)
    };
    

    let fetchExpenses = async() => {
        let expenses = await getExpenses(db, timeState)
        setTransactions(expenses)
    }

    useEffect(() => {
      if (isFocused) {
        fetchExpenses()
        loadCategories()
      }
        setIsLoading(false)
    },[isFocused, timeState,lastSyncedAt])

    useEffect(() => {
      setStats({
        count:expenses.length,
        total:expenses.reduce((sum,expense) => sum + expense.amount,0)
      })
    },[expenses])

  let grouped = groupDataIntoSections(expenses)

  const sections = [
    { title: "Today", data: grouped.today },
    { title: "Yesterday", data: grouped.yesterday },
    { title: "Earlier This Week", data: grouped.thisWeek },
    { title: "Earlier This Month", data: grouped.thisMonth },
    { title: "Older", data: grouped.older },
  ].filter(section => section.data.length > 0);

  const renderItem = ({ item }) => (
    <Pressable
        onPress={() => router.push(`/expenses/${item.id}`)
      }
    >
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
              {categoriesMap[item.category_id]} • {dateFormat(item?.date)}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <BodyText style={{ fontWeight: "bold", padding: 10 }}>
            {title}
          </BodyText>
        )}
        ListHeaderComponent={
          <ListHeader
            stats={stats}
            expenses={expenses}
            timeState={timeState}
            setTimeState={setTimeState}
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

const ListHeader = ({ stats, timeState,setTimeState, expenses}) => {
  return <>
    <TimeNavigator
          state={timeState}
          onChange={setTimeState}
      /> 

    <ButtonLinks 
      links={[
        {name:"View Templates", route:"/expenses/templates"},
        {name:"View Categories", route:"/expenses/categories"},
      ]}
    />

    {expenses.length ? 
        <View style={styles.statsRow}>
          <StatCard
            label="Total spent"
            value={stats?.total?.toLocaleString()}
            subText=""
            color="#FF6B6B"
          />

          <StatCard
            label="Expenses count"
            value={stats?.count?.toLocaleString()}
            subText=""
            color="#FF6B6B"
          />
        </View>
        :""
      }

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
  statsRow:{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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