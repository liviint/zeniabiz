import { useIsFocused, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import { useSelector } from "react-redux";

import ButtonLinks from "../../../../src/components/common/ButtonLinks";
import { BodyText, Card, SecondaryText } from "../../../../src/components/ThemeProvider/components";
import { StatCard } from "../../../../src/components/common/StatCard";
import EmptyState from "../../../../src/components/common/EmptyState";

import TimeNavigator from "../../../../src/components/common/TimeNavigator";

import { getInventoryInsights } from "../../../../src/db/query/inventory";
import { formatNumber } from "../../../../src/db/utils";

import { useDeferredEffect } from "../../../../src/hooks/useDeferredEffect";
import { useManualSync } from "../../../../src/hooks/useManualSync";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";

import { canViewReports } from "../../../../src/utils/rolesAndPermissions";

import { createRange } from "../../../../src/utils/timeNavigatorHelpers";


export default function InventoryStatsPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const isFocused = useIsFocused();

  const { onRefresh, refreshing } = useManualSync();
  const { globalStyles } = useThemeStyles();

  const lastSyncedAt = useSelector(
    (state) => state.sync.lastSyncedAt
  );

  const user = useSelector(
    (state) => state.user.userDetails
  );

  const isAllowedToViewReports = canViewReports(user);

  const [timeState, setTimeState] = useState(createRange("month"));

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useDeferredEffect(
    async (isMounted) => {
      if (!timeState?.startDate || !timeState?.endDate) {
        return;
      }

      if (isMounted()) {
        setIsLoading(true);
      }

      try {
        const data = await getInventoryInsights(db, {timeState});

        if (isMounted()) {
          setStats(data);
        }
      } catch (error) {
        console.error(
          "Failed to fetch inventory insights:",
          error
        );
      } finally {
        if (isMounted()) {
          setIsLoading(false);
        }
      }
    },
    [
      db,
      isFocused,
      lastSyncedAt,
      timeState?.startDate,
      timeState?.endDate,
    ],
    {
      enabled: isFocused,
    }
  );

  if (!isAllowedToViewReports) {
    return (
      <View style={globalStyles.container}>
        <EmptyState
          title="Access restricted"
          description="You do not have permission to view inventory statistics."
        />
      </View>
    );
  }

  const overview = stats?.overview || {};
  const inventory = stats?.inventory || {};
  const movement = stats?.movement || {};

  const fastMoving = movement.fastMoving || [];
  const slowMoving = movement.slowMoving || [];
  const noMovement = movement.noMovement || [];

  const renderMovementItem = ({
    item,
    type,
  }) => {
    const unitsSold = Number(
      item?.units_sold || 0
    );

    return (
      <Pressable
        onPress={() =>
          router.push(`/inventory/${item?.id}`)
        }
        key={item?.id}
      >
        <Card>
          <View style={styles.productRow}>
            <View style={styles.productInfo}>
              <BodyText style={styles.productName}>
                {item?.name}
              </BodyText>

              <SecondaryText style={styles.productMeta}>
                {unitsSold}{" "}
                {unitsSold === 1 ? "unit" : "units"} sold
              </SecondaryText>
            </View>

            <View style={styles.productRight}>
              <BodyText style={styles.stockText}>
                {Number(item?.stock_quantity || 0)}
              </BodyText>

              <SecondaryText style={styles.stockLabel}>
                in stock
              </SecondaryText>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={() => "stats"}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={globalStyles.titleContainer}>
              <BodyText style={globalStyles.title}>
                Inventory Insights
              </BodyText>
            </View>
            

            {/* Time navigator */}
            <View style={styles.timeContainer}>
              <TimeNavigator
                state={timeState}
                onChange={setTimeState}
              />
            </View>

            <ButtonLinks
              links={[
                {
                  name: "Products",
                  route: "/inventory",
                },
              ]}
            />

            {/* Loading */}
            {isLoading && !stats ? (
              <View style={styles.loading}>
                <ActivityIndicator />
                <SecondaryText style={styles.loadingText}>
                  Loading inventory insights...
                </SecondaryText>
              </View>
            ) : (
              <>
                {/* OVERVIEW */}
                <SectionTitle title="Overview" />

                <View style={styles.statRow}>
                  <StatCard
                    label="Units in Stock"
                    value={formatNumber(
                      overview.unitsInStock || 0
                    )}
                  />
                  <StatCard
                    label="Units Sold"
                    value={formatNumber(
                      overview.unitsSold || 0
                    )}
                  />
                </View>

                <View style={styles.statRow}>
                  

                  <StatCard
                    label="Products"
                    value={formatNumber(
                      overview.products || 0
                    )}
                  />

                  <StatCard
                    label="Sales Value"
                    value={formatNumber(
                      overview.salesValue || 0
                    )}
                  />
                </View>

                {/* SALES */}
                <SectionTitle title="Sales Movement" />

                <View style={styles.statRow}>
                  <StatCard
                    label="No Movement"
                    value={formatNumber(
                      noMovement.length
                    )}
                  />
                </View>

                {/* FAST MOVING */}
                <MovementSection
                  title="Fast Moving"
                  description="Products with the highest sales during this period."
                  items={fastMoving}
                  type="fast"
                  renderItem={renderMovementItem}
                />

                {/* SLOW MOVING */}
                <MovementSection
                  title="Slow Moving"
                  description="Products with the lowest sales among products that moved."
                  items={slowMoving}
                  type="slow"
                  renderItem={renderMovementItem}
                />

                {/* NO MOVEMENT */}
                <MovementSection
                  title="No Movement"
                  description="Products with no recorded sales during this period."
                  items={noMovement}
                  type="none"
                  renderItem={renderMovementItem}
                />

                {/* INVENTORY HEALTH */}
                <SectionTitle title="Inventory Health" />

                <View style={styles.statRow}>
                  <StatCard
                    label="Low Stock"
                    value={inventory.lowStock}
                  />
                  <StatCard
                    label="Out of Stock"
                    value={inventory.outOfStock}
                  />
                </View>

                <View style={styles.statRow}>
                  <StatCard
                    label="Expiring Soon"
                    value={inventory.expiringSoon}
                  />
                  <StatCard
                    label="Expired"
                    value={inventory.expired}
                  />
                </View>
              </>
            )}
          </>
        }
      />
    </View>
  );
}

function SectionTitle({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <BodyText style={styles.sectionTitle}>
        {title}
      </BodyText>
    </View>
  );
}

function MovementSection({
  title,
  description,
  items,
  type,
  renderItem,
}) {
  const router = useRouter();

  const hasMore = items?.length > 5;

  const handleViewMore = () => {
    router.push({
      pathname: "/inventory/movement",
      params: {
        type,
      },
    });
  };

return ( <View style={styles.movementSection}> <BodyText style={styles.movementTitle}>
{title} </BodyText>


  <SecondaryText style={styles.movementDescription}>
    {description}
  </SecondaryText>

  {items?.length > 0 ? (
    <>
      {items
        .slice(0, 5)
        .map((item) =>
          renderItem({
            item,
            type,
          })
        )}

      {hasMore && (
        <Pressable
          style={styles.viewMoreButton}
          onPress={handleViewMore}
        >
          <BodyText style={styles.viewMoreText}>
            View more ({items.length - 5})
          </BodyText>
        </Pressable>
      )}
    </>
  ) : (
    <Card>
      <SecondaryText style={styles.emptyMovement}>
        No products in this category.
      </SecondaryText>
    </Card>
  )}
</View>


);
}


const styles = StyleSheet.create({
  timeContainer: {
    marginTop: 4,
    marginBottom: 8,
  },

  loading: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
  },

  sectionHeader: {
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  statRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  movementSection: {
    marginTop: 8,
  },

  movementTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },

  movementDescription: {
    fontSize: 12,
    marginBottom: 8,
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  productInfo: {
    flex: 1,
    marginRight: 12,
  },

  productName: {
    fontWeight: "600",
  },

  productMeta: {
    fontSize: 12,
    marginTop: 3,
  },

  productRight: {
    alignItems: "flex-end",
  },

  stockText: {
    fontSize: 16,
    fontWeight: "700",
  },

  stockLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  emptyMovement: {
    textAlign: "center",
    paddingVertical: 8,
    fontSize: 12,
  },
  viewMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 2,
  },

  viewMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },

});