import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import {
    StyleSheet, 
    Text, 
    ScrollView,
} from "react-native";
import { 
    BodyText ,
    Card,
    SecondaryText
} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { getSetting } from "../../../src/db/query/settings";
import { useSQLiteContext } from "expo-sqlite";
import { useIsFocused } from "@react-navigation/native";
import BackupStatusCard from "../../../src/components/data-backup/BackupStatusCard";
import { getActiveContextSync } from "../../../src/db/utils";

export default function DataBackupScreen() {
    const db = useSQLiteContext();
    const { globalStyles } = useThemeStyles();
    const router = useRouter();
    const isFocused = useIsFocused();

    const lastSyncedAt = useSelector((state) => state.sync.lastSyncedAt);
    let { is_authenticated , email} = getActiveContextSync(db)

    const [lastBackup, setLastBackup] = useState(null);
    const [googleDriveEmail, setGoogleDriveEmail] = useState("");

    const loadSettings = async () => {
        const last = await getSetting(db, "last_backup_date");
        let email = await getSetting(db, "gdrive_email")
        console.log(email,last,"hello backups 123")
        setGoogleDriveEmail(email)
        if (last) {
            setLastBackup(new Date(last));
        }
    };

    const loadAccountDetails = async () => {
        
    };

    useEffect(() => {
        loadSettings()
    },[isFocused])

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

            {googleDriveEmail ? 
                <BackupStatusCard
                    title="Google Drive Backup"
                    icon="☁️"
                    connected={googleDriveEmail !== ""}
                    account={googleDriveEmail}
                    lastBackup={lastBackup}
                    onPress={() => router.push("/google-drive")}
                />
                :
                <BackupStatusCard
                    title="Google Drive Backup"
                    icon="☁️"
                    connected={false}
                    account={googleDriveEmail}
                    lastBackup={lastBackup}
                    onPress={() => router.push("/google-drive")}
                    description="Back up your business to your personal Google Drive. Ideal if you use one phone."
                />
            }

            <BackupStatusCard
                    title="ZeniaBiz Account"
                    icon="🔄"
                    connected={is_authenticated}
                    account={email}
                    lastBackup={lastSyncedAt}
                    onPress={() => router.push("/auth/profile")}
                    description="Create a ZeniaBiz account to sync your business across multiple devices."
                    recommendation="✓ Best for multiple devices"
                />


            {/* Information */}
            <Card style={styles.infoCard}>
                <SecondaryText style={styles.infoTitle}>
                    Which option should I choose?
                </SecondaryText>

                <SecondaryText style={styles.infoText}>
                    <Text style={styles.bold}>Google Drive Backup</Text> is best
                    if you use only one phone and want to restore your data if
                    you change devices.
                </SecondaryText>

                <SecondaryText style={[styles.infoText, { marginTop: 10 }]}>
                    <Text style={styles.bold}>Cloud Sync</Text> is recommended
                    if you use multiple phones, tablets or want automatic
                    synchronization.
                </SecondaryText>
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