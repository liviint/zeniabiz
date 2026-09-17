import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSQLiteContext } from "expo-sqlite";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import { scheduleSync } from "@/src/cloudSync/worker";
import {
    triggerSync,
    syncStarted,
    syncFinished,
    syncFailed,
} from "@/src/store/features/syncSlice";

export default function SyncProvider({ children }) {
    const db = useSQLiteContext();
    const [ready, setReady] = useState(false);

    const dispatch = useDispatch();

    const trigger = useSelector((state) => state.sync.trigger);
    const user = useSelector((state) => state.user.userDetails);
    const isSyncing = useSelector((state) => state.sync.isSyncing);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
        if (!user) {
            setReady(true);
            return;
        }

        // Don't start another sync while one is already running.
        if (isSyncing) {
            setReady(true);
            return;
        }

        const state = await NetInfo.fetch();

        if (!state.isConnected) {
            setReady(true);
            return;
        }

        dispatch(syncStarted());

        try {
            await scheduleSync(db, dispatch);

            if (!cancelled) {
            dispatch(syncFinished());
            }
        } catch (err) {
            console.error("Sync failed:", err);

            if (!cancelled) {
            dispatch(
                syncFailed(
                err?.message || "Failed to sync your data."
                )
            );
            }
        }

        setReady(true);
        };

        run();

        return () => {
        cancelled = true;
        };
    }, [trigger, user, db, dispatch]);

    useEffect(() => {
        let appStateSub;
        let netSub;
        let interval;

        try {
            appStateSub = AppState.addEventListener("change", (state) => {
                if (state === "active") {
                dispatch(triggerSync());
                }
            });

            // Sync when internet connection comes back
            netSub = NetInfo.addEventListener((state) => {
                if (state.isConnected) {
                dispatch(triggerSync());
                }
            });

            // Safety sync every 2 minutes
            interval = setInterval(() => {
                dispatch(triggerSync());
            }, 2 * 60 * 1000);

            setReady(true);
        } catch (err) {
            console.error("SyncProvider init error:", err);
            setReady(true);
        }

        return () => {
            appStateSub?.remove?.();
            netSub?.();
            clearInterval(interval);
        };
    }, [dispatch]);

    if (!ready) return null;

    return children;
}