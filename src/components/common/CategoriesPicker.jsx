import { useState, useEffect } from "react";
import { View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { FormLabel, CustomPicker } from "../ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { getCategories } from "../../db/transactionsDb";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";

export default function CategoriesPicker({
  form,
  handleCategoryChange,
}) {
    const { globalStyles } = useThemeStyles();
    const db = useSQLiteContext();
    const router = useRouter();
    const isFocused = useIsFocused()
    const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories(db);
        setCategories(data);
      } catch (error) {
        console.log("❌ Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, [isFocused]);

  // Special value for Add Category button
  const ADD_CATEGORY_VALUE = "__add_category__";

  const handleSelect = (value) => {
    if (value === ADD_CATEGORY_VALUE) {
      router.push("/categories/add/modal");
      return;
    }

    handleCategoryChange(value);
  };

  return (
    <View style={globalStyles.formGroup}>
      <FormLabel>Category</FormLabel>

      <CustomPicker
        selectedValue={categories.find(cate => cate.uuid === form.category_uuid)}
        onValueChange={(value) => handleSelect(value)}
      >
        {/* Default placeholder */}
        <Picker.Item label="Select category" value={null} />

        {/* Categories */}
        {categories.map((cat) => (
          <Picker.Item
            key={cat.uuid}
            label={`${cat.icon} ${cat.name}`}
            value={cat}
          />
        ))}

        {/* Add Category Option */}
        <Picker.Item
          label="＋ Add New Category"
          value={ADD_CATEGORY_VALUE}
          color="#2E8B8B"
        />
      </CustomPicker>
    </View>
  );
}
