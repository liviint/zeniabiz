import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import {
    getTransactionTemplateByid,
    upsertExpenseTemplate,
} from "../../db/transactionsTempsDb";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import CategoriesPicker from "../common/CategoriesPicker";
import { BodyText, Card, FormLabel, Input } from "../ThemeProvider/components";

export default function AddTransactionTemplateScreen() {
  const isFocused = useIsFocused();
  const { globalStyles } = useThemeStyles();
  const { id: id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const router = useRouter();

  const initialForm = {
    title: "",
    amount: "",
    type: "expense",
    category: "",
    category_id: "",
    payee: "",
    note: "",
    id: "",
  };

  const [form, setForm] = useState(initialForm);

  const handleCategoryChange = (selected) => {
    setForm((prev) => ({
      ...prev,
      category_id: selected.id,
      category: selected.name,
      type: selected.type,
    }));
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      return Alert.alert("Validation Error", "Template title is required.");
    }

    if (!form.type) {
      return Alert.alert("Validation Error", "Transaction type is required.");
    }

    await upsertExpenseTemplate(db, {
      title: form.title,
      amount: form.amount ? parseFloat(form.amount) : null,
      type: form.type,

      category: form.category,
      category_id: form.category_id,

      payee: form.payee,
      note: form.note,
      id: form.id,
    });

    Alert.alert("Success ✅", "Template saved successfully!");
    setForm(initialForm);
    router.back();
  };

  useEffect(() => {
    const loadTemplate = async () => {
      const result = await getTransactionTemplateByid(db, id);
      setForm(result);
    };
    id && loadTemplate();
  }, [isFocused]);

  return (
    <ScrollView style={globalStyles.container}>
      <BodyText style={globalStyles.title}>
        {id ? "Edit Template" : "Add Template"}
      </BodyText>
      <Card>
        <View style={{ marginBottom: 16 }}>
          <FormLabel>Template Title</FormLabel>
          <Input
            placeholder="e.g. Rent Payment"
            value={form.title}
            onChangeText={(text) => handleChange("title", text)}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <FormLabel>Amount (Optional)</FormLabel>
          <Input
            placeholder="e.g. 25000"
            keyboardType="numeric"
            value={String(form.amount)}
            onChangeText={(text) => handleChange("amount", text)}
          />
        </View>

        <CategoriesPicker
          form={form}
          handleCategoryChange={handleCategoryChange}
        />

        <View style={styles.typeRow}>
          <Pressable
            disabled={form.category_id !== ""}
            onPress={() => handleChange("type", "expense")}
            style={[
              styles.typeButton,
              form.type === "expense" && styles.expenseActive,
            ]}
          >
            <BodyText
              style={[
                styles.typeText,
                form.type === "expense" && styles.activeText,
              ]}
            >
              Expense
            </BodyText>
          </Pressable>

          <Pressable
            disabled={form.category_id !== ""}
            onPress={() => handleChange("type", "income")}
            style={[
              styles.typeButton,
              form.type === "income" && styles.incomeActive,
            ]}
          >
            <BodyText
              style={[
                styles.typeText,
                form.type === "income" && styles.activeText,
              ]}
            >
              Income
            </BodyText>
          </Pressable>
        </View>

        <View style={{ marginBottom: 16 }}>
          <FormLabel>Payee (Optional)</FormLabel>
          <Input
            placeholder="e.g. Landlord, Safaricom"
            value={form.payee}
            onChangeText={(text) => handleChange("payee", text)}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <FormLabel>Note (Optional)</FormLabel>
          <Input
            placeholder="Extra details..."
            value={form.note}
            onChangeText={(text) => handleChange("note", text)}
            multiline
          />
        </View>

        <TouchableOpacity style={globalStyles.primaryBtn} onPress={handleSave}>
          <BodyText style={globalStyles.primaryBtnText}>
            {id ? "Update Template" : "Save Template"}
          </BodyText>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  expenseActive: {
    backgroundColor: "#FF6B6B",
  },
  incomeActive: {
    backgroundColor: "#2E8B8B",
  },
  activeText: {
    color: "#FFFFFF",
  },
});
