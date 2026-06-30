import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { FormLabel, CustomPicker } from "../ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { getCategories } from "../../db/query/categories";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { clearRecentlyCreatedCategoryId } from "../../store/features/entitySelectionSlice";

export default function CategoriesPicker({
  form,
  handleCategoryChange,
}) {
    const dispatch = useDispatch()
    const { globalStyles } = useThemeStyles();
    const db = useSQLiteContext();
    const router = useRouter();
    const isFocused = useIsFocused()
    const [categories, setCategories] = useState([]);
    const recentlyCreatedCategoryId = useSelector((state) => state.entitySelection.recentlyCreatedCategoryId);

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

  useEffect(() => {
    if (recentlyCreatedCategoryId && categories.length > 0) {
      const category = categories.find((c) => c.id === recentlyCreatedCategoryId);
      
      if (category) {
        const timer = setTimeout(() => {
          handleCategoryChange(category);
          dispatch(clearRecentlyCreatedCategoryId());
        }, 50);

        return () => clearTimeout(timer);
      }
    }
  }, [categories, recentlyCreatedCategoryId]);

  // Special value for Add Category button
  const ADD_CATEGORY_VALUE = "__add_category__";

  const handleSelect = (value) => {
    if (value === ADD_CATEGORY_VALUE) {
      router.push("/expenses/categories/add/modal");
      return;
    }

    handleCategoryChange(value);
  };

  return (
    <View style={globalStyles.formGroup}>
      <FormLabel>Category</FormLabel>

      <CustomPicker
        selectedValue={categories.find(cate => cate.id === form.category_id)}
        onValueChange={(value) => handleSelect(value)}
      >
        {/* Default placeholder */}
        <Picker.Item label="Select category" />

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
