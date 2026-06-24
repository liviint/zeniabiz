import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
    View,
    TouchableOpacity,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
    BodyText,
    Card,
    SecondaryText,
} from "../../../../src/components/ThemeProvider/components";
import {
    getCustomerById,
    getCustomerStats,
    getCustomerSales,
    deleteCustomer,
} from "../../../../src/db/query/customers";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import DeleteButton from "../../../../src/components/common/DeleteButton";
import { dateFormat } from "../../../../src/utils/dateFormat";

export default function CustomerDetails() {
    const { globalStyles } = useThemeStyles();
    const isFocused = useIsFocused();
    const db = useSQLiteContext();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [customer, setCustomer] = useState(null);
    const [stats, setStats] = useState({});
    const [sales, setSales] = useState([]);

    useEffect(() => {
        if (!id) return;

        (async () => {
            const customerData = await getCustomerById(db,id);
            const customerStats = await getCustomerStats(db,id);
            const customerSales =await getCustomerSales(db, id);

            setCustomer(customerData);
            setStats(customerStats || {});
            setSales(customerSales || []);
        })();
    }, [id, isFocused]);

    const handleDelete = async () => {
        await deleteCustomer(db, id);

        router.back();
    };

    return (
        <View style={globalStyles.container}>
            <View style={styles.header}>
                <BodyText style={globalStyles.title}>
                Customer Details
                </BodyText>

                <SecondaryText>
                Added{" "}
                {customer?.created_at
                    ? dateFormat(customer.created_at)
                    : ""}
                </SecondaryText>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Card style={styles.summaryCard}>
                <BodyText style={styles.customerName}>
                    {customer?.name}
                </BodyText>

                {!!customer?.phone && (
                    <SecondaryText
                    style={styles.phone}
                    >
                    {customer.phone}
                    </SecondaryText>
                )}

                {!!customer?.note && (
                    <>
                    <BodyText
                        style={styles.noteTitle}
                    >
                        Note
                    </BodyText>

                    <SecondaryText>
                        {customer.note}
                    </SecondaryText>
                    </>
                )}
                </Card>

                <Card style={styles.statsCard}>
                <View style={styles.summaryRow}>
                    <SecondaryText>
                    Outstanding Balance
                    </SecondaryText>

                    <BodyText
                    style={styles.balance}
                    >
                    {Number(
                        stats.balance_due || 0
                    ).toLocaleString()}
                    </BodyText>
                </View>

                <View style={styles.summaryRow}>
                    <SecondaryText>
                    Total Sales
                    </SecondaryText>

                    <BodyText
                    style={styles.totalSales}
                    >
                    {Number(
                        stats.total_sales || 0
                    ).toLocaleString()}
                    </BodyText>
                </View>

                <View style={styles.summaryRow}>
                    <SecondaryText>
                    Total Paid
                    </SecondaryText>

                    <BodyText
                    style={styles.paid}
                    >
                    {Number(
                        stats.total_paid || 0
                    ).toLocaleString()}
                    </BodyText>
                </View>

                <View style={styles.summaryRow}>
                    <SecondaryText>
                    Sales Count
                    </SecondaryText>

                    <BodyText>
                    {stats.sales_count || 0}
                    </BodyText>
                </View>
                </Card>

                <View style={styles.sectionHeader}>
                <BodyText
                    style={styles.sectionTitle}
                >
                    Recent Sales
                </BodyText>

                <SecondaryText>
                    {sales.length} sale
                    {sales.length !== 1
                    ? "s"
                    : ""}
                </SecondaryText>
                </View>

                {sales.map((sale) => (
                <Pressable
                    key={sale.id}
                    onPress={() =>
                    router.push(
                        `/sales/${sale.id}`
                    )
                    }
                >
                    <Card style={styles.saleCard}>
                    <View
                        style={styles.saleTop}
                    >
                        <BodyText
                        style={styles.saleTitle}
                        >
                        {sale.title ||
                            "Sale"}
                        </BodyText>

                        <BodyText
                        style={
                            styles.saleAmount
                        }
                        >
                        {Number(
                            sale.total_amount ||
                            0
                        ).toLocaleString()}
                        </BodyText>
                    </View>

                    <SecondaryText>
                        {dateFormat(
                        sale.date
                        )}
                    </SecondaryText>

                    {!!sale.balance_due && (
                        <SecondaryText
                        style={
                            styles.saleBalance
                        }
                        >
                        Balance: 
                        {Number(
                            sale.balance_due
                        ).toLocaleString()}
                        </SecondaryText>
                    )}
                    </Card>
                </Pressable>
                ))}

                <View style={styles.actions}>
                <TouchableOpacity
                    onPress={() =>
                    router.push(
                        `/customers/${id}/edit`
                    )
                    }
                    style={
                    globalStyles.editBtn
                    }
                >
                    <Text
                    style={
                        globalStyles.editBtnText
                    }
                    >
                    Edit Customer
                    </Text>
                </TouchableOpacity>

                <DeleteButton
                    handleOk={handleDelete}
                    item="customer"
                />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 120,
    },

    header: {
        marginBottom: 16,
    },

    summaryCard: {
        marginBottom: 16,
    },

    customerName: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 8,
    },

    phone: {
        marginBottom: 12,
    },

    noteTitle: {
        fontWeight: "700",
        marginBottom: 4,
    },

    statsCard: {
        marginBottom: 20,
    },

    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },

    balance: {
        color: "#FF6B6B",
        fontWeight: "700",
    },

    totalSales: {
        fontWeight: "700",
    },

    paid: {
        color: "#2E8B8B",
        fontWeight: "700",
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    sectionTitle: {
        fontWeight: "700",
        fontSize: 18,
    },

    saleCard: {
        marginBottom: 12,
    },

    saleTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },

    saleTitle: {
        fontWeight: "600",
        flex: 1,
    },

    saleAmount: {
        fontWeight: "700",
    },

    saleBalance: {
        marginTop: 4,
        color: "#FF6B6B",
    },

    actions: {
        gap: 12,
        marginTop: 24,
    },
});