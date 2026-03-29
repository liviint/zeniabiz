import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet} from "react-native";
import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {getCategories, deleteCategory} from "../../../../src/db/categoriesDb"
import { useSQLiteContext } from "expo-sqlite";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import { BodyText, SecondaryText } from "../../../../src/components/ThemeProvider/components";
import { dateFormat } from "../../../../utils/dateFormat";
import DeleteButton from "../../../../src/components/common/DeleteButton";

export default function CategoryDetailsScreen() {
    const db = useSQLiteContext();
    const isFocused = useIsFocused()
    const {globalStyles}  = useThemeStyles()
    const { id:uuid } = useLocalSearchParams();
    const router = useRouter();

    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadCategory = async () => {
        try {
        const data = await getCategories(db,uuid);
        setCategory(data);
        } catch (err) {
        console.log("Failed to load category", err);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        loadCategory();
    }, [isFocused]);

    const handleDelete = async () => {
        try {
        await deleteCategory(db,uuid);
        router.back();
        } catch (err) {
        console.log("Delete failed", err);
        }
    };

    if (loading) {
        return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator />
        </View>
        );
    }

    if (!category) {
        return (
        <View style={{ padding: 20 }}>
            <Text>Category not found.</Text>
        </View>
        );
    }

    return (
        <View style={globalStyles.container}>
        <View>
            <View
                style={{...styles.icon, backgroundColor: category.color || "#EEE",}}
            >
                <Text style={{ fontSize: 30 }}>{category.icon || "📁"}</Text>
            </View>

            <BodyText style={{ fontSize: 24, fontWeight: "600", marginBottom: 12 }}>
                {category.name}
            </BodyText>

            <Info label="Type" value={category.type} />
            <Info label="Spending Type" value={category.spendingType} />
            <Info label="Created" value={dateFormat(category.created_at)} />
            <Info label="Updated" value={dateFormat(category.updated_at)} />

        </View>

        
        <View style={{ gap: 12 }}>
            
            <TouchableOpacity
                onPress={() => router.push(`/categories/${uuid}/edit`)}
                style={globalStyles.editBtn}
            >
            <Text style={globalStyles.editBtnText}>
                Edit
            </Text>
            </TouchableOpacity>

            <DeleteButton 
                handleOk={handleDelete}
                item={"category"}
            />
        </View>
        </View>
    );
}

const Info = ({ label, value }) => (
    <View style={{ marginBottom: 12 }}>
        <SecondaryText style={{ fontSize: 12, opacity: 0.6 }}>{label}</SecondaryText>
        <BodyText style={{ fontSize: 16 }}>{value || "-"}</BodyText>
    </View>
);

const styles = StyleSheet.create({
    icon:{
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,   
    }
})