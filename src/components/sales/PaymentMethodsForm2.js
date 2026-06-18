import { Pressable } from "react-native";
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

            <Pressable
                style={globalStyles.secondaryBtn}
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
                <BodyText>Add Payment</BodyText>
            </Pressable>
        </>
    );
};

export default PaymentMethodsForm