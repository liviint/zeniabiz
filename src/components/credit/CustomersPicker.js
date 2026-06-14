import { useState, useEffect } from "react";
import { useSelector , useDispatch} from "react-redux";
import { View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import {
  FormLabel,
  CustomPicker,
} from "../ThemeProvider/components";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { getCustomers } from "../../db/customersDb";
import { clearRecentlyCreatedCustomerId } from "../../store/features/entitySelectionSlice";

export default function CustomersPicker({
  form,
  handleCustomerChange,
}) {
  const dispatch = useDispatch()
  const { globalStyles } = useThemeStyles();
  const db = useSQLiteContext();
  const router = useRouter();
  const isFocused = useIsFocused();
  const recentlyCreatedCustomerId = useSelector((state) => state.entitySelection.recentlyCreatedCustomerId);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers(db);
        setCustomers(data);
      } catch (error) {
        console.log(
          "❌ Failed to fetch customers:",
          error
        );
      }
    };

    fetchCustomers();
  }, [isFocused]);

  useEffect(() => {
    if (recentlyCreatedCustomerId && customers.length > 0) {

      const customer = customers.find((c) =>c.id === recentlyCreatedCustomerId);

      if (customer) {
        handleCustomerChange(customer);
        dispatch(clearRecentlyCreatedCustomerId());
      }
    }
  }, [customers,recentlyCreatedCustomerId,]);

  // Special value
  const ADD_CUSTOMER_VALUE =
    "__add_customer__";

  const handleSelect = (value) => {
    if (value === ADD_CUSTOMER_VALUE) {
      router.push("/customers/add");

      return;
    }

    handleCustomerChange(value);
  };

  return (
    <View style={globalStyles.formGroup}>
      <FormLabel>
        Customer
      </FormLabel>

      <CustomPicker
        selectedValue={customers.find(
          (customer) =>
            customer.id === form.customer_id
        )}
        onValueChange={(value) =>
          handleSelect(value)
        }
      >
        {/* Placeholder */}
        <Picker.Item
          label="Select customer"
        />

        {/* Customers */}
        {customers.map((customer) => (
          <Picker.Item
            key={customer.id}
            label={
              customer.phone
                ? `${customer.name} • ${customer.phone}`
                : customer.name
            }
            value={customer}
          />
        ))}

        {/* Add Customer */}
        <Picker.Item
          label="＋ Add New Customer"
          value={ADD_CUSTOMER_VALUE}
          color="#2E8B8B"
        />
      </CustomPicker>
    </View>
  );
}