import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { View, SectionList, Pressable, RefreshControl, StyleSheet, } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import {
  Card,
  BodyText,
  SecondaryText,
} from "../../../src/components/ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";
import { getSales } from "../../../src/db/salesDb"; 
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { AddButton } from "../../../src/components/common/AddButton";
import EmptyState from "../../../src/components/common/EmptyState";
import { groupDataIntoSections } from "../../../src/helpers";
import { useManualSync } from "../../../src/hooks/useManualSync";
import TimeNavigator from "../../../src/components/common/TimeNavigator"
import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { StatCard } from "../../../src/components/common/StatCard";
import { getCahsCollcted } from "../../../src/db/paymentsDb";

export default function SalesList() {
  const { onRefresh, refreshing } = useManualSync();
  const { globalStyles } = useThemeStyles();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const router = useRouter();

  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [timeState, setTimeState] = useState(createRange("month"));
  const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);

  useEffect(() => {
    if (!db) return;
    (async () => {
      setIsLoading(true);
      const data = await getSales(db, timeState);
      setSales(data);
      setIsLoading(false);
    })();
  }, [isFocused, timeState,lastSyncedAt]);


  useEffect(() => {
    const getStats = async() => {
      let cashCollected = await getCahsCollcted(db,timeState)
        setStats({
          count: sales.length,
          cashCollected:cashCollected.cashCollected
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

  return (
    <View style={globalStyles.container}>
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
      <BodyText style={globalStyles.title}>My Sales</BodyText>

      <TimeNavigator
          state={timeState}
          onChange={setTimeState}
      />

      {sales.length ? 
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

    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderSectionHeader={({ section }) => (
        <BodyText style={{ fontWeight: "700", marginVertical: 6 }}>
          {section.title}
        </BodyText>
      )}
      renderItem={({ item }) => {
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
      }}

      ListEmptyComponent={
        <EmptyState 
            title="No sales yet"
            description="Start by recording your first sale to track your business."
          />
      }
  />
      <AddButton
        primaryAction={{ route: "/sales/add", label: "Add a Sale" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow:{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  }
});
