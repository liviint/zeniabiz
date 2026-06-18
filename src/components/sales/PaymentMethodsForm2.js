import { Pressable, StyleSheet, View } from "react-native";
import {
    BodyText,
    Input,
    FormLabel,
} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import PaymentMethodPicker from "./PaymentMethodsPicker";

const PaymentMethodsForm = ({
    draftForm, 
    setDraftForm,
    paymentDraft, 
    setPaymentDraft
}) => {
    const { globalStyles } = useThemeStyles();

    return (
        <>
        <View styles={globalStyles.formGroup}>
            <PaymentMethodPicker
                value={paymentDraft.payment_method}
                onChange={(method) =>
                    setPaymentDraft((prev) => ({
                        ...prev,
                        payment_method: method,
                    }))
                }
            />
            <FormLabel>Payment Amount</FormLabel>

            <Input
                keyboardType="numeric"
                value={String(paymentDraft.amount)}
                onChangeText={(v) =>
                    setPaymentDraft((prev) => ({
                        ...prev,
                        amount: Number(v) || 0,
                    }))
                }
            />
        </View>
            
        <View style={{...globalStyles.formGroup,margiBottomn:10}}>
            <Pressable
                style={styles.btn}
                onPress={() => {
                    setDraftForm((prev) => ({
                        ...prev,
                        payments: [
                            ...(prev.payments || []),
                            paymentDraft,
                        ],
                    }));

                    setPaymentDraft({
                        payment_method: "cash",
                        amount: 0,
                    });
                }}
            >
                <BodyText style={styles.btnText}>
                    + Add another payment method
                </BodyText>
            </Pressable>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    btn: {
        marginTop: 8,
        alignSelf: "flex-start",
        paddingVertical: 4,
    },

    btnText: {
        color: "#2E8B8B",
        fontWeight: "500",
    },
})

export default PaymentMethodsForm