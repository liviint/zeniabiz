import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
    View,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import {
    Card,
    BodyText,
    SecondaryText,
} from "../../../src/components/ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";

import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { AddButton } from "../../../src/components/common/AddButton";
import EmptyState from "../../../src/components/common/EmptyState";
import { useManualSync } from "../../../src/hooks/useManualSync";
import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { StatCard } from "../../../src/components/common/StatCard";
import SortComponent from "../../../src/components/common/SortComponent";

import { getCustomers } from "../../../src/db/customersDb";

export default function CustomersList() {
    const { onRefresh, refreshing } = useManualSync();
    const { globalStyles } = useThemeStyles();
    const isFocused = useIsFocused();
    const db = useSQLiteContext();
    const router = useRouter();

    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const [timeState, setTimeState] = useState(createRange("month"));

    const [sort, setSort] = useState("newest");

    const lastSyncedAt = useSelector(
        (state) => state.sync.lastSyncedAt
    );

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
            label: "A-Z",
            key: "name_asc",
            action: () => setSort("name_asc"),
        },
        {
            label: "Z-A",
            key: "name_desc",
            action: () => setSort("name_desc"),
        },
    ];

    useEffect(() => {
        if (!db) return;

        (async () => {
        setIsLoading(true);

        const data = await getCustomers(db, {sort,});

        setCustomers(data || []);
        setIsLoading(false);

        })();
    }, [
        db,
        isFocused,
        timeState,
        sort,
        lastSyncedAt,
    ]);

    useEffect(() => {
        setStats({
        count: customers.length,
        withPhone: customers.filter(
            (customer) => customer.phone
        ).length,
        });
    }, [customers]);

    const formatDate = (date) => {
        if (!date) return "";

        return new Date(date).toLocaleString("en-KE", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };


    return (
        <View style={globalStyles.container}>
        <BodyText style={globalStyles.title}>
            Customers
        </BodyText>

        <View style={globalStyles.filterSortContainer}>

            <SortComponent
                sortOptions={sortOptions}
                activeSort={sort}
            />

        </View>

        {customers.length > 0 && (
            <View style={styles.statsRow}>
            <StatCard
                label="Count"
                value={stats.count?.toLocaleString()}
                subText=""
            />
            </View>
        )}

        <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
            }
            renderSectionHeader={({ section }) => (
            <BodyText
                style={{
                fontWeight: "700",
                marginVertical: 6,
                }}
            >
                {section.title}
            </BodyText>
            )}
            renderItem={({ item }) => (
            <Pressable
                onPress={() =>
                router.push(`/customers/${item.id}`)
                }
            >
                <Card style={{ marginBottom: 10 }}>
                <BodyText
                    style={{ fontWeight: "600" }}
                >
                    {item.name}
                </BodyText>

                {!!item.phone && (
                    <SecondaryText>
                    {item.phone}
                    </SecondaryText>
                )}

                <SecondaryText>
                    Added {formatDate(item.created_at)}
                </SecondaryText>
                </Card>
            </Pressable>
            )}
            ListEmptyComponent={
            <EmptyState
                title="No customers yet"
                description="Add customers to track credit sales and payments."
            />
            }
        />

        <AddButton
            primaryAction={{
                route: "/customers/add",
                label: "Add Customer",
            }}
        />
        </View>
    );
}

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
});