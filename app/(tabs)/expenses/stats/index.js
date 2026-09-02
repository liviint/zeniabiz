import { useIsFocused } from 'expo-router';
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useSelector } from "react-redux";
import { useDeferredEffect } from "../../../../src/hooks/useDeferredEffect";
import { useManualSync } from "../../../../src/hooks/useManualSync";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";

import { BodyText, Card, SecondaryText } from "../../../../src/components/ThemeProvider/components";
import ButtonLinks from "../../../../src/components/common/ButtonLinks";
import PageLoader from "../../../../src/components/common/PageLoader";
import { StatCard } from "../../../../src/components/common/StatCard";
import TimeNavigator from "../../../../src/components/common/TimeNavigator";

import { getExpenseStats } from "../../../../src/db/query/expenses";
import { canViewReports } from "../../../../src/utils/rolesAndPermissions";
import { createRange } from "../../../../src/utils/timeNavigatorHelpers";

export default function ExpenseStatsPage() {
    const db = useSQLiteContext();
    const isFocused = useIsFocused();

    const { onRefresh, refreshing } = useManualSync();
    const { globalStyles } = useThemeStyles();

    const user = useSelector((state) => state.user.userDetails);
    const lastSyncedAt = useSelector((state) => state.sync.lastSyncedAt);

    const [timeState, setTimeState] = useState(createRange("month"));
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isAllowedToViewReports, setIsAllowedToViewReports] = useState(
        canViewReports()
    );

    useDeferredEffect(
        async (isMounted) => {
        if (isMounted()) {
            setIsLoading(true);
        }

        try {
            const result = await getExpenseStats(db, timeState);

            if (isMounted()) {
            setStats(result);
            }
        } catch (error) {
            console.error("Failed to fetch expense stats:", error);
        } finally {
            if (isMounted()) {
            setIsLoading(false);
            }
        }
        },
        [db, isFocused, timeState, lastSyncedAt],
        {
        enabled: isFocused,
        }
    );

  // Keep permissions in sync with the logged-in user
    useDeferredEffect(
        async (isMounted) => {
        const allowed = canViewReports();

        if (isMounted()) {
            setIsAllowedToViewReports(allowed);
        }
        },
        [user],
        {
        enabled: true,
        }
    );

    if (!isAllowedToViewReports) {
        return (
        <View style={globalStyles.container}>
            <View style={styles.header}>
            <BodyText style={globalStyles.title}>
                Expense Stats
            </BodyText>
            </View>

            <Card style={styles.permissionCard}>
            <BodyText style={styles.permissionTitle}>
                Access Restricted
            </BodyText>

            <SecondaryText style={styles.permissionText}>
                You do not have permission to view expense reports.
            </SecondaryText>
            </Card>
        </View>
        );
    }

    if (isLoading || !stats) {
        return (
        <View style={globalStyles.container}>
            <PageLoader />
        </View>
        );
    }

    const total = Number(stats.total || 0);
    const count = Number(stats.count || 0);
    const average = Number(stats.average || 0);
    const largest = Number(stats.largest || 0);

    return (
        <View style={globalStyles.container}>
        <View style={styles.header}>
            <BodyText style={globalStyles.title}>
            Expense Stats
            </BodyText>
        </View>

        <ScrollView
            refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
            }
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <TimeNavigator
            state={timeState}
            onChange={setTimeState}
            />

            <ButtonLinks
            links={[
                {
                name: "Expenses",
                route: "/expenses",
                },
                {
                name: "Templates",
                route: "/expenses/templates",
                },
                {
                name: "Categories",
                route: "/expenses/categories",
                },
            ]}
            />

            {/* Overview */}
            <SectionTitle title="Overview" />

            <View style={styles.statsRow}>
            <StatCard
                label="Total spent"
                value={total.toLocaleString()}
                subText=""
                color="#FF6B6B"
            />

            <StatCard
                label="Expenses"
                value={count.toLocaleString()}
                subText=""
                color="#FF6B6B"
            />
            </View>

            <View style={styles.statsRow}>
            <StatCard
                label="Average expense"
                value={average.toLocaleString(undefined, {
                maximumFractionDigits: 2,
                })}
                subText=""
                color="#FF6B6B"
            />

            <StatCard
                label="Largest expense"
                value={largest.toLocaleString()}
                subText=""
                color="#FF6B6B"
            />
            </View>

            {/* Categories */}
            <SectionTitle title="Spending by Category" />

            <Card style={styles.sectionCard}>
            {stats.categories?.length ? (
                stats.categories.map((item, index) => {
                const percentage =
                    total > 0
                    ? (Number(item.total || 0) / total) * 100
                    : 0;

                return (
                    <CategoryRow
                    key={`${item.category}-${index}`}
                    item={item}
                    percentage={percentage}
                    />
                );
                })
            ) : (
                <SecondaryText>
                No category data for this period.
                </SecondaryText>
            )}
            </Card>
        </ScrollView>
        </View>
    );
}



function SectionTitle({ title }) {
    return (
        <BodyText style={styles.sectionTitle}>
        {title}
        </BodyText>
    );
}


function CategoryRow({ item, percentage }) {
    const amount = Number(item.total || 0);

    return (
        <View style={styles.categoryRow}>
        <View style={styles.categoryTopRow}>
            <View style={styles.categoryInfo}>
            <View
                style={[
                styles.categoryDot,
                {
                    backgroundColor: item.color || "#808080",
                },
                ]}
            />

            <BodyText
                style={styles.categoryName}
                numberOfLines={1}
            >
                {item.category}
            </BodyText>
            </View>

            <BodyText style={styles.categoryAmount}>
            {amount.toLocaleString()}
            </BodyText>
        </View>

        <View style={styles.progressBackground}>
            <View
            style={[
                styles.progressBar,
                {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: item.color || "#808080",
                },
            ]}
            />
        </View>

        <SecondaryText style={styles.categoryPercentage}>
            {percentage.toFixed(1)}%
        </SecondaryText>
        </View>
    );
}


function formatStatsDate(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 16,
  },

  content: {
    paddingBottom: 96,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },

  sectionCard: {
    padding: 16,
  },

  categoryRow: {
    marginBottom: 18,
  },

  categoryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  categoryName: {
    fontWeight: "600",
    flexShrink: 1,
  },

  categoryAmount: {
    fontWeight: "700",
  },

  progressBackground: {
    height: 7,
    borderRadius: 5,
    backgroundColor: "#E5E5E5",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: 5,
  },

  categoryPercentage: {
    marginTop: 4,
    fontSize: 11,
  },

  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  typeCard: {
    width: "48%",
    padding: 14,
  },

  typeLabel: {
    fontSize: 12,
    marginBottom: 6,
  },

  typeAmount: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },

  dailyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },

  dailyLeft: {
    flex: 1,
  },

  dailyDate: {
    fontWeight: "600",
    marginBottom: 2,
  },

  dailyAmount: {
    fontSize: 16,
    fontWeight: "700",
  },

  permissionCard: {
    padding: 20,
    marginTop: 20,
  },

  permissionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  permissionText: {
    lineHeight: 20,
  },
});