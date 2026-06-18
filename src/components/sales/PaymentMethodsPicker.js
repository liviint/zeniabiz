import { View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { FormLabel, CustomPicker } from "../ThemeProvider/components";
import { useThemeStyles } from "../../hooks/useThemeStyles";

export default function PaymentMethodPicker({
  value,
  handleMethodChange,
}) {
  const { globalStyles } = useThemeStyles();

  const paymentMethods = [
    { label: "Cash", value: "cash" },
    { label: "M-Pesa", value: "mpesa" },
    { label: "Card", value: "card" },
    { label: "Bank Transfer", value: "bank" },
    { label: "Other", value: "other" },
  ];

  const handleSelect = (value) => {
    handleMethodChange(value);
  };

  return (
    <View style={globalStyles.formGroup}>
      <FormLabel>Payment Method</FormLabel>

      <CustomPicker
        selectedValue={value}
        onValueChange={(value) => handleSelect(value)}
      >
        {/* Placeholder */}
        <Picker.Item label="Select payment method" value={null} />

        {/* Methods */}
        {paymentMethods.map((method) => (
          <Picker.Item
            key={method.value}
            label={method.label}
            value={method.value}
          />
        ))}
      </CustomPicker>
    </View>
  );
}