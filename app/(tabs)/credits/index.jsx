import { useIsFocused, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    Pressable,
    RefreshControl,
    SectionList,
    StyleSheet,
    View,
} from "react-native";
import { useSelector } from "react-redux";

import {
    BodyText,
    Card,
    SecondaryText,
} from "../../../src/components/ThemeProvider/components";

import EmptyState from "../../../src/components/common/EmptyState";
import TimeNavigator from "../../../src/components/common/TimeNavigator";

import { useManualSync } from "../../../src/hooks/useManualSync";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";

import { groupDataIntoSections } from "../../../src/helpers";
import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { dateFormat } from "../../../utils/dateFormat";

import FilterComponent from "../../../src/components/common/FilterComponent";
import { StatCard } from "../../../src/components/common/StatCard";
import { getCredits, getCreditStats } from "../../../src/db/query/credits";
import { formatNumber } from "../../../src/db/utils";
import { useDeferredEffect } from "../../../src/hooks/useDeferredEffect";
import { canViewReports } from "../../../src/utils/rolesAndPermissions";
import { exportPdf } from '../../../src/db/query/exportData';
import ExportButton from '../../../src/components/common/exportButton';

export default function CreditsListPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const isFocused = useIsFocused();

  const [isAllowedToViewReports, setIsAllowedToViewReports] =
    useState(canViewReports());

  const { globalStyles } = useThemeStyles();

  const { onRefresh, refreshing } = useManualSync();

  const [credits, setCredits] = useState([]);
  const [creditStats, setCreditStats] = useState({});
  const [timeState, setTimeState] = useState(createRange("month"));
  const [statusFilter, setStatusFilter] = useState("outstanding");

  const lastSyncedAt = useSelector((state) => state.sync.lastSyncedAt);
  const user = useSelector((state) => state.user.userDetails);

  const filterOptions = [
    {
      label: "Outstanding",
      action: () => setStatusFilter("outstanding"),
      key: "outstanding",
    },
    {
      label: "Unpaid",
      action: () => setStatusFilter("unpaid"),
      key: "unpaid",
    },
    {
      label: "Partial",
      action: () => setStatusFilter("partial"),
      key: "partial",
    },
    // {
    //   label:"Overdue",
    //   action:() => setStatusFilter("overdue"),
    //   key:"overdue",
    // }
    {
      label: "Paid",
      action: () => setStatusFilter("paid"),
      key: "paid",
    },
  ];

  const fetchStats = async () => {
    const stats = await getCreditStats(credits, statusFilter);
    setCreditStats(stats);
  };

  const handleExport = async (format) => {
    try {
        if (format !== "pdf") return;

        await exportPdf({
            data: credits,
            type: "credits",
            fileName: "credits",
            options: {
                timeState
            },
        });
    } catch (error) {
        console.error(
            "Expenses export failed:",
            error
        );
    }
  };

  useDeferredEffect(
    async (isMounted) => {
      const data = await getCredits(db, timeState, statusFilter);

      if (isMounted()) {
        setCredits(data);
      }
    },
    [isFocused, timeState, lastSyncedAt, statusFilter],
    { enabled: isFocused },
  );

  useEffect(() => {
    setIsAllowedToViewReports(canViewReports());
  }, [user]);

  useEffect(() => {
    if (isFocused) {
      fetchStats();
    }
  }, [credits]);

  const grouped = groupDataIntoSections(credits);

  const sections = [
    { title: "Today", data: grouped.today },
    { title: "Yesterday", data: grouped.yesterday },
    { title: "Earlier This Week", data: grouped.thisWeek },
    { title: "Earlier This Month", data: grouped.thisMonth },
    { title: "Older", data: grouped.older },
  ].filter((section) => section.data.length > 0);

  const renderItem = ({ item }) => (
    <Pressable onPress={() => router.push(`/credits/${item.id}`)}>
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
              {item.payment_status ? ` • ${item.payment_status}` : ""}
            </SecondaryText>

            {!!item.phone && (
              <SecondaryText style={styles.phone}>{item.phone}</SecondaryText>
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
        <BodyText style={globalStyles.title}>Customer Credits</BodyText>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderSectionHeader={({ section: { title } }) => (
          <BodyText style={styles.sectionHeader}>{title}</BodyText>
        )}
        ListHeaderComponent={
          <ListHeader
            timeState={timeState}
            setTimeState={setTimeState}
            filterOptions={filterOptions}
            statusFilter={statusFilter}
            stats={creditStats}
            globalStyles={globalStyles}
            isAllowedToViewReports={isAllowedToViewReports}
            handleExport={handleExport}
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

const ListHeader = ({
  timeState,
  setTimeState,
  filterOptions = { filterOptions },
  statusFilter,
  stats,
  globalStyles,
  isAllowedToViewReports,
  handleExport
}) => {
  return (
    <>
      <TimeNavigator state={timeState} onChange={setTimeState} />

      <View style={globalStyles.filterSortContainer}>
        <FilterComponent
          filterOptions={filterOptions}
          activeFilter={statusFilter}
        />
        <ExportButton 
          onExport={handleExport}
        />
      </View>

      {isAllowedToViewReports && (
        <View style={styles.statsRow}>
          <StatCard
            label={"Balance"}
            value={formatNumber(stats?.totalAmount)}
            color="#FF6B6B"
          />

          <StatCard
            label={"Credits"}
            value={formatNumber(stats?.count)}
            color="#FF6B6B"
            subText={""}
          />
        </View>
      )}
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
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
