import { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation , useIsFocused} from "@react-navigation/native";
import { BodyText, SecondaryText , Card} from "../ThemeProvider/components";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { useSQLiteContext } from "expo-sqlite";
import { useSelector } from "react-redux";
import { getBusinessProgress } from "../../db/query/dashboard";
import { useDeferredEffect } from "../../hooks/useDeferredEffect";

export default function OnBoarding() {
    const navigation = useNavigation();
    const db = useSQLiteContext();
    const isFocused = useIsFocused();
    const {  colors } = useThemeStyles();
    const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);

    const [progress, setProgress] = useState({
        hasProducts: false,
        hasSales: false,
        hasExpenses: false,
    });

    useDeferredEffect(async (isMounted) => {
        const result = await getBusinessProgress(db);

        if (isMounted()) {
            setProgress(result);
        }
    }, [db, isFocused, lastSyncedAt], {
        enabled: isFocused,
    });

    const steps = [
        {
            title: "Add your first product",
            completed: progress.hasProducts,
            action: () => navigation.navigate("Products"),
        },
        {
            title: "Record your first sale",
            completed: progress.hasSales,
            action: () => navigation.navigate("Sales"),
        },
    ];

    const nextStep = steps.find(step => !step.completed);

    // Hide onboarding once everything is complete
    if (!nextStep) {
        return null;
    }

    return (
        <Card
            style={[
                styles.card,]}
        >
            <BodyText style={styles.title}>
                🎉 Let&apos;s set up your business
            </BodyText>

            <SecondaryText style={styles.subtitle}>
                Complete these steps to unlock your dashboard.
            </SecondaryText>

            <View style={{ marginTop: 16 }}>
                {steps.map(step => (
                    <View key={step.title} style={styles.row}>
                        <MaterialIcons
                            name={
                                step.completed
                                    ? "check-circle"
                                    : "radio-button-unchecked"
                            }
                            size={22}
                            color={
                                step.completed
                                    ? "#22C55E"
                                    : colors.secondary
                            }
                        />

                        <BodyText
                            style={{
                                marginLeft: 12,
                                flex: 1,
                                opacity: step.completed ? 0.7 : 1,
                            }}
                        >
                            {step.title}
                        </BodyText>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={[
                    styles.button,
                    { backgroundColor: colors.primary },
                ]}
                onPress={nextStep.action}
            >
                <BodyText style={{ color: "#FFF", fontWeight: "600" }}>
                    {nextStep.title}
                </BodyText>
            </TouchableOpacity>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginVertical: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
    },
    subtitle: {
        marginTop: 4,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    button: {
        marginTop: 12,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
});