
import React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function PremiumPlusUpgradeModal({
    open,
    onClose,
    onUpgrade,
}) {
    return (
        <Modal
            visible={open}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityLabel="Close upgrade dialog"
                />

                <View style={styles.modal}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.content}
                    >
                        <Pressable
                            onPress={onClose}
                            style={styles.closeButton}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            hitSlop={10}
                        >
                            <Text style={styles.closeText}>✕</Text>
                        </Pressable>

                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>🔄</Text>
                        </View>

                        <Text style={styles.title}>
                            Your business, on every device
                        </Text>

                        <Text style={styles.description}>
                            Use ZeniaBiz across your devices and keep your
                            business records in sync, whether you&apos;re using
                            your phone or computer.
                        </Text>

                        <View style={styles.featureList}>
                            <Feature
                                title="Sync across devices"
                                description="Access your business records on supported devices."
                            />

                            <Feature
                                title="One shared business"
                                description="Keep your company records consistent across connected devices."
                            />

                            <Feature
                                title="Team access"
                                description="Work with invited team members where team access is enabled."
                            />
                        </View>

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
                            without Premium Plus.
                        </Text>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function Feature({ title, description }) {
    return (
        <View style={styles.feature}>
            <View style={styles.checkCircle}>
                <Text style={styles.check}>✓</Text>
            </View>

            <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDescription}>
                    {description}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modal: {
        width: "100%",
        maxWidth: 440,
        maxHeight: "90%",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
    },
    content: {
        alignItems: "center",
        padding: 22,
        paddingTop: 28,
    },
    closeButton: {
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F5F5F5",
        alignItems: "center",
        justifyContent: "center",
    },
    closeText: {
        color: "#555555",
        fontSize: 16,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: "#E8F5F4",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    icon: {
        fontSize: 30,
    },
    title: {
        color: "#333333",
        fontSize: 21,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 10,
    },
    description: {
        color: "#666666",
        fontSize: 14,
        lineHeight: 21,
        textAlign: "center",
        marginBottom: 20,
    },
    featureList: {
        width: "100%",
        backgroundColor: "#FAF9F7",
        borderWidth: 1,
        borderColor: "#EEEEEE",
        borderRadius: 12,
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
        color: "#333333",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 4,
    },
    featureDescription: {
        color: "#777777",
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
