import React, { useState } from "react";
import { Modal, View, Pressable } from "react-native";
import { BodyText, Input, FormLabel } from "../../../src/components/ThemeProvider/components";
import PaymentMethodPicker from "./PaymentMethodsPicker";

export default function PaymentMethodsForm({
  visible,
  setVisible,
  paymentsForm,
  setPaymentsForm,
}) {
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState(0);

  const addPayment = () => {
    setPaymentsForm((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        { payment_method: method, amount: Number(amount) },
      ],
    }));

    setAmount(0);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable
        style={{ flex: 1, justifyContent: "center", backgroundColor: "#00000066" }}
        onPress={() => setVisible(false)}
      >
        <Pressable style={{ backgroundColor: "white", margin: 20, padding: 16, borderRadius: 12 }}>

          <BodyText>Payment Methods</BodyText>

        <PaymentMethodPicker 
            form={{payment_method:method,amount}} 
            handleMethodChange={(val) => setMethod(val)}
        />

          {/* AMOUNT */}
          <FormLabel>Amount</FormLabel>
          <Input
            keyboardType="numeric"
            value={String(amount)}
            onChangeText={(v) => setAmount(v)}
          />

          {/* ADD */}
          <Pressable onPress={addPayment}>
            <BodyText style={{ color: "#2E8B8B", marginTop: 10 }}>
              Add Payment
            </BodyText>
          </Pressable>

          {/* LIST */}
          {paymentsForm.payments.map((p, i) => (
            <BodyText key={i}>
              {p.payment_method} - {p.amount}
            </BodyText>
          ))}

        </Pressable>
      </Pressable>
    </Modal>
  );
}