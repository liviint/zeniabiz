import {
    View,
    Pressable,
    Modal,
    ScrollView,
} from "react-native";
import {
    Card,
    BodyText,
    Input,
    FormLabel,
} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import CustomersPicker from "../credit/CustomersPicker";

const CreditDiscountForm = ({
    total,
    styles, 
    handleSave, 
    checkoutModalVisible, 
    setCheckoutModalVisible,
    paymentsForm,
    setPaymentsForm
}) => {
    const { globalStyles } = useThemeStyles();

    const handleCustomerChange = (customer) => {
        setPaymentsForm((prev) => ({
            ...prev,
            customer_id: customer?.id || null,
        }));
    };

    

    return (

        <Modal 
            visible={checkoutModalVisible} 
            transparent 
            animationType="slide"
        >
        <ScrollView contentContainerStyle={styles.modalContainer}
        >
            <Card style={styles.modalCard}>

            <BodyText>Checkout</BodyText>

            <View style={globalStyles.formGroup}>
                <FormLabel>Total</FormLabel>
                <BodyText>{total.toFixed(2)}</BodyText>
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Amount Paid</FormLabel>
                <Input
                keyboardType="numeric"
                value={String(paymentsForm.amountPaid)}
                onChangeText={(v) => setPaymentsForm(prev => ({...prev,amountPaid:parseFloat(v)}))}
                />
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Discount</FormLabel>
                <Input
                    keyboardType="numeric"
                    value={String(paymentsForm.discount)}
                    onChangeText={(v) => setPaymentsForm(prev => ({...prev,discount:parseFloat(v) || 0}))}
                />
            </View>

            <View style={globalStyles.formGroup}>
                <FormLabel>Balance (Credit)</FormLabel>
                <BodyText style={{ color: "#FF6B6B" }}>
                {(total - paymentsForm.amountPaid - paymentsForm.discount).toFixed(2)}
                </BodyText>
            </View>

            
            <CustomersPicker
                form={paymentsForm}
                handleCustomerChange={handleCustomerChange}
            />

            <View style={globalStyles.formGroup}>
                <Pressable
                style={globalStyles.primaryBtn}
                onPress={() => handleSave(true)}
            >
                <BodyText style={globalStyles.primaryBtnText}>
                Complete Sale
                </BodyText>
            </Pressable>
            </View>
            

            <Pressable
                style={globalStyles.secondaryBtn}
                onPress={() => setCheckoutModalVisible(false)}
            >
                <BodyText>Cancel</BodyText>
            </Pressable>

            </Card>
        </ScrollView>
        </Modal>
    );
}

export default CreditDiscountForm
