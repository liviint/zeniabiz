import { useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState, useEffect } from "react";
import { Alert, Pressable, StyleSheet, View , Modal } from "react-native";
import { BodyText, Card, Input } from "../../components/ThemeProvider/components";
import { getProductById, restockProduct } from "../../db/inventoryDb";
import { useThemeStyles } from "../../hooks/useThemeStyles";

export default function RestockForm({product, restockVisible, setRestockVisible, setProduct }) {
    const db = useSQLiteContext();
    const { globalStyles } = useThemeStyles();
    const { id } = useLocalSearchParams();

    const initialForm = {
        stock_quantity:0,
        selling_price:"",
        cost_price:"",
    }
    const [form,setForm] = useState(initialForm)

    const handleFormChange = (key,value) => {
        setForm(prev => ({...prev,[key]:value}))
    }

    const handleRestockConfirm = async () => {

        const quantity = parseInt(form.stock_quantity, 10);
        const cost = parseFloat(form.cost_price);
        const price = parseFloat(form.selling_price);

        if (!quantity || quantity <= 0) {
            Alert.alert("Invalid input", "Enter a valid quantity");
            return;
        }

        if (!cost || cost <= 0) {
            Alert.alert("Invalid input", "Enter a valid cost price");
            return;
        }

        if (!price || price <= 0) {
            Alert.alert("Invalid input", "Enter a valid selling price");
            return;
        }

        

        await restockProduct(db, id, {
            stock_quantity: quantity,
            cost_price: cost,
            selling_price: price
        });

        const updated = await getProductById(db, id);
        setProduct(updated);

        setRestockVisible(false);
        setForm(initialForm)

        Alert.alert("Success", `Added ${form.stock_quantity} items to stock`);
    };

    return (
        <Modal
            visible={restockVisible}
            transparent
            animationType="fade"
        >
        <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
            <BodyText style={styles.modalTitle}>Restock Product</BodyText>
            
            <View style={globalStyles.formGroup}>
                <Input
                    placeholder="Enter quantity"
                    keyboardType="numeric"
                    value={form.stock_quantity}
                    onChangeText={(val) => handleFormChange("stock_quantity",val)}
                    style={styles.input}
                    />
                </View>

                <View style={globalStyles.formGroup}>
                    <Input
                        placeholder="Cost per item"
                        keyboardType="numeric"
                        value={form.cost_price}
                        onChangeText={(val) => handleFormChange("cost_price",val)}
                        style={styles.input}
                    />
                </View>

                <View style={globalStyles.formGroup}>
                    <Input
                        placeholder="Selling price per item"
                        keyboardType="numeric"
                        value={form.selling_price}
                        onChangeText={(val) => handleFormChange("selling_price",val)}
                        style={styles.input}
                    />
                </View>

                <View style={styles.modalActions}>
                    <Pressable
                        style={styles.cancelBtn}
                        onPress={() => setRestockVisible(false)}
                    >
                    <BodyText>Cancel</BodyText>
                    </Pressable>

                    <Pressable
                        style={globalStyles.primaryBtn}
                        onPress={handleRestockConfirm}
                    >
                    <BodyText style={globalStyles.primaryBtnText}>
                        Confirm
                    </BodyText>
                    </Pressable>
                </View>
            </Card>
        </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalContent: {
        width: "85%",
        padding: 20,
        borderRadius: 12,
    },

    modalTitle: {
        fontSize: 18,
        marginBottom: 12,
    },

    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
    },

    cancelBtn: {
        justifyContent: "center",
        paddingHorizontal: 10,
    },
});