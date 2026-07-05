import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from "react-native";
import { useSelector } from "react-redux";
import {
    BodyText
} from "../../../src/components/ThemeProvider/components";

import { AddButton } from "../../../src/components/common/AddButton";
import EmptyState from "../../../src/components/common/EmptyState";
import SortComponent from "../../../src/components/common/SortComponent";
import { StatCard } from "../../../src/components/common/StatCard";
import { useManualSync } from "../../../src/hooks/useManualSync";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { getSuppliers } from "../../../src/db/query/suppliers";
import { useDeferredEffect } from "../../../src/hooks/useDeferredEffect";

export default function CustomersList() {
    const { onRefresh, refreshing } = useManualSync();
    const { globalStyles } = useThemeStyles();
    const isFocused = useIsFocused();
    const db = useSQLiteContext();
    const router = useRouter();

    const [suppliers, setSuppliers] = useState([]);
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
            key: "business_name_asc",
            action: () => setSort("business_name_asc"),
        },
        {
            label: "Z-A",
            key: "business_name_desc",
            action: () => setSort("business_name_desc"),
        },
    ];

    useDeferredEffect(async (isMounted) => {
        if(isMounted()) setIsLoading(true);

        const data = await getSuppliers(db, {sort,});
    
        if (isMounted()) {
            setSuppliers(data || []);
            setIsLoading(false);
        }
    }, [
        db,
        isFocused,
        timeState,
        sort,
        lastSyncedAt,
    ],{enabled: isFocused,});

    useEffect(() => {
        setStats({
            count: suppliers.length,
            withPhone: suppliers.filter(s => s.phone).length,
        });
    }, [suppliers]);

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
            Suppliers
        </BodyText>

        <View style={globalStyles.filterSortContainer}>

            <SortComponent
                sortOptions={sortOptions}
                activeSort={sort}
            />

        </View>

        {suppliers.length > 0 && (
            <View style={styles.statsRow}>
            <StatCard
                label="Total"
                value={stats.count?.toLocaleString()}
                subText=""
            />
            </View>
        )}

        <FlatList
            data={suppliers}
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
                <RenderSupplierItem
                    item={item}
                    router={router}
                    formatDate={formatDate}
                />
            )}
            ListEmptyComponent={
            <EmptyState
                title="No suppliers yet"
                description="Add suppliers to track credit sales and payments."
            />
            }
        />

        <AddButton
            primaryAction={{
                route: "/suppliers/add",
                label: "Add Supplier",
            }}
        />
        </View>
    );
}

const RenderSupplierItem = ({ item , router, formatDate}) => (
    <Pressable
        onPress={() => router.push(`/suppliers/${item.id}`)}
        style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
        })}
    >
        <View style={styles.supplierCard}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {item.business_name?.charAt(0)?.toUpperCase()}
                </Text>
            </View>

            <View style={styles.customerInfo}>
                <Text style={styles.customerName}>
                    {item.business_name}
                </Text>

                <Text style={styles.customerMeta}>
                    {item.contact_person || "No contact person"}
                </Text>

                <Text style={styles.customerMeta}>
                    {item.phone || "No phone"}
                </Text>

                {!!item.email && (
                    <Text style={styles.customerSub}>
                        {item.email}
                    </Text>
                )}

                <Text style={styles.customerSub}>
                    Added {formatDate(item.created_at)}
                </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
        </View>
    </Pressable>
)

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    supplierCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,

        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },

    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#2E8B8B",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    avatarText: {
        color: "#FAF9F7",
        fontWeight: "700",
        fontSize: 16,
    },

    customerInfo: {
        flex: 1,
    },

    customerName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333333",
        marginBottom: 2,
    },

    customerMeta: {
        fontSize: 13,
        color: "#666",
    },

    customerSub: {
        fontSize: 12,
        color: "#999",
        marginTop: 2,
    },

    arrow: {
        fontSize: 22,
        color: "#999",
        paddingLeft: 10,
    },
});