import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    Alert,
    InteractionManager,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
    getTransactionTemplateByid,
    upsertExpenseTemplate,
} from "../../db/query/expenses/templates";
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

    Alert.alert("Success", "Template saved successfully!");

    router.back();
  };

  useEffect(() => {
    const loadTemplate = async () => {
      const result = await getTransactionTemplateByid(db, id);
      setForm(result);
    };
    if (id && isFocused) {
      const task = InteractionManager.runAfterInteractions(() => {
        loadTemplate();
      });
      return () => task.cancel();
    }
  }, [id, isFocused]);

  return (
    <KeyboardAwareScrollView
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <BodyText style={globalStyles.title}>
        {id ? "Edit Expense Template" : "Add Expense Template"}
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
    </KeyboardAwareScrollView>
  );
}
