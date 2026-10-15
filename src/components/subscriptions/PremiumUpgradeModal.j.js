
import React from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import AddEditModal from "../common/addEditModal";
import { BodyText, SecondaryText, Card } from "../ThemeProvider/components";

export default function PremiumUpgradeModal({
    open,
    onClose,
    onUpgrade,
}) {
    return (
        <AddEditModal
            visible={open}
            onClose={onClose}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>☁️</Text>
                </View>

                <BodyText style={styles.title}>
                    Protect your business records
                </BodyText>

                <SecondaryText style={styles.description}>
                    Your business records matter. Keep them safe
                    with Google Drive backup and restore them when
                    you need them.
                </SecondaryText>

                <Card style={styles.featureList}>
                    <Feature
                        title="Google Drive backup"
                        description="Keep a backup of your business data."
                    />

                    <Feature
                        title="Restore your records"
                        description="Recover your data when changing devices or reinstalling the app."
                    />

                    <Feature
                        title="Advanced business reports"
                        description="Understand your performance and profits in greater detail."
                    />
                </Card>

                <Pressable
                    onPress={onUpgrade}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && styles.buttonPressed,
                    ]}
                >
                    <Text style={styles.primaryButtonText}>
                        Explore Premium Plans
                    </Text>
                </Pressable>

                <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    style={styles.secondaryButton}
                >
                    <Text style={styles.secondaryButtonText}>
                        Maybe later
                    </Text>
                </Pressable>

                <Text style={styles.footnote}>
                    Your existing business records remain accessible
                    without Premium.
                </Text>
            </ScrollView>
        </AddEditModal>
    );
}

function Feature({ title, description }) {
    return (
        <View style={styles.feature}>
            <View style={styles.checkCircle}>
                <Text style={styles.check}>✓</Text>
            </View>

            <View style={styles.featureText}>
                <BodyText style={styles.featureTitle}>{title}</BodyText>

                <SecondaryText style={styles.featureDescription}>
                    {description}
                </SecondaryText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        alignItems: "center",
        padding: 22,
        paddingTop: 28,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: "#FFF0ED",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    icon: {
        fontSize: 30,
    },
    title: {
        fontSize: 21,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        lineHeight: 21,
        textAlign: "center",
        marginBottom: 20,
    },
    featureList: {
        width: "100%",
        padding: 15,
        gap: 17,
        marginBottom: 20,
    },
    feature: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 11,
    },
    checkCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "#E3F3EE",
        alignItems: "center",
        justifyContent: "center",
    },
    check: {
        color: "#238267",
        fontSize: 13,
        fontWeight: "700",
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 12,
        lineHeight: 18,
    },
    primaryButton: {
        width: "100%",
        minHeight: 48,
        backgroundColor: "#FF6B6B",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    buttonPressed: {
        opacity: 0.85,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
    secondaryButton: {
        width: "100%",
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 5,
    },
    secondaryButtonText: {
        color: "#666666",
        fontSize: 14,
        fontWeight: "600",
    },
    footnote: {
        color: "#888888",
        fontSize: 11,
        lineHeight: 17,
        textAlign: "center",
        marginTop: 4,
    },
});
