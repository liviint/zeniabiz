import { View, StyleSheet } from "react-native";
import { Card, BodyText, SecondaryText } from "../ThemeProvider/components";

export default function EmptyState({
    title = "Nothing here yet",
    description = "Get started by adding your first item.",
}) {
    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <BodyText style={styles.title}>{title}</BodyText>
                <SecondaryText style={styles.description}>
                {description}
                </SecondaryText>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 16,
        alignItems:"center",
    },
    card: {
        padding: 24,
        alignItems: "center",
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 6,
        textAlign: "center",
    },
    description: {
        fontSize: 13,
        textAlign: "center",
        marginBottom: 16,
    },
});

