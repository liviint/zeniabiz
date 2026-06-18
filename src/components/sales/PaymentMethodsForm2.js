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
    paymentMethodsDraft,
    setPaymentMethodsDraft
}) => {
    const { globalStyles } = useThemeStyles();

    return (
        <>
        {paymentMethodsDraft.map(method => <View 
                    key={method.id}>
                <View 
                    style={globalStyles.formGroup}
                    key={method.id}
                >
                    <PaymentMethodPicker
                        value={method.method}
                        onChange={(val) =>
                            setPaymentMethodsDraft((prev) =>
                                prev.map((item) =>
                                    item.id === method.id
                                        ? { ...item, method: val }
                                        : item
                                )
                            )
                        }
                    />
                    <FormLabel>Payment Amount</FormLabel>

                    <Input
                        keyboardType="numeric"
                        value={String(method.amount)}
                        onChangeText={(v) =>
                            setPaymentMethodsDraft((prev) =>
                                prev.map((item) =>
                                    item.id === method.id
                                        ? {
                                            ...item,
                                            amount: Number(v) || 0,
                                        }
                                        : item
                                )
                            )
                        }
                    />
                </View>
            </View>
        )}
            
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