import {  useState } from "react";
import {
    View,
    Pressable
} from "react-native";
import {
    BodyText,
    Input,
    FormLabel
} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import AddEditModal from "../common/addEditModal";

const EditSaleForm = ({
    styles,
    setCart,
    modalVisible,
    setModalVisible,
    selectedItem,
    setSelectedItem,
}) => {
    const { globalStyles } = useThemeStyles();
    

    const updateItem = (updatedItem) => {
        setCart((prev) =>
        prev.map((c) =>
            c.product_id === updatedItem.product_id ? updatedItem : c
        )
        );
    };

    return (
        
        <AddEditModal 
            visible={modalVisible}
        >

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
            
            </AddEditModal>
        
        
    );
}

export default EditSaleForm
