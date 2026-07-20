import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { BodyText, SecondaryText } from "../ThemeProvider/components";
import { useThemeStyles } from "../../hooks/useThemeStyles";

export default function AddProduct() {
    const router = useRouter();
    const { globalStyles } = useThemeStyles();

    return (
        <View
            style={globalStyles.container}
        >
            <BodyText style={styles.title}>
                👋 Welcome to ZeniaBiz
            </BodyText>

            <SecondaryText style={styles.description}>
                You&apos;re just a few taps away from tracking your business.
                Start by adding your first product or service.
            </SecondaryText>

            <TouchableOpacity
                style={globalStyles.primaryBtn}
                onPress={() => router.push("/inventory")}
            >
                <BodyText style={globalStyles.primaryBtnText}>Add Product</BodyText>
            </TouchableOpacity>
            
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
    },
    title: {
        marginBottom: 12,
    },
    description: {
        lineHeight: 22,
        marginBottom: 24,
    },
});