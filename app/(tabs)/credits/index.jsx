import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Pressable,
  SectionList,
  StyleSheet,
  View,
  RefreshControl,
} from "react-native";

import {
  BodyText,
  Card,
  SecondaryText,
} from "../../../src/components/ThemeProvider/components";

import EmptyState from "../../../src/components/common/EmptyState";
import TimeNavigator from "../../../src/components/common/TimeNavigator";

import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { useManualSync } from "../../../src/hooks/useManualSync";

import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { groupDataIntoSections } from "../../../src/helpers";
import { dateFormat } from "../../../utils/dateFormat";

import { getCredits } from "../../../src/db/creditsDb";

export default function CreditsListPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const isFocused = useIsFocused();

  const { globalStyles } = useThemeStyles();

  const { onRefresh, refreshing } = useManualSync();

  const [credits, setCredits] = useState([]);
  const [timeState, setTimeState] = useState(createRange("month"));

  const lastSyncedAt = useSelector(
    (state) => state.sync.lastSyncedAt
  );

  const fetchCredits = async () => {
    const data = await getCredits(db, timeState);
    setCredits(data);
  };

  useEffect(() => {
    if (isFocused) {
      fetchCredits();
    }
  }, [isFocused, timeState, lastSyncedAt]);

  const grouped = groupDataIntoSections(credits);

  const sections = [
    { title: "Today", data: grouped.today },
    { title: "Yesterday", data: grouped.yesterday },
    { title: "Earlier This Week", data: grouped.thisWeek },
    { title: "Earlier This Month", data: grouped.thisMonth },
    { title: "Older", data: grouped.older },
  ].filter((section) => section.data.length > 0);

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => router.push(`/credits/${item.id}`)}
    >
      <Card>
        <View style={styles.row}>
          <View style={styles.left}>
            <BodyText
              style={styles.title}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.customer_name || "Walk-in Customer"}
            </BodyText>

            <SecondaryText
              style={styles.meta}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title}
              {" • "}
              {dateFormat(item.date)}
              {item.payment_status
                ? ` • ${item.payment_status}`
                : ""}
            </SecondaryText>

            {!!item.phone && (
              <SecondaryText style={styles.phone}>
                {item.phone}
              </SecondaryText>
            )}
          </View>



          <View style={styles.right}>
            <BodyText style={styles.balance}>
              {Math.abs(item.balance_due || 0).toLocaleString()}
            </BodyText>

            <SecondaryText style={styles.paidText}>
              Paid {Math.abs(item.amount_paid || 0).toLocaleString()}
              {" / "}
              {Math.abs(item.total_amount || 0).toLocaleString()}
            </SecondaryText>
          </View>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <View style={globalStyles.container}>
      <View style={styles.headerRow}>
        <BodyText style={globalStyles.title}>
          Customer Credits
        </BodyText>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        renderSectionHeader={({ section: { title } }) => (
          <BodyText style={styles.sectionHeader}>
            {title}
          </BodyText>
        )}
        ListHeaderComponent={
          <ListHeader
            timeState={timeState}
            setTimeState={setTimeState}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No credit sales yet"
            description="Credit sales with outstanding balances will appear here."
          />
        }
        contentContainerStyle={{ paddingBottom: 96 }}
      />
    </View>
  );
}

const ListHeader = ({ timeState, setTimeState }) => {
  return (
    <>

      <TimeNavigator
        state={timeState}
        onChange={setTimeState}
      />

    </>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "center",
    marginBottom: 16,
  },

  sectionHeader: {
    fontWeight: "bold",
    padding: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  left: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  title: {
    fontWeight: "600",
    maxWidth: "100%",
  },

  meta: {
    fontSize: 12,
    marginTop: 2,
  },

  phone: {
    fontSize: 12,
    marginTop: 2,
  },

  balance: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B6B",
  },

  paidText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
});