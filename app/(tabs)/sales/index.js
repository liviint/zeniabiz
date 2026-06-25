import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { 
    Pressable, 
    RefreshControl, 
    SectionList, 
    StyleSheet, 
    View,
    FlatList, 
} from "react-native";
import { useSelector } from "react-redux";
import { AddButton } from "../../../src/components/common/AddButton";
import EmptyState from "../../../src/components/common/EmptyState";
import FilterComponent from "../../../src/components/common/FilterComponent";
import SortComponent from "../../../src/components/common/SortComponent";
import { StatCard } from "../../../src/components/common/StatCard";
import TimeNavigator from "../../../src/components/common/TimeNavigator";
import {
  BodyText,
  Card,
  SecondaryText,
} from "../../../src/components/ThemeProvider/components";
import { getSales } from "../../../src/db/query/sales";
import { groupDataIntoSections } from "../../../src/helpers";
import { useManualSync } from "../../../src/hooks/useManualSync";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { canViewReports } from "../../../src/utils/rolesAndPermissions"

export default function SalesList() {
  const { onRefresh, refreshing } = useManualSync();
  const { globalStyles } = useThemeStyles();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const router = useRouter();

  const [isAllowedToViewReports,setIsAllowedToViewReports] = useState(canViewReports())

  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [timeState, setTimeState] = useState(createRange("month"));

  const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);
  const user = useSelector((state) => state.user.userDetails);

  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest")

  const filterOptions = [
    {
      label: "All",
      action: () => setFilter("all"),
      key: "all",
    },
    
    {
      label: "Credit Sales",
      action: () => setFilter("credit"),
      key: "credit",
    },
    {
      label: "Cash Sales",
      action: () => setFilter("cash"),
      key: "cash",
    },
  ];


  const sortOptions = [
    {
      label: "Newest",
      key: "newest",
      action: () => setSort("newest"),
    },
    {
      label: "Oldest",
      key: "oldest",
      action: () => setSort("oldest"),
    },
    {
      label: "Highest Amount",
      key: "high_amount",
      action: () => setSort("high_amount"),
    },
    {
      label: "Lowest Amount",
      key: "low_amount",
      action: () => setSort("low_amount"),
    },
    {
      label: "Highest Balance",
      key: "high_balance",
      action: () => setSort("high_balance"),
    },
  ];

  useEffect(() => {
    if (!db) return;
    (async () => {
      setIsLoading(true);
      const data = await getSales(db, {timeState,filter,sort});
      setSales(data);
      setIsLoading(false);
    })();
  }, [isFocused, timeState,lastSyncedAt,filter,sort]);

  useEffect(() => {
    setIsAllowedToViewReports(canViewReports())
  },[user])


  useEffect(() => {
    const getStats = async() => {
      const cashCollected = sales.reduce((sum, item) => sum + (item.amount_paid || 0),
  0);
        setStats({
          count: sales.length,
          cashCollected:cashCollected
        });
      }
    getStats()
  }, [sales]);

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-KE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const grouped = groupDataIntoSections(sales);

  const sections = [
    { title: "Today", data: grouped.today },
    { title: "Yesterday", data: grouped.yesterday },
    { title: "Earlier This Week", data: grouped.thisWeek },
    { title: "Earlier This Month", data: grouped.thisMonth },
    { title: "Older", data: grouped.older },
  ].filter(section => section.data.length > 0);

  const useSections = sort === "newest" 

  return (
    <View style={globalStyles.container}>
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
      <BodyText style={globalStyles.title}>Sales</BodyText>

      <TimeNavigator
          state={timeState}
          onChange={setTimeState}
      />

      <View style={globalStyles.filterSortContainer}>
        <FilterComponent 
          filterOptions={filterOptions}
          activeFilter={filter}
        />

        <SortComponent 
          sortOptions={sortOptions}
          activeSort={sort}
        />
      </View>

      {isAllowedToViewReports && sales.length ? 
        <View style={styles.statsRow}>
          <StatCard
            label="Cash Collected"
            value={stats?.cashCollected?.toLocaleString()}
            subText=""
          />

          <StatCard
            label="Sales Count"
            value={stats?.count?.toLocaleString()}
            subText=""
          />
        </View>
        :""
      }

    {useSections ? 
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderSectionHeader={({ section }) => (
          <BodyText style={{ fontWeight: "700", marginVertical: 6 }}>
            {section.title}
          </BodyText>
        )}
        renderItem={({item}) => renderSaleItem({item,router,formatDate})}
        ListEmptyComponent={
          <EmptyState 
              title="No sales yet"
              description="Start by recording your first sale to track your business."
            />
        }
      />
      : 
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({item}) => renderSaleItem({item,router,formatDate})}
          ListEmptyComponent={
            <EmptyState
              title="No sales yet"
              description="Start by recording your first sale to track your business."
            />
          }
        />
      }
  
      <AddButton
        primaryAction={{ route: "/sales/add", label: "Add a Sale" }}
      />
    </View>
  );
}

const renderSaleItem = ({ item , router, formatDate}) => {
  const fallbackTitle = `Sale - ${item.amount}`;

  return (
    <Pressable onPress={() => router.push(`/sales/${item.id}`)}>
      <Card style={{ marginBottom: 10 }}>
        <BodyText style={{ fontWeight: "600" }}>
          {item.title || fallbackTitle}
        </BodyText>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <SecondaryText>{formatDate(item.date)}</SecondaryText>

          <BodyText style={{ fontWeight: "700" }}>
            {item.amount_paid}
          </BodyText>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  statsRow:{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  }
});
