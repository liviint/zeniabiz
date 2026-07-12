import { useRouter } from "expo-router";
import {
    StyleSheet, 
    Text, 
    View,
    ScrollView,
    Pressable,
} from "react-native";
import { 
    BodyText ,
    Card,
} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";

export default function DataBackupScreen() {
    const { globalStyles } = useThemeStyles();
    const router = useRouter();

    return (
        <ScrollView style={globalStyles.container}>
            <BodyText style={globalStyles.title}>
                Data Backup & Sync
            </BodyText>

            <BodyText style={styles.description}>
                Protect your business data by backing it up or syncing it across
                devices.
            </BodyText>

            {/* Google Drive */}
            <Card>
                <Pressable
                    style={styles.card}
                    onPress={() => router.push("/google-drive")}
                >
                    <View style={styles.iconContainer}>
                    <BodyText style={styles.icon}>☁️</BodyText>
                </View>

                <View style={styles.content}>
                    <BodyText style={styles.title}>
                        Google Drive Backup
                    </BodyText>

                    <BodyText style={styles.subtitle}>
                        Back up your business data to your personal Google Drive.
                        Ideal if you only use one phone.
                    </BodyText>

                    <Text style={styles.recommendation}>
                        ✓ No account required
                    </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
                </Pressable>
            </Card>
            <Card>
                <Pressable 
                    style={styles.card}
                    onPress={() => router.push("/auth/profile")}
                >
                    <View style={styles.iconContainer}>
                        <BodyText style={styles.icon}>🔄</BodyText>
                    </View>
                    <View style={styles.content}>
                        <BodyText style={styles.title}>
                            ZeniaBiz Account
                        </BodyText>

                        <BodyText style={styles.subtitle}>
                            Create a ZeniaBiz account to sync your business across
                            multiple devices.
                        </BodyText>

                        <Text style={styles.recommendation}>
                            ✓ Best for multiple devices
                        </Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                </Pressable>
            </Card>


            {/* Information */}
            <Card style={styles.infoCard}>
                <BodyText style={styles.infoTitle}>
                    Which option should I choose?
                </BodyText>

                <BodyText style={styles.infoText}>
                    <Text style={styles.bold}>Google Drive Backup</Text> is best
                    if you use only one phone and want to restore your data if
                    you change devices.
                </BodyText>

                <BodyText style={[styles.infoText, { marginTop: 10 }]}>
                    <Text style={styles.bold}>Cloud Sync</Text> is recommended
                    if you use multiple phones, tablets or want automatic
                    synchronization.
                </BodyText>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    description: {
        marginTop: 6,
        marginBottom: 20,
        color: "#666",
        lineHeight: 22,
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
    },

    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#2E8B8B",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },

    icon: {
        fontSize: 22,
    },

    content: {
        flex: 1,
    },

    title: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 4,
    },

    subtitle: {
        fontSize: 13,
        lineHeight: 19,
    },

    recommendation: {
        marginTop: 8,
        color: "#2E8B8B",
        fontWeight: "600",
        fontSize: 13,
    },

    arrow: {
        fontSize: 22,
        color: "#999",
        marginLeft: 10,
    },

    infoCard: {
        borderRadius: 14,
        padding: 16,
        marginTop: 10,
    },

    infoTitle: {
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 12,
    },

    infoText: {
        fontSize: 13,
        lineHeight: 20,
    },

    bold: {
        fontWeight: "700",
    },
});