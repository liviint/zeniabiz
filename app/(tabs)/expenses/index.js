import { useIsFocused, useRouter } from 'expo-router';

import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    Pressable,
    RefreshControl,
    SectionList,
    StyleSheet,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { BodyText, Card, SecondaryText } from "../../../src/components/ThemeProvider/components";
import { AddButton } from "../../../src/components/common/AddButton";
import ButtonLinks from "../../../src/components/common/ButtonLinks";
import EmptyState from "../../../src/components/common/EmptyState";
import PageLoader from "../../../src/components/common/PageLoader";
import { StatCard } from "../../../src/components/common/StatCard";
import TimeNavigator from "../../../src/components/common/TimeNavigator";
import { getCategories } from "../../../src/db/query/categories";
import { getExpenses } from "../../../src/db/query/expenses";
import { getSetting } from "../../../src/db/query/settings";
import { groupDataIntoSections } from "../../../src/helpers";
import { useDeferredEffect } from "../../../src/hooks/useDeferredEffect";
import { useManualSync } from "../../../src/hooks/useManualSync";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { setCategoriesMap } from "../../../src/store/features/cetegoriesSlice";
import { canViewReports } from "../../../src/utils/rolesAndPermissions";
import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { dateFormat } from "../../../utils/dateFormat";

export default function ExpensesListPage() {
    const { onRefresh, refreshing } = useManualSync();
    const db = useSQLiteContext()
    const router = useRouter();
    const dispatch = useDispatch()

    const [isAllowedToViewReports,setIsAllowedToViewReports] = useState(canViewReports())

    const [expenses,setTransactions] = useState([])
    const [stats, setStats] = useState({})
    const [categoriesMap,setCategoriesMapLocal] = useState({})
    const [isLoading,setIsLoading] = useState(true)
    const isFocused = useIsFocused()
    const {globalStyles} = useThemeStyles()
    const [timeState, setTimeState] = useState(createRange("month"));
    const [showTip, setShowTip] = useState(false);

    const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);
    const user = useSelector((state) => state.user.userDetails);

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

    useDeferredEffect(async (isMounted) => {
        if (isMounted()) setIsLoading(true);
    
        try {
          await Promise.all([fetchExpenses(), loadCategories()]);
          if (isMounted()) {
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Failed to fetch sales:", error);
        } finally {
          if (isMounted()) {
            setIsLoading(false);
          }
        }
      }, [db, isFocused, timeState, lastSyncedAt],{enabled: isFocused,});

    useEffect(() => {
      setIsAllowedToViewReports(canViewReports())
    },[user])


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

  useEffect(() => {
      const getShowTip = async() => {
        const onboarding_completed = await getSetting(db,"onboarding_completed")
        if (!onboarding_completed) {
            setShowTip(true);
        }
      }
      getShowTip()
    }, [db]);

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
          
    { !isLoading ?
      <>
        
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
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
              isAllowedToViewReports={isAllowedToViewReports}
            />
          }
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
              <EmptyState 
                title="No expenses yet"
                description="Record a sale or expense to start tracking your business."
              />
            </View>
          }
          contentContainerStyle={{ paddingBottom: 96 }}
        />

        <AddButton 
          primaryAction={{route:"/expenses/add",label:"Add Expense"}}
          secondaryActions={[
            {route:"/expenses/categories/add/modal",label:"Add Category"},
            {route:"/expenses/templates/add/",label:"Add Template"},
          ]}
          showTip={showTip}
          setShowTip={setShowTip}
        />

      </> 
      : 
      <PageLoader />
    }

      

  </View>
  )
}

const ListHeader = ({ stats, timeState,setTimeState, expenses, isAllowedToViewReports}) => {
  return <>
    <TimeNavigator
          state={timeState}
          onChange={setTimeState}
      /> 

    <ButtonLinks 
      links={[
        { name: "Stats", route: "/expenses/stats" },
        { name: "Templates", route: "/expenses/templates" },
        { name: "Categories", route: "/expenses/categories" },
      ]}
    />

    {isAllowedToViewReports && expenses.length ? 
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