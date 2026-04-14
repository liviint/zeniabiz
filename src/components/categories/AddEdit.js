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
import { BodyText, FormLabel, Input , Card } from "../ThemeProvider/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCategories, upsertCategory } from "../../db/categoriesDb";
import { COLORS } from "../../../utils/constants";

export default function AddEdit() {
    const router = useRouter()
    const {globalStyles} = useThemeStyles()
    const db = useSQLiteContext();
    const {id:categoryUuid} = useLocalSearchParams()
    const initialForm = {
        name: "",
        color: COLORS[1],
        icon: "🛒",
        id: "",
    };
    const [form,setForm] = useState(initialForm)

    const handleFormChange = (key,value) => {
        setForm(prev => ({
            ...prev,
            [key]:value
        }))
    }

    useEffect(() => {
        if (!categoryUuid) return;

        const fetchCategory = async () => {
            const category = await getCategories(db, categoryUuid);

            if (category) {
                setForm((prev) => ({
                    ...prev,
                    ...category,
                }));
            }
        };

        fetchCategory();
    }, [categoryUuid]);

    const saveCategory = async () => {
        if (!form.name?.trim()) {
            Alert.alert("Validation", "Category name is required");
            return;
        }

        try {
            await upsertCategory(db, {
            id: form.id,
            name: form.name,
            color: form.color,
            icon: form.icon,
            });
            setForm(initialForm)
            router.back();
        } catch (error) {
            console.log(error, "category error");
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
