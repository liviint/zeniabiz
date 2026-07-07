import { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
    BodyText,
    Input,
    FormLabel,
    Card,
} from "../ThemeProvider/components";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import {
    getSupplierById,
    upsertSupplier,
} from "../../db/query/suppliers";
import { useIsFocused } from "@react-navigation/native";
import { AnalyticsService } from "../../utils/analyticsService";

export default function AddEditSupplierPage({ id }) {
    useIsFocused();

    const db = useSQLiteContext();
    const router = useRouter();
    const { globalStyles } = useThemeStyles();

    const [loading, setLoading] = useState(false);

    const initialForm = {
        business_name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
    };

    const [form, setForm] = useState(initialForm);

    const handleChange = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSave = async () => {
        try {
            if (!form.business_name?.trim()) {
                Alert.alert(
                    "Business Name Required",
                    "Please enter the supplier's business name."
                );
                return;
            }

            setLoading(true);

            await upsertSupplier(db, {
                id: form.id,
                business_name: form.business_name.trim(),
                contact_person: form.contact_person?.trim(),
                phone: form.phone?.trim(),
                email: form.email?.trim(),
                address: form.address?.trim(),
                notes: form.notes?.trim(),
            });

            setForm(initialForm);

            await AnalyticsService.logFirstEvent('first_supplier_added');

            router.back();
        } catch (error) {
            console.log(error);

            Alert.alert(
                "Error",
                "Failed to save supplier."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;

        (async () => {
            const supplier = await getSupplierById(db, id);

            if (supplier) {
                setForm({ ...supplier });
            }
        })();
    }, [id]);

    return (
        <ScrollView
            style={globalStyles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <BodyText style={globalStyles.title}>
                    {id ? "Edit Supplier" : "Add Supplier"}
                </BodyText>
            </View>

            <Card>

                <View style={globalStyles.formGroup}>
                    <FormLabel>Business Name</FormLabel>

                    <Input
                        placeholder="Enter business name"
                        value={form.business_name}
                        onChangeText={(value) =>
                            handleChange("business_name", value)
                        }
                    />
                </View>

                <View style={globalStyles.formGroup}>
                    <FormLabel>Contact Person</FormLabel>

                    <Input
                        placeholder="Enter contact person"
                        value={form.contact_person}
                        onChangeText={(value) =>
                            handleChange("contact_person", value)
                        }
                    />
                </View>

                <View style={globalStyles.formGroup}>
                    <FormLabel>Phone Number</FormLabel>

                    <Input
                        placeholder="e.g. 0712345678"
                        keyboardType="phone-pad"
                        value={form.phone}
                        onChangeText={(value) =>
                            handleChange("phone", value)
                        }
                    />
                </View>

                <View style={globalStyles.formGroup}>
                    <FormLabel>Email Address</FormLabel>

                    <Input
                        placeholder="example@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={form.email}
                        onChangeText={(value) =>
                            handleChange("email", value)
                        }
                    />
                </View>

                <View style={globalStyles.formGroup}>
                    <FormLabel>Address</FormLabel>

                    <Input
                        placeholder="Business address"
                        multiline
                        value={form.address}
                        onChangeText={(value) =>
                            handleChange("address", value)
                        }
                    />
                </View>

                <View style={globalStyles.formGroup}>
                    <FormLabel>Notes</FormLabel>

                    <Input
                        placeholder="Additional notes"
                        multiline
                        numberOfLines={4}
                        style={styles.noteInput}
                        value={form.notes}
                        onChangeText={(value) =>
                            handleChange("notes", value)
                        }
                    />
                </View>

                <Pressable
                    style={[
                        globalStyles.primaryBtn,
                        loading && { opacity: 0.7 },
                    ]}
                    disabled={loading}
                    onPress={handleSave}
                >
                    <BodyText style={globalStyles.primaryBtnText}>
                        {loading
                            ? "Saving..."
                            : id
                                ? "Update Supplier"
                                : "Save Supplier"}
                    </BodyText>
                </Pressable>

            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 120,
    },

    header: {
        marginBottom: 20,
    },

    noteInput: {
        minHeight: 110,
        textAlignVertical: "top",
    },
});