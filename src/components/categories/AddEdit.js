import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSQLiteContext } from "expo-sqlite";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { BodyText, FormLabel, Input , Card } from "../ThemeProvider/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCategoryById, upsertCategory } from "../../db/query/categories";
import { COLORS } from "../../../utils/constants";
import { setRecentlyCreatedCategoryId } from "../../store/features/entitySelectionSlice"

export default function AddEdit() {
    const dispatch = useDispatch()
    const router = useRouter()
    const {globalStyles} = useThemeStyles()
    const db = useSQLiteContext();
    const {id:categoryUuid} = useLocalSearchParams()
    const initialForm = {
        name: "",
        color: COLORS[1],
        icon: "",
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
            const category = await getCategoryById(db, categoryUuid);

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
            let cateId = await upsertCategory(db, {
                id: form.id,
                name: form.name,
                color: form.color,
                icon: form.icon,
            });

            dispatch(setRecentlyCreatedCategoryId(cateId))

            router.back();
        } catch (error) {
            console.log(error, "category error");
        }
    };

    return (
        <KeyboardAwareScrollView
            style={globalStyles.container}
            contentContainerStyle={{ paddingBottom: 40 }}
            enableOnAndroid
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
        >

            <BodyText style={globalStyles.title}>
                {categoryUuid ? "Edit Category" : "Add Category"}
            </BodyText>

            <Card>
                <View style={globalStyles.formGroup}>
                <FormLabel >Name</FormLabel>
                <Input
                    value={form.name}
                    onChangeText={(value) => handleFormChange("name",value)}
                    placeholder="e.g. Rent"
                />
            </View>


            <View style={globalStyles.formGroup}>
                <FormLabel >Icon</FormLabel>
                <Input
                    value={form.icon}
                    onChangeText={(text) => {
                    handleFormChange("icon",text.slice(0, 2))
                    }}
                    placeholder="e.g. 🏠"
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
        </KeyboardAwareScrollView>
    );
}
