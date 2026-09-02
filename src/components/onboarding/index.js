import { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useIsFocused } from "expo-router";
import { BodyText, SecondaryText , Card} from "../ThemeProvider/components";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { useSQLiteContext } from "expo-sqlite";
import { useSelector } from "react-redux";
import { getBusinessProgress } from "../../db/query/dashboard";
import { useDeferredEffect } from "../../hooks/useDeferredEffect";
import { getSetting, setSetting } from "../../db/query/settings"
import { AnalyticsService } from "../../utils/analyticsService";

export default function OnBoarding() {
    const router = useRouter();
    const db = useSQLiteContext();
    const isFocused = useIsFocused();
    const {  colors } = useThemeStyles();
    const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);
    const [showWelcome, setShowWelcome] = useState(true);
    const [onboardingCompleted,setOnboardingCompleted] = useState(false)
    const [showCompletion, setShowCompletion] = useState(false);
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
        const [
            userWelcomed,
            onboardingCompleted,
            completionAcknowledged,
            progress,
        ] = await Promise.all([
            getSetting(db, "welcome_message_dismissed"),
            getSetting(db, "onboarding_completed"),
            getSetting(db, "onboarding_completion_acknowledged"),
            getBusinessProgress(db),
        ]);

        if (!isMounted()) return;

        setProgress(progress);
        setShowWelcome(!userWelcomed);

        const completed = Boolean(onboardingCompleted)
        setOnboardingCompleted(completed);
        setShowCompletion(completed && !completionAcknowledged);

        setIsLoading(false);
    }, [db, isFocused, lastSyncedAt], {
        enabled: isFocused,
    });

    useDeferredEffect(async () => {
        if (isLoading || onboardingCompleted) return;

        await AnalyticsService.logFirstEvent("onboarding_started");
    }, [isLoading, onboardingCompleted]);


    useDeferredEffect(async () => {
        if (nextStep || onboardingCompleted) return;
        setOnboardingCompleted(true);
        setShowCompletion(true)

        try {
            await setSetting(db, "onboarding_completed", "1");
            await AnalyticsService.logFirstEvent("onboarding_completed");
        } catch (error) {
            console.error(error);
        }
    }, [nextStep, onboardingCompleted]);

    const handleWelcomeMessageClosing = async () => {
        setShowWelcome(false);

        await AnalyticsService.logFirstEvent("welcome_message_dismissed");

        await setSetting(db, "welcome_message_dismissed", "1");
    };

    const handleOboardingCompleted = async() => {
        setShowCompletion(false);
        await setSetting(db,"onboarding_completion_acknowledged","1");  
        await AnalyticsService.logFirstEvent("onboarding_completion_acknowledged");       
    }

    if (isLoading) {
        return null;
    }

    if (showCompletion) {
        return (
            <Card style={styles.card}>
                <MaterialIcons
                    name="emoji-events"
                    size={48}
                    color="#FBBF24"
                    style={{ alignSelf: "center", marginBottom: 12 }}
                />

                <BodyText
                    style={[
                        styles.title,
                        { textAlign: "center" }
                    ]}
                >
                    🎉 You&apos;re all set!
                </BodyText>

                <SecondaryText
                    style={[
                        styles.subtitle,
                        { textAlign: "center", marginTop: 8 }
                    ]}
                >
                    Great job! You&apos;re ready to start tracking your business. Your dashboard will become more valuable as you record sales and expenses.
                </SecondaryText>

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: colors.primary }
                    ]}
                    onPress={handleOboardingCompleted}
                >
                    <BodyText style={{ color: "#FFF", fontWeight: "600" }}>
                        View Dashboard
                    </BodyText>
                </TouchableOpacity>
            </Card>
        );
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
                    Complete a couple of quick steps to start tracking your sales and understand how your business is performing.
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
                Complete these steps to start tracking your business performance.
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