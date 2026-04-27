import NetInfo from "@react-native-community/netinfo";
import { runSync } from "./worker";

let isSyncing = false;

export async function triggerSync(db) {
    if (isSyncing) return;

    const state = await NetInfo.fetch();

    if (!state.isConnected) return;

    try {
        isSyncing = true;
        await runSync(db);
    } finally {
        isSyncing = false;
    }
}