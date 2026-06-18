import {  useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
    View,
    Pressable,
    Modal,
    TouchableOpacity
} from "react-native";
import {
    Card,
    BodyText,
    Input,
    FormLabel
} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";

const EditSaleForm = ({
    styles,
    setCart,
    modalVisible,
    setModalVisible,
    selectedItem,
    setSelectedItem,
    setDate,
    date
}) => {
    const { globalStyles } = useThemeStyles();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const updateItem = (updatedItem) => {
        setCart((prev) =>
        prev.map((c) =>
            c.product_id === updatedItem.product_id ? updatedItem : c
        )
        );
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
        const updated = new Date(date);
        updated.setFullYear(selectedDate.getFullYear());
        updated.setMonth(selectedDate.getMonth());
        updated.setDate(selectedDate.getDate());
        setDate(updated);
        }
    };

    const handleTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
        const updated = new Date(date);
        updated.setHours(selectedTime.getHours());
        updated.setMinutes(selectedTime.getMinutes());
        updated.setSeconds(selectedTime.getSeconds());
        setDate(updated);
        }
    };

    return (
        <Modal 
            visible={modalVisible} 
            transparent 
            animationType="slide"
        >
        <View 
            style={styles.modalContainer}
            keyboardShouldPersistTaps="handled"
        >
            <Card style={styles.modalCard}>
            <BodyText>Edit Item</BodyText>

            <View style={globalStyles.formGroup}>
                <FormLabel>Price</FormLabel>
                <Input
                keyboardType="numeric"
                value={String(selectedItem?.price || "")}
                onChangeText={(v) =>
                    setSelectedItem(prev =>  ({
                        ...prev,
                        price: parseFloat(v) || 0,
                    }))
                }
                />
            </View>
            

            <View style={globalStyles.formGroup}>
                <FormLabel>Quantity</FormLabel>
                <Input
                keyboardType="numeric"
                value={String(selectedItem?.quantity || "")}
                onChangeText={(v) =>
                    setSelectedItem(prev => ({
                        ...prev,
                        quantity: parseFloat(v) || 0,
                    }))
                }
                />
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Date & Time</FormLabel>
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
                    <BodyText>{date?.toDateString()}</BodyText>
                </TouchableOpacity>

                {/* Time Button */}
                <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    style={{
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 4,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent:"center",
                    ...globalStyles.formBorder
                    }}
                >
                    <BodyText>
                    {date?.getHours().toString().padStart(2, "0")}:
                    {date?.getMinutes().toString().padStart(2, "0")}
                    </BodyText>
                </TouchableOpacity>
                </View>

            {showDatePicker && (
            <DateTimePicker
                value={date}
                mode="date"
                display="calendar"
                onChange={handleDateChange}
                maximumDate={new Date()} 
            />
            )}

            {showTimePicker && (
            <DateTimePicker
                value={date}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
            />
            )}
        </View>
            
            <View style={globalStyles.formGroup}>
                <Pressable
                style={globalStyles.primaryBtn}
                onPress={() => {
                    updateItem(selectedItem);
                    setModalVisible(false);
                }}
            >
                <BodyText style={globalStyles.primaryBtnText}>
                Save
                </BodyText>
            </Pressable>
            </View>
            
            <View style={globalStyles.formGroup}>
                <Pressable 
                style={globalStyles.secondaryBtn}
                onPress={() => setModalVisible(false)}
                >
                <BodyText
                style={globalStyles.secondaryBtnText}
                >
                Cancel
                </BodyText>
            </Pressable>
            </View>
            
            </Card>
        </View>
        </Modal>
    );
}

export default EditSaleForm
