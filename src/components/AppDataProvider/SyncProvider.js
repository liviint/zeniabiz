import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { loadActiveContext } from "@/src/db/utils";
import { scheduleSync } from "@/src/cloudSync/worker";

export default function SyncProvider({ children }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);

    useEffect(() => {
        let appStateSub;
        let netSub;
        let interval;

        (async () => {
            try {
                const ctx = await loadActiveContext(db);

                const isAuthenticated = !!ctx?.access_token;
                console.log(ctx,"hello ctx")
                // ❌ no sync engine if not logged in
                if (!isAuthenticated) {
                    setReady(true);
                    return;
                }

                // 🚀 initial sync
                await scheduleSync(db);

            // foreground sync
                appStateSub = AppState.addEventListener("change", state => {
                    if (state === "active") {
                    scheduleSync(db);
                    }
                });

            // network reconnect sync
            netSub = NetInfo.addEventListener(state => {
                if (state.isConnected) {
                scheduleSync(db);
                }
            });

            // 🔥 periodic safety sync (IMPORTANT)
            interval = setInterval(() => {
                scheduleSync(db);
            }, 2 * 60 * 1000);

            setReady(true);
            } catch (err) {
            console.error("SyncProvider init error:", err);
            }
        })();

        return () => {
            appStateSub?.remove?.();
            netSub?.();
            clearInterval(interval);
        };
    }, []);

  if (!ready) return null;

  return children;
}