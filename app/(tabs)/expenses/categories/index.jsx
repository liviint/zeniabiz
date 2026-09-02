import { useIsFocused, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AddButton } from "../../../../src/components/common/AddButton";
import {
    BodyText
} from "../../../../src/components/ThemeProvider/components";
import { getCategories } from "../../../../src/db/query/categories";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import { syncManager } from "../../../../utils/syncManager";

export default function CategoriesListScreen({ navigation }) {
  const db = useSQLiteContext();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const isFocused = useIsFocused();

  const loadCategories = async () => {
    const categories = await getCategories(db);
    const income = categories.filter((cate) => cate.type === "income");
    const expense = categories.filter((cate) => cate.type !== "income");
    setIncomeCategories(income);
    setExpenseCategories(expense);
  };

  useEffect(() => {
    loadCategories();
  }, [isFocused]);

  useEffect(() => {
    const unsub = syncManager.on("transactions_updated", async () => {
      loadCategories();
    });
    return unsub;
  }, []);

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push(`/expenses/categories/${item.id}`, { categoryId: item.id })
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: item.color || "#EEE",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 16 }}>{item.icon || "📁"}</Text>
      </View>

      <BodyText>{item.name}</BodyText>
    </TouchableOpacity>
  );

  const Section = ({ title, data }) => (
    <View style={{ marginBottom: 24 }}>
      {data.length === 0 ? (
        <Text style={{ color: "#888" }}>No categories</Text>
      ) : (
        data.map((item) => (
          <View key={item.id}>{renderCategory({ item })}</View>
        ))
      )}
    </View>
  );

  return (
    <>
      <ScrollView style={globalStyles.container}>
        <BodyText style={globalStyles.title}>My Expense Categories</BodyText>

        <Section title="Expenses" data={expenseCategories} />
      </ScrollView>
      <AddButton
        primaryAction={{
          route: `/expenses/categories/add`,
          label: "Add Category",
        }}
      />
    </>
  );
}
