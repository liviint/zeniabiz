import {  useState , useEffect} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { SecondaryText , BodyText} from "../../../src/components/ThemeProvider/components";
import { syncManager } from "../../../utils/syncManager";
import { AddButton } from "../../../src/components/common/AddButton";
import { getCategories } from "../../../src/db/categoriesDb";

export default function CategoriesListScreen({ navigation }) {
  const db = useSQLiteContext();
  const router = useRouter()
  const {globalStyles} = useThemeStyles()
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const isFocused = useIsFocused()

  const loadCategories = async () => {
    const categories = await getCategories(db)
    const income =  categories.filter(cate => cate.type === "income")
    const expense = categories.filter(cate => cate.type !== "income")
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
      onPress={() => router.push(`/categories/${item.uuid}`, { categoryId: item.id })}
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

      <BodyText >{item.name}</BodyText>
    </TouchableOpacity>
  );

  const Section = ({ title, data }) => (
    <View style={{ marginBottom: 24 }}>
      <SecondaryText
        style={{...globalStyles.subTitle,textAlign:'left'}}
      >
        {title}
      </SecondaryText>

      {data.length === 0 ? (
        <Text style={{ color: "#888" }}>No categories</Text>
        ) : (
        data.map((item) => (
        <View key={item.uuid}>{renderCategory({ item })}</View>
        ))
      )}
    </View>
  );

  return (
    <>
      <ScrollView style={globalStyles.container}>

        <BodyText style={globalStyles.title}>
          My Categories
        </BodyText>

        <Section title="Income" data={incomeCategories} />
        <Section title="Expenses" data={expenseCategories} />

      </ScrollView>
      <AddButton 
          primaryAction={{route:`/categories/add`,label:"Add Category"}}
        />
    </>
  );
}
