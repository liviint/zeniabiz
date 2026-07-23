import Constants from "expo-constants";
import { setSetting, getSetting } from "../db/query/settings";

export async function versionUpdates(db) {
    const currentVersion = Constants.expoConfig?.version;

    const previousVersion =
        (await getSetting(db, "app_version"))
    if (!previousVersion) {
        await setSetting(db, "app_version", currentVersion);
        return;
    }

    if (previousVersion !== currentVersion) {
        await Promise.all([
            setSetting(db, "app_version", currentVersion),
            setSetting(db, "onboarding_completed", "1"),
            setSetting(db, "onboarding_completion_acknowledged", "1"),
            setSetting(db, "welcome_message_dismissed", "1"),
        ]);
    }
}