import { useState } from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import { useSQLiteContext } from "expo-sqlite";

import {
  BodyText,
  Input,
  FormLabel,
  Card,
} from "../../../../src/components/ThemeProvider/components";

import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";

import { createCustomer } from "../../../../src/db/customersDb";

export default function AddCustomerPage() {
  const db = useSQLiteContext();

  const router = useRouter();

  const { globalStyles } = useThemeStyles();

  const [loading, setLoading] = useState(false);

  const initialForm = {
    name: "",
    phone: "",
    note: "",
  }
  const [form, setForm] = useState(initialForm);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!form.name?.trim()) {
        Alert.alert(
          "Customer Name Required",
          "Please enter customer name."
        );

        return;
      }

      setLoading(true);

      await createCustomer(db, {
        name: form.name.trim(),
        phone: form.phone?.trim(),
        note: form.note?.trim(),
      });

      Alert.alert(
        "Success",
        "Customer added successfully."
      );
      
      setForm(initialForm)

      router.back();
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        "Failed to create customer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
    
      <View style={styles.header}>
        <BodyText
          style={globalStyles.title}
        >
          Add Customer
        </BodyText>

        <BodyText style={styles.subText}>
          Save customer details for
          easier credit tracking.
        </BodyText>
      </View>

      <Card>
        {/* Name */}
        <View style={globalStyles.formGroup}>
          <FormLabel>
            Customer Name *
          </FormLabel>

          <Input
            placeholder="Enter customer name"
            value={form.name}
            onChangeText={(value) =>
              handleChange("name", value)
            }
          />
        </View>

        {/* Phone */}
        <View style={globalStyles.formGroup}>
          <FormLabel>
            Phone Number
          </FormLabel>

          <Input
            placeholder="e.g 0712345678"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(value) =>
              handleChange("phone", value)
            }
          />
        </View>

        {/* Note */}
        <View style={globalStyles.formGroup}>
          <FormLabel>
            Note
          </FormLabel>

          <Input
            placeholder="Optional note"
            multiline
            numberOfLines={4}
            style={styles.noteInput}
            value={form.note}
            onChangeText={(value) =>
              handleChange("note", value)
            }
          />
        </View>

        {/* Save Button */}
        <Pressable
          style={[
            globalStyles.primaryBtn,
            loading && {
              opacity: 0.7,
            },
          ]}
          disabled={loading}
          onPress={handleSave}
        >
          <BodyText style={globalStyles.primaryBtnText}>
            {loading
              ? "Saving..."
              : "Save Customer"}
          </BodyText>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },

  header: {
    marginBottom: 20,
  },

  subText: {
    marginTop: 6,
    opacity: 0.7,
  },

  noteInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
});