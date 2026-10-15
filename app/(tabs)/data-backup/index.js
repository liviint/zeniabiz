
import { useIsFocused, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
} from "react-native";
import { useSelector } from "react-redux";

import BackupStatusCard from "../../../src/components/data-backup/BackupStatusCard";
import PremiumPlusUpgradeModal from "../../../src/components/subscriptions/PremiumPlusUpgradeModal";
import PremiumUpgradeModal from "../../../src/components/subscriptions/PremiumUpgradeModal.j";

import {
    BodyText,
    Card,
    SecondaryText,
} from "../../../src/components/ThemeProvider/components";

import { getSetting } from "../../../src/db/query/settings";
import { getActiveContextSync } from "../../../src/db/utils";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { useSubscription } from "../../../src/components/AppDataProvider/PremiumSubscriptionsProvider";

export default function DataBackupScreen() {
    const db = useSQLiteContext();

    const {
        hasPremium,
        hasPremiumPlus
    } = useSubscription();

    const { globalStyles } = useThemeStyles();
    const router = useRouter();
    const isFocused = useIsFocused();

    const lastSyncedAt = useSelector(
        (state) => state.sync.lastSyncedAt
    );

    const [lastBackup, setLastBackup] = useState(null);
    const [googleDriveEmail, setGoogleDriveEmail] = useState("");

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showPremiumPlusModal, setShowPremiumPlusModal] = useState(false);

    const loadSettings = async () => {
        try {
            const last = await getSetting(db, "last_backup_date");
            const driveEmail = await getSetting(db, "gdrive_email");

            setGoogleDriveEmail(driveEmail || "");
            setLastBackup(last ? new Date(last) : null);
        } catch (error) {
            console.error("Failed to load backup settings:", error);
        }
    };

    const loadAccountDetails = async () => {
        try {
            const account = getActiveContextSync(db);

            setIsAuthenticated(Boolean(account?.is_authenticated));
            setUserEmail(account?.email || "");
        } catch (error) {
            console.error("Failed to load account details:", error);
        }
    };

    useEffect(() => {
        if (!isFocused) return;

        loadSettings();
        loadAccountDetails();
    }, [isFocused, db]);

    const handleGoogleDrivePress = () => {
        if (!hasPremium) {
            setShowPremiumModal(true);
            return;
        }

        router.push("/google-drive");
    };

    const handleAccountPress = () => {

        if (!hasPremiumPlus) {
            setShowPremiumPlusModal(true);
            return;
        }

        router.push("/auth/profile");
    };

    const handlePremiumUpgrade = () => {
        setShowPremiumModal(false);
        router.push("/subscriptions"); 
    };

    const handlePremiumPlusUpgrade = () => {
        setShowPremiumPlusModal(false);
        router.push("/subscriptions"); 
    };

    return (
        <>
            <ScrollView style={globalStyles.container}>
                <BodyText style={globalStyles.title}>
                    Data Backup & Sync
                </BodyText>

                <BodyText style={styles.description}>
                    Protect your business data by backing it up or syncing it
                    across devices.
                </BodyText>

                <BackupStatusCard
                    title="Google Drive Backup"
                    icon="☁️"
                    connected={googleDriveEmail}
                    account={googleDriveEmail}
                    lastBackup={lastBackup}
                    onPress={handleGoogleDrivePress}
                    description="Back up your business to your personal Google Drive. Ideal if you use one phone."
                    recommendation="✓ Best for single-device businesses"
                />

                <BackupStatusCard
                    title="ZeniaBiz Account"
                    icon="🔄"
                    connected={isAuthenticated}
                    account={userEmail}
                    lastBackup={lastSyncedAt}
                    onPress={handleAccountPress}
                    description="Create a ZeniaBiz account to sync your business across multiple devices."
                    recommendation="✓ Best for multiple devices"
                />

                <Card style={styles.infoCard}>
                    <SecondaryText style={styles.infoTitle}>
                        Which option should I choose?
                    </SecondaryText>

                    <SecondaryText style={styles.infoText}>
                        <Text style={styles.bold}>Google Drive Backup</Text>
                        {" "}is ideal if you use one phone and want to back up
                        or restore your business data.
                    </SecondaryText>

                    <SecondaryText
                        style={[styles.infoText, { marginTop: 10 }]}
                    >
                        <Text style={styles.bold}>Cloud Sync</Text>
                        {" "}is ideal if you use multiple devices and need
                        your business records synchronized.
                    </SecondaryText>
                </Card>
            </ScrollView>

            <PremiumUpgradeModal
                open={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                onUpgrade={handlePremiumUpgrade}
            />

            <PremiumPlusUpgradeModal
                open={showPremiumPlusModal}
                onClose={() => setShowPremiumPlusModal(false)}
                onUpgrade={handlePremiumPlusUpgrade}
            />
        </>
    );
}

const styles = StyleSheet.create({
    description: {
        marginTop: 6,
        marginBottom: 20,
        color: "#666",
        lineHeight: 22,
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
