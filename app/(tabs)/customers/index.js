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
import { getCustomers } from "../../../src/db/query/customers";
import { useDeferredEffect } from "../../../src/hooks/useDeferredEffect";

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
            label: "Top Customers",
            key: "top_customers",
            action: () => setSort("top_customers"),
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

    useDeferredEffect(async (isMounted) => {
        if(isMounted()) setIsLoading(true);

        const data = await getCustomers(db, {sort,});
    
        if (isMounted()) {
            setCustomers(data || []);
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
                label="Total"
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
            renderItem={({ item }) => {
                const totalPaid = Number(item.total_paid || 0);
                const totalSales = Number(item.total_revenue || 0);
                const totalDiscount = Number(item.total_discount || 0);
                const outstanding = Math.max(totalSales - totalPaid, 0);
                const isOwing = outstanding > 0;

                return (
                    <Pressable
                    onPress={() => router.push(`/customers/${item.id}`)}
                    style={({ pressed }) => [
                        { opacity: pressed ? 0.7 : 1 },
                    ]}
                    >
                    <View
                        style={[
                        styles.customerCard,
                        isOwing && styles.owingCard,
                        ]}
                    >
                        
                        {/* Avatar */}
                        <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {item.name?.charAt(0)?.toUpperCase()}
                        </Text>
                        </View>

                        {/* Content */}
                        <View style={styles.customerInfo}>
                        
                        {/* Name */}
                        <Text style={styles.customerName}>
                            {item.name}
                        </Text>

                        {/* Phone */}
                        <Text style={styles.customerMeta}>
                            {item.phone ? item.phone : "No phone added"}
                        </Text>

                        {/* Paid */}
                        <Text style={styles.customerMoney}>
                                Paid: {totalPaid.toLocaleString()}
                        </Text>

                        <Text >
                                Discount: {totalDiscount.toLocaleString()}
                        </Text>

                        {isOwing &&
                            <Text
                                style={[
                                styles.customerOutstanding,
                                isOwing && styles.owingText,
                                ]}
                            >
                            Owes: {outstanding.toLocaleString()}
                            </Text>
                            }

                        {/* Date */}
                        <Text style={styles.customerSub}>
                            Added {formatDate(item.created_at)}
                        </Text>

                        </View>

                        {/* Arrow */}
                        <Text style={styles.arrow}>›</Text>

                    </View>
                    </Pressable>
                );
            }}
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
    customerCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,

        // soft shadow (iOS + Android)
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

    customerMoney: {
        marginTop: 4,
        fontSize: 13,
        fontWeight: "600",
        color: "#2E8B8B",
    },

    customerOutstanding: {
        fontSize: 13,
        marginTop: 2,
        color: "#666",
        fontWeight: "500",
    },

    owingText: {
        color: "#D9534F",
        fontWeight: "700",
    },

    owingCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#D9534F",
        backgroundColor: "#FFF5F5",
    },
});