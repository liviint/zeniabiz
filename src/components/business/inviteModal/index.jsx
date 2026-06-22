import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
} from "react-native";
import { useThemeStyles } from "../../../hooks/useThemeStyles";
import { BodyText, Card, CustomPicker,Input, FormLabel } from "../../ThemeProvider/components";
import { api } from "../../../../api";
import { Picker } from "@react-native-picker/picker";

const BusinessPage = ({
    inviteModal, 
    setInviteModal,
    setRefreshData
}) => {
    const { globalStyles } = useThemeStyles();
    const initialinviteFormData = { email:"",role:"Staff"}
    const [inviteFormData,setinviteFormData] = useState(initialinviteFormData)

    const handleInvite = async () => {
        if (!inviteFormData.email) return;

        try {
            await api.post("/core/company-invites/", inviteFormData);
            setinviteFormData(initialinviteFormData)
            setInviteModal(false);
            setRefreshData(prev => prev + 1)
        } catch (err) {
            console.log("Invite error:", err?.response?.data || err.message);
        } 
    };

    return (
        <Modal visible={inviteModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
            <Card style={styles.modal}>
                <BodyText style={styles.sectionTitle}>Invite User</BodyText>

                <View style={globalStyles.formGroup}>
                <FormLabel >Email address</FormLabel>
                <Input
                    value={inviteFormData.email}
                    onChangeText={(val) => setinviteFormData(prev => ({...prev,email:val}))}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                </View>
                

                <View style={globalStyles.formGroup}>
                    <FormLabel >Select Role</FormLabel>
                    <CustomPicker
                    selectedValue={inviteFormData.role}
                    onValueChange={(value) =>
                        setinviteFormData(prev => ({ ...prev, role: value }))
                    }
                    >
                    <Picker.Item label="Staff" value="staff" />
                    <Picker.Item label="Manager" value="manager" />
                    </CustomPicker>
                </View>

                {/* Actions */}
                <View style={styles.modalActions}>
                <TouchableOpacity
                    onPress={() => setInviteModal(false)}
                    style={globalStyles.secondaryBtn}
                >
                    <Text style={globalStyles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleInvite}
                    style={globalStyles.primaryBtn}
                >
                    <Text style={globalStyles.primaryBtnText}>Send</Text>
                </TouchableOpacity>
                </View>
            </Card>
            </View>
        </Modal>
    );
};

export default BusinessPage;

const styles = StyleSheet.create({

    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        padding: 20,
    },

    modal: {
        borderRadius: 12,
    },

    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },

    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 16,
        gap: 10,
    },
});