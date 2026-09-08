import {
useLocalSearchParams,
useRouter,
useIsFocused,
} from "expo-router";
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

import {
BodyText,
Card,
SecondaryText,
} from "../../../../src/components/ThemeProvider/components";

import ButtonLinks from "../../../../src/components/common/ButtonLinks";
import TimeNavigator from "../../../../src/components/common/TimeNavigator";
import EmptyState from "../../../../src/components/common/EmptyState";

import { getInventoryMovementProducts } from "../../../../src/db/query/inventory";

import { useDebounce } from "../../../../src/hooks/useDebounce";
import { useDeferredEffect } from "../../../../src/hooks/useDeferredEffect";
import { useManualSync } from "../../../../src/hooks/useManualSync";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";

import { createRange } from "../../../../src/utils/timeNavigatorHelpers";

import FilterComponent from "../../../../src/components/common/FilterComponent";
import SortComponent from "../../../../src/components/common/SortComponent";

export default function InventoryMovementPage() {
    const db = useSQLiteContext();
    const router = useRouter();
    const isFocused = useIsFocused();

    const { type = "fast" } = useLocalSearchParams();

    const { globalStyles } = useThemeStyles();
    const { onRefresh, refreshing } = useManualSync();

    const lastSyncedAt = useSelector(
    (state) => state.sync.lastSyncedAt
    );

    const [timeState, setTimeState] = useState(
    createRange("month")
    );

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("fast_moving");

    const filterOptions = [
        {
            label: "All",
            key: "all",
            action: () => setFilter("all"),
        },
        {
            label: "No Movement",
            key: "no_movement",
            action: () => setFilter("no_movement"),
        }
    ];

    const sortOptions = [
        {
            label: "Fast Moving",
            key: "fast_moving",
            action: () => setSort("fast_moving"),
        },
        {
            label: "Slow Moving",
            key: "slow_moving",
            action: () => setSort("slow_moving"),
        },
    ];

    useDeferredEffect(
        async (isMounted) => {
        if (!timeState?.startDate || !timeState?.endDate) {
            return;
        }


        if (isMounted()) {
            setIsLoading(true);
        }

    try {
        const data = await getInventoryMovementProducts(
            db,
            {
                timeState,
                filter,
                sort,
            }
        );

        console.log(data,"hello data move")

        

        if (isMounted()) {
            setItems(data);
        }
    } catch (error) {
        console.error(
        "Failed to fetch inventory movement:",
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
        timeState,
        filter,
        sort
    ],
    {
        enabled: isFocused,
    });

    const renderItem = ({ item }) => {
        const unitsSold = Number(
        item?.units_sold || 0
        );

        return (
        <Pressable
            onPress={() =>
            router.push(`/inventory/${item?.id}`)
            }
        >
            <Card>
            <View style={styles.productRow}>
                <View style={styles.productInfo}>
                <BodyText style={styles.productName}>
                    {item?.name}
                </BodyText>

                <SecondaryText style={styles.productMeta}>
                    {unitsSold}{" "}
                    {unitsSold === 1
                    ? "unit"
                    : "units"}{" "}
                    sold
                </SecondaryText>
                </View>

                <View style={styles.productRight}>
                <BodyText style={styles.stockText}>
                    {Number(
                    item?.stock_quantity || 0
                    )}
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
    <View 
        style={globalStyles.container}
    > 
        <View style={globalStyles.titleContainer}> 
            <BodyText style={globalStyles.title}>Movements</BodyText> 
        </View>

    <FlatList
        data={items}
        keyExtractor={(item) =>String(item.id)}
        renderItem={renderItem}
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
            <View style={styles.timeContainer}>
                <TimeNavigator
                    state={timeState}
                    onChange={setTimeState}
                />
            </View>

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

            <ButtonLinks
                links={[
                    {
                    name: "Inventory",
                    route: "/inventory",
                    },
                    {
                    name: "Stats",
                    route: "/inventory/stats",
                    },
                ]}
            />

            {isLoading && (
            <View style={styles.loading}>
                <ActivityIndicator />

                <SecondaryText
                style={styles.loadingText}
                >
                Loading products...
                </SecondaryText>
            </View>
            )}
        </>
        }
        ListEmptyComponent={
        !isLoading ? (
            <EmptyState
            title="No products found"
            description="Try changing the time period or search."
            />
        ) : null
        }
    />
</View>
);
}

const styles = StyleSheet.create({
    timeContainer: {
        marginTop: 4,
        marginBottom: 8,
    },

    filtersContainer: {
        paddingHorizontal: 12,
        marginTop: 8,
    },

    descriptionContainer: {
        paddingHorizontal: 12,
        marginTop: 8,
        marginBottom: 4,
    },

    loading: {
        paddingVertical: 20,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        marginTop: 8,
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
});
