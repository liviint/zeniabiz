import { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useIsFocused} from "@react-navigation/native";
import { useRouter } from "expo-router";
import { BodyText, SecondaryText , Card} from "../ThemeProvider/components";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { useSQLiteContext } from "expo-sqlite";
import { useSelector } from "react-redux";
import { getBusinessProgress } from "../../db/query/dashboard";
import { useDeferredEffect } from "../../hooks/useDeferredEffect";
import { getSetting, setSetting } from "../../db/query/settings"

export default function OnBoarding() {
    const router = useRouter();
    const db = useSQLiteContext();
    const isFocused = useIsFocused();
    const {  colors } = useThemeStyles();
    const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);
    const [showWelcome, setShowWelcome] = useState(true);
    const [onboardingCompleted,setOnboardingComleted] = useState(false)
    const [isLoading,setIsLoading] = useState(true)

    const [progress, setProgress] = useState({
        hasProducts: false,
        hasSales: false,
        hasExpenses: false,
    });

    const steps = [
        {
            title: "Add your first product",
            completed: progress.hasProducts,
            action: () => router.push("/inventory"),
        },
        {
            title: "Record your first sale",
            completed: progress.hasSales,
            action: () => router.push("/sales"),
        },
    ];

    const nextStep = steps.find(step => !step.completed);

    useDeferredEffect(async (isMounted) => {
        const [userWelcomed,onboardingCompleted, progress] = await Promise.all([
            getSetting(db, "welcome_message_dismissed"),
            getSetting(db, "onboarding_completed"),
            getBusinessProgress(db),
        ]);

        if (!isMounted()) return;

        setProgress(progress);

        setShowWelcome(userWelcomed);
        setOnboardingComleted(onboardingCompleted)
        setIsLoading(false)
    }, [db, isFocused, lastSyncedAt], {
        enabled: isFocused,
    });

    useDeferredEffect(async () => {
        if (nextStep || onboardingCompleted) return;

        setOnboardingComleted(true);

        try {
            await setSetting(db, "onboarding_completed", "1");
        } catch (error) {
            console.error(error);
        }
    }, [nextStep, onboardingCompleted]);

    const handleWelcomeMessageClosing = async() => {
        setShowWelcome(false)

        try {
            await setSetting(db, "welcome_message_dismissed", "1");
        } catch (error) {
            console.error("Failed to save onboarding state:", error);
        }
    }

    if (!nextStep || onboardingCompleted || isLoading) {
        return null;
    }

    return (
        <>
        {showWelcome && (
            <Card style={styles.welcomeCard}>
                <Pressable
                    style={({ pressed }) => [
                        styles.closeButton,
                        pressed && { opacity: 0.6 },
                    ]}
                    hitSlop={56}
                    onPress={handleWelcomeMessageClosing}
                >
                    <MaterialIcons
                        name="close"
                        size={20}
                        color={colors.secondary}
                    />
                </Pressable>

                <BodyText style={styles.welcomeTitle}>
                    👋 Welcome to ZeniaBiz
                </BodyText>

                <SecondaryText style={styles.welcomeText}>
                    We&apos;ll guide you through a quick setup so your dashboard can start showing meaningful insights.
                </SecondaryText>
            </Card>
        )}

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
        </>
    );
}

const styles = StyleSheet.create({
    welcomeCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 8,
    position: "relative",
},

welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
},

welcomeText: {
    lineHeight: 22,
    paddingRight: 24,
},

closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 20,

    alignItems: "center",
    justifyContent: "center",
},
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