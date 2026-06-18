import React, { useEffect, useState } from "react";
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
    CustomPicker,
} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import CustomersPicker from "../credit/CustomersPicker";
import PaymentMethodPicker from "./PaymentMethodsPicker";
import PaymentMethodsForm from "./PaymentMethodsForm2";

const CreditDiscountForm = ({
    markedPrice,
    styles,
    handleSave,
    checkoutModalVisible,
    setCheckoutModalVisible,
    paymentsForm,
    setPaymentsForm,
    setPaymentModalVisible,
}) => {
    const { globalStyles } = useThemeStyles();

    const [draftForm, setDraftForm] = useState(paymentsForm);

    const [paymentMethodsDraft, setPaymentMethodsDraft] = useState(
        [
            {
                method: "cash",
                amount: 0,
                id:Date.now().toString(),
            }
        ]
    );

    useEffect(() => {
        if (checkoutModalVisible) {
            setDraftForm(paymentsForm);
        }
    }, [checkoutModalVisible, paymentsForm]);

    const toNumber = (value) => {
        const n = parseFloat(value);
        return isNaN(n) ? 0 : n;
    };

    const handleCustomerChange = (customer) => {
        setDraftForm((prev) => ({
            ...prev,
            customer_id: customer?.id || null,
        }));
    };

    const handleValidationAndSaving = () => {
        const safeTotal = Number(markedPrice || 0);

        const discount = toNumber(draftForm.discount);
        const amountPaid = toNumber(draftForm.amountPaid);

        if (discount < 0) {
            return alert("Discount cannot be negative");
        }

        if (discount > safeTotal) {
            return alert("Discount cannot exceed total");
        }

        if (amountPaid < 0) {
            return alert("Amount paid cannot be negative");
        }

        console.log(draftForm,"hello draft form")
        setPaymentsForm(prev => ({...prev,...draftForm}));

        handleSave(true,draftForm);
    };

    const handleCancel = () => {
        setCheckoutModalVisible(false);
    };

    const balance = (markedPrice - draftForm.amountPaid  - draftForm.discount)
    const balanceUi = balance >= 0  ? balance : 0

    return (
        <Modal
            visible={checkoutModalVisible}
            transparent
            animationType="slide"
        >
            <ScrollView 
                contentContainerStyle={styles.modalContainer}
                keyboardShouldPersistTaps="handled"
            >
                <Card style={styles.modalCard}>
                    <BodyText>Checkout</BodyText>

                    <View style={globalStyles.formGroup}>
                        <FormLabel>Marked Price</FormLabel>
                        <BodyText>{markedPrice.toFixed(2)}</BodyText>
                    </View>

                    <View style={globalStyles.formGroup}>
                        <FormLabel>Amount Paid</FormLabel>
                        <Input
                            keyboardType="numeric"
                            value={String(draftForm.amountPaid ?? 0)}
                            onChangeText={(v) =>
                                setDraftForm((prev) => ({
                                    ...prev,
                                    amountPaid: toNumber(v),
                                }))
                            }
                        />
                    </View>

                    <View style={globalStyles.formGroup}>
                        <FormLabel>Discount</FormLabel>
                        <Input
                            keyboardType="numeric"
                            value={String(draftForm.discount ?? 0)}
                            onChangeText={(v) =>
                                setDraftForm((prev) => ({
                                    ...prev,
                                    discount: toNumber(v),
                                }))
                            }
                        />
                    </View>

                    <View style={globalStyles.formGroup}>
                        <FormLabel>Balance (Credit)</FormLabel>
                        <BodyText style={{ color: "#FF6B6B" }}>
                            {balanceUi.toFixed(2)}
                        </BodyText>
                    </View>

                    <CustomersPicker
                        form={draftForm}
                        handleCustomerChange={handleCustomerChange}
                    />

                    <PaymentMethodsForm 
                        draftForm={draftForm} 
                        setDraftForm={setDraftForm}
                        paymentMethodsDraft={paymentMethodsDraft} 
                        setPaymentMethodsDraft={setPaymentMethodsDraft}
                    />

                    <View style={globalStyles.formGroup}>
                        <Pressable
                            style={globalStyles.primaryBtn}
                            onPress={handleValidationAndSaving}
                        >
                            <BodyText style={globalStyles.primaryBtnText}>
                                Complete Sale
                            </BodyText>
                        </Pressable>
                    </View>

                    <Pressable
                        style={globalStyles.secondaryBtn}
                        onPress={handleCancel}
                    >
                        <BodyText>Cancel</BodyText>
                    </Pressable>
                </Card>
            </ScrollView>
        </Modal>
    );
};

export default CreditDiscountForm;