import { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { Picker } from "@react-native-picker/picker";
import { BodyText, FormLabel, Input , Card, CustomPicker} from "../ThemeProvider/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCategories, upsertCategory } from "../../db/transactionsDb";
import uuid from 'react-native-uuid';
import { COLORS } from "../../../utils/constants";

export default function AddEdit() {
  const router = useRouter()
  const {globalStyles} = useThemeStyles()
  const db = useSQLiteContext();
  const {id:categoryUuid} = useLocalSearchParams()
  let initialForm = {
    name:"",
    type:"expense",
    color:COLORS[1],
    icon:"🛒",
    uuid:"",
    spendingType:"neutral",
  }
  const [form,setForm] = useState(initialForm)

  const handleFormChange = (key,value) => {
    setForm(prev => ({
        ...prev,
        [key]:value
    }))
  }
  

  useEffect(() => {
    if (!categoryUuid) return;
    let fetchCategory = async() => {
        let category = await getCategories(db,categoryUuid)
        setForm(category)
    }
    fetchCategory()
  }, [categoryUuid]);

  const saveCategory = async () => {
    if (!form.name.trim()) {
      Alert.alert("Validation", "Category name is required");
      return;
    }
    try {
      const cateUuid = form.uuid || uuid.v4();
      await upsertCategory(db,{...form,uuid:cateUuid})
      router.back();
      setForm(initialForm)
    } catch (error) {
      console.log(error,"hello error")
    }
  };

  return (
    <ScrollView style={globalStyles.container}>

        <BodyText style={globalStyles.title}>
            {categoryUuid ? "Edit Category" : "Add Category"}
        </BodyText>

        <Card>
            <View style={globalStyles.formGroup}>
            <FormLabel >Name</FormLabel>
            <Input
                value={form.name}
                onChangeText={(value) => handleFormChange("name",value)}
                placeholder="e.g. Food"
            />
        </View>

        <View style={globalStyles.formGroup}>
        <>
            <FormLabel>Type</FormLabel>
            <View style={{ flexDirection: "row", marginBottom: 16 }}>
                {["expense", "income"].map((t) => (
                    <TouchableOpacity
                        key={t}
                        onPress={() => handleFormChange("type",t)}
                        disabled={!!categoryUuid}
                        style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 10,
                        backgroundColor:
                            form.type === t ? "#2E8B8B" : "#EEE",
                        marginRight: t === "expense" ? 8 : 0,
                        }}
                    >
                        <Text
                            style={{
                                textAlign: "center",
                                color: form.type === t ? "#FFF" : "#333",
                                fontWeight: "600",
                            }}
                        >
                        {t === "expense" ? "expense" : "income"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </>
        </View>

        <View style={globalStyles.formGroup}>
            <FormLabel>Spending Type (Optional)</FormLabel>
            <CustomPicker
                selectedValue={form.spendingType || ""}
                onValueChange={(v) => handleFormChange("spendingType", v)}
            >
                <Picker.Item label="Neutral" value="neutral" />
                <Picker.Item label="Needs" value="needs" />
                <Picker.Item label="Wants" value="wants" />
                <Picker.Item label="Savings" value="savings" />
            </CustomPicker>

        </View>

        <View style={globalStyles.formGroup}>
            <FormLabel >Icon</FormLabel>
            <Input
                value={form.icon}
                onChangeText={(text) => {
                handleFormChange("icon",text.slice(0, 2))
                }}
                placeholder="e.g. 🍔"
                maxLength={2}
            />
        </View>

        <View style={globalStyles.formGroup}>
            <FormLabel >Color</FormLabel>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {COLORS.map((c) => {
                const isSelected = form.color === c;

                return (
                    <TouchableOpacity
                        key={c}
                        onPress={() => handleFormChange("color",c)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: c,
                            margin: 8,
                            borderWidth: isSelected ? 3 : 1,
                            borderColor: isSelected ? "#333" : "#DDD",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                    {isSelected && (
                        <Text style={{ color: "#FFF", fontWeight: "700" }}>✓</Text>
                    )}
                    </TouchableOpacity>
                );
                })}
            </View>
        </View>

        <TouchableOpacity
            onPress={saveCategory}
            style={globalStyles.primaryBtn}
        >
            <Text style={globalStyles.primaryBtnText}>
                {categoryUuid ? "Update Category": "Save Category"}
            </Text>
        </TouchableOpacity>
        </Card>
    </ScrollView>
  );
}
