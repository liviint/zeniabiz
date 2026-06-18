import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import {
    BodyText,
    FormLabel,
    Input,
} from "../ThemeProvider/components";
import PaymentMethodPicker from "./PaymentMethodsPicker";

const PaymentMethodsForm = ({
    draftForm, 
    setDraftForm,
    paymentMethodsDraft,
    setPaymentMethodsDraft
}) => {
    const { globalStyles } = useThemeStyles();
    const currentPayment = paymentMethodsDraft[paymentMethodsDraft.length - 1];
    const [isSplitPayment, setIsSplitPayment] = useState(false);

    return (
        <>
        {paymentMethodsDraft.slice(0, -1).map((method) => (
    <View key={method.id} style={styles.paymentRow}>
        <BodyText>
            {method.method.toUpperCase()} - {method.amount.toFixed(2)}
        </BodyText>

        <Pressable
            onPress={() =>
                setPaymentMethodsDraft((prev) =>
                    prev.filter((item) => item.id !== method.id)
                )
            }
        >
            <BodyText style={styles.removeText}>
                ✕
            </BodyText>
        </Pressable>
    </View>
))}

        <View >
            <PaymentMethodPicker
                value={currentPayment.method}
                handleMethodChange={(val) =>
                    setPaymentMethodsDraft((prev) =>
                        prev.map((item) =>
                            item.id === currentPayment.id
                                ? { ...item, method: val }
                                : item
                        )
                    )
                }
            />
    {
        isSplitPayment && 
        <>
            <FormLabel>Payment Amount</FormLabel>
            <Input
                keyboardType="numeric"
                value={String(currentPayment.amount)}
                onChangeText={(v) =>
                    setPaymentMethodsDraft((prev) =>
                        prev.map((item) =>
                            item.id === currentPayment.id
                                ? {
                                    ...item,
                                    amount: Number(v) || 0,
                                }
                                : item
                        )
                    )
                }
            />
        </>
    }
</View>

        {!isSplitPayment && 
            <View style={{...globalStyles.formGroup,marginBottom:20,marginTop:0}}>
                <Pressable
                    style={styles.btn}
                    onPress={() => setIsSplitPayment(true)}
                    >
                    <BodyText style={styles.btnText}>
                        + Split payment across another method
                    </BodyText>
                </Pressable>
            </View>
        }
            
        {isSplitPayment && 
            <View style={{...globalStyles.formGroup,margiBottomn:10}}>
                <Pressable
                    style={styles.btn}
                    onPress={() => {
                            setPaymentMethodsDraft((prev) => [
                                ...prev,
                                {
                                id: Date.now().toString(),
                                method: "cash",
                                amount: 0,
                                },
                            ]);
                        }}
                    >
                    <BodyText style={styles.btnText}>
                        + Add another payment method
                    </BodyText>
                </Pressable>
            </View>
        }
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
    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
    },

    removeText: {
        color: "#FF6B6B",
        fontWeight: "600",
    }
})

export default PaymentMethodsForm