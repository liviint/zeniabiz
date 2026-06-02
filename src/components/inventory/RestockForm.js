import { useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState, useEffect } from "react";
import { Alert, Pressable, StyleSheet, View , Modal, TouchableOpacity,  } from "react-native";
import { BodyText, Card, Input , FormLabel, SecondaryText} from "../../components/ThemeProvider/components";
import { getProductById, restockProduct , upsertBatch} from "../../db/inventoryDb";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function RestockForm({
    product, 
    restockVisible, 
    setRestockVisible, 
    setProduct, 
    setReoloadBatches, 
    batch ,
    setSelectedBatch,
}) {
    const db = useSQLiteContext();
    const { globalStyles } = useThemeStyles();
    const { id } = useLocalSearchParams();

    const initialForm = {
        stock_quantity:0,
        selling_price:"",
        cost_price:"",
        expiry_date:null,
    }
    const [form,setForm] = useState(initialForm)
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleFormChange = (key,value) => {
        setForm(prev => ({...prev,[key]:value}))
    }

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const updated = new Date();
            updated.setFullYear(selectedDate.getFullYear());
            updated.setMonth(selectedDate.getMonth());
            updated.setDate(selectedDate.getDate());
            setForm(prev => ({...prev,expiry_date:updated}))
        }
    };

    const handleRestockConfirm = async () => {
        let expiry_date = form.expiry_date ? form.expiry_date.toISOString() : null
        if(batch){
            await upsertBatch(db,{...batch,...form,expiry_date})
            setSelectedBatch(null)
            Alert.alert("Success", `Updated Successfully`);
        }
        else{
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

            if (price <= cost) {
                return Alert.alert(
                    "Validation Error",
                    "Selling price should be higher than cost price."
                );
            }

            await restockProduct(db, id, {
                stock_quantity: quantity,
                cost_price: cost,
                selling_price: price,
                expiry_date,
            }); 
            const updated = await getProductById(db, id);
            setProduct(updated);

            Alert.alert("Success", `Added ${form.stock_quantity} items to stock`);
        }
        setRestockVisible(false);
        setForm(initialForm)
        setReoloadBatches(prev => prev + 1)
    };

    useEffect(() => {
        if (!batch) {
            setForm(initialForm);
            return;
        }

        setForm({
            stock_quantity: String(batch.quantity_on_hand),
            cost_price: String(batch.cost_price),
            selling_price: String(batch.selling_price),
            expiry_date: batch.expiry_date
            ? new Date(batch.expiry_date)
            : null,
        });
        }, [batch]);

    return (
        <Modal
            visible={restockVisible}
            transparent
            animationType="fade"
        >
        <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
            <BodyText style={styles.modalTitle}>
                {batch ? "Edit Batch" : "Restock Product"}
            </BodyText>

            {batch && (
                <SecondaryText style={{ marginBottom: 12,fontSize:14, }}>
                    Only the Expiry Date is editable.
                </SecondaryText>
            )}
            
            <View style={globalStyles.formGroup}>
                <FormLabel>Batch Quantity</FormLabel>
                <Input
                    editable={!batch}
                    keyboardType="numeric"
                    value={form.stock_quantity}
                    onChangeText={(val) => handleFormChange("stock_quantity",val)}
                    style={styles.input}
                    />
                </View>

                <View style={globalStyles.formGroup}>
                    <FormLabel>Cost Price</FormLabel>
                    <Input
                        editable={!batch}
                        keyboardType="numeric"
                        value={form.cost_price}
                        onChangeText={(val) => handleFormChange("cost_price",val)}
                        style={styles.input}
                    />
                </View>

                <View style={globalStyles.formGroup}>
                    <FormLabel>Selling Price</FormLabel>
                    <Input
                        editable={!batch}
                        keyboardType="numeric"
                        value={form.selling_price}
                        onChangeText={(val) => handleFormChange("selling_price",val)}
                        style={styles.input}
                    />
                </View>

                <View style={globalStyles.formGroup}>
                    <FormLabel>Expiry Date</FormLabel>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 4,
                        alignItems: "center",
                        ...globalStyles.formBorder
                        }}
                    >
                        <BodyText>
                        {form?.expiry_date
                            ? new Date(form.expiry_date).toDateString()
                            : "Select date"}
                        </BodyText>
                    </TouchableOpacity>
        
                    
                    </View>
        
                    {showDatePicker && (
                    <DateTimePicker
                        value={form.expiry_date || new Date()}
                        mode="date"
                        display="calendar"
                        onChange={handleDateChange}
                    />
                    )}
                
                        </View>

                <View style={styles.modalActions}>
                    <Pressable
                        style={globalStyles.secondaryBtn}
                        onPress={() => {
                            setRestockVisible(false)
                            setSelectedBatch(null)
                        }}
                    >
                    <BodyText 
                        style={globalStyles.secondaryBtnText}
                    >
                        Cancel
                    </BodyText>
                    </Pressable>

                    <Pressable
                        style={globalStyles.primaryBtn}
                        onPress={handleRestockConfirm}
                    >
                    <BodyText style={globalStyles.primaryBtnText}>
                        {batch ? "Edit Batch" : "Restock Product"}
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
        marginBottom: 2,
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