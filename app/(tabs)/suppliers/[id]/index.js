import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
    View,
    TouchableOpacity,
    Text,
    ScrollView,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import {
    BodyText,
    Card,
    SecondaryText,
} from "../../../../src/components/ThemeProvider/components";

import {
    getSupplierById,
    deleteSupplier,
} from "../../../../src/db/query/suppliers";

import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import DeleteButton from "../../../../src/components/common/DeleteButton";
import { dateFormat } from "../../../../utils/dateFormat";

export default function SupplierDetails() {
    const { globalStyles } = useThemeStyles();

    const isFocused = useIsFocused();
    const db = useSQLiteContext();
    const router = useRouter();

    const { id } = useLocalSearchParams();

    const [supplier, setSupplier] = useState(null);

    useEffect(() => {
        if (!id) return;

        (async () => {
            const data = await getSupplierById(db, id);
            setSupplier(data);
        })();
    }, [id, isFocused]);

    const handleDelete = async () => {
        await deleteSupplier(db, id);
        router.back();
    };

    return (
        <View style={globalStyles.container}>
            <View style={styles.header}>
                <BodyText style={globalStyles.title}>
                    Supplier Details
                </BodyText>

                <SecondaryText>
                    Added{" "}
                    {supplier?.created_at
                        ? dateFormat(supplier.created_at)
                        : ""}
                </SecondaryText>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Card style={styles.summaryCard}>

                    <BodyText style={styles.businessName}>
                        {supplier?.business_name}
                    </BodyText>

                    {!!supplier?.contact_person && (
                        <>
                            <BodyText style={styles.label}>
                                Contact Person
                            </BodyText>

                            <SecondaryText>
                                {supplier.contact_person}
                            </SecondaryText>
                        </>
                    )}

                    {!!supplier?.phone && (
                        <>
                            <BodyText style={styles.label}>
                                Phone
                            </BodyText>

                            <SecondaryText>
                                {supplier.phone}
                            </SecondaryText>
                        </>
                    )}

                    {!!supplier?.email && (
                        <>
                            <BodyText style={styles.label}>
                                Email
                            </BodyText>

                            <SecondaryText>
                                {supplier.email}
                            </SecondaryText>
                        </>
                    )}

                    {!!supplier?.address && (
                        <>
                            <BodyText style={styles.label}>
                                Address
                            </BodyText>

                            <SecondaryText>
                                {supplier.address}
                            </SecondaryText>
                        </>
                    )}

                    {!!supplier?.notes && (
                        <>
                            <BodyText style={styles.label}>
                                Notes
                            </BodyText>

                            <SecondaryText>
                                {supplier.notes}
                            </SecondaryText>
                        </>
                    )}

                </Card>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={globalStyles.editBtn}
                        onPress={() =>
                            router.push(`/suppliers/${id}/edit`)
                        }
                    >
                        <Text style={globalStyles.editBtnText}>
                            Edit Supplier
                        </Text>
                    </TouchableOpacity>

                    <DeleteButton
                        handleOk={handleDelete}
                        item="supplier"
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
        marginBottom: 20,
    },

    businessName: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 20,
    },

    label: {
        fontWeight: "700",
        marginTop: 14,
        marginBottom: 4,
    },

    actions: {
        gap: 12,
        marginTop: 12,
    },
});