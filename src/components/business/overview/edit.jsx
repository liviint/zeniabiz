import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { useIsFocused  } from "expo-router";

import { api } from "../../../../api";
import { useThemeStyles } from "../../../hooks/useThemeStyles";
import {
    BodyText,
    FormLabel,
    Input,
} from "../../ThemeProvider/components";
import AddEditModal from "../../common/addEditModal";
import { getActiveContextSync } from "../../../db/utils";
import { useSQLiteContext } from "expo-sqlite";
import { upsertCompany } from "../../../db/query/companies";


const EditBusinessModal = ({
    visible,
    setVisible,
    onSuccess,
    businessData,
    setRefreshData,
    isUserLoggedIn
}) => {
    const db = useSQLiteContext();
    const { globalStyles } = useThemeStyles();
    const isFocused = useIsFocused()
    
    const [formData, setFormData] = useState({});

    useEffect(() => {
        businessData && setFormData(businessData)
    },[businessData,isFocused])


    const updateField = (field, value) => {
        setFormData(prev => ({
        ...prev,
        [field]: value,
        }));
    };

    const runAfterSave = () => {
        setRefreshData(prev => prev + 1)
        setVisible(false);
        if (onSuccess) {
            onSuccess();
        }
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            return alert("Business name is required");
        }
            const { company, user_id } =  await getActiveContextSync(db);
            await upsertCompany(db,{id:company,...formData, owner:user_id})
            if(!isUserLoggedIn){
                runAfterSave()
                return
            }
        try {
            await api.patch(
                `/core/companies/${company}/`,
                formData
            );
            runAfterSave()
        } catch (err) {
        console.log(
            "Business update error:",
            err?.response?.data || err.message
        );
        }
    };

    return (
        <AddEditModal
            visible={visible}
        >
            <BodyText style={styles.sectionTitle}>
                Edit Business
            </BodyText>

            <View style={globalStyles.formGroup}>
                <FormLabel>Business Name</FormLabel>
                <Input
                    value={formData.name}
                    onChangeText={(value) =>
                    updateField("name", value)
                    }
                />
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Phone</FormLabel>
                <Input
                    value={formData.phone}
                    onChangeText={(value) =>
                    updateField("phone", value)
                    }
                    keyboardType="phone-pad"
                />
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Email</FormLabel>
                <Input
                    value={formData.email}
                    onChangeText={(value) =>
                    updateField("email", value)
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Address</FormLabel>
                <Input
                    value={formData.address}
                    onChangeText={(value) =>
                    updateField("address", value)
                    }
                />
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Country</FormLabel>
                <Input
                    value={formData.country}
                    onChangeText={(value) =>
                    updateField("country", value)
                    }
                />
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Currency</FormLabel>
                <Input
                    value={formData.currency}
                    onChangeText={(value) =>
                    updateField("currency", value)
                    }
                />
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Timezone</FormLabel>
                <Input
                    value={formData.timezone}
                    onChangeText={(value) =>
                    updateField("timezone", value)
                    }
                />
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Receipt Footer</FormLabel>
                <Input
                    multiline
                    numberOfLines={4}
                    value={formData.receipt_footer}
                    onChangeText={(value) =>
                    updateField("receipt_footer", value)
                    }
                />
            </View>

            <View style={styles.modalActions}>
                <TouchableOpacity
                    style={globalStyles.secondaryBtn}
                    onPress={() => setVisible(false)}
                >
                    <Text style={globalStyles.secondaryBtnText}>
                    Cancel
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={globalStyles.primaryBtn}
                    onPress={handleSave}
                >
                    <Text style={globalStyles.primaryBtnText}>
                    Save
                    </Text>
                </TouchableOpacity>
            </View>
        </AddEditModal>
    );
};

export default EditBusinessModal;

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 16,
    },


    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
        gap: 10,
    },
});