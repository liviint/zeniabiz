import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSQLiteContext } from "expo-sqlite";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { scheduleSync } from "@/src/cloudSync/worker";
import { triggerSync } from "@/src/store/features/syncSlice";

export default function SyncProvider({ children }) {
    const db = useSQLiteContext();
    const [ready, setReady] = useState(false); 

    const dispatch = useDispatch();
    const trigger = useSelector((state) => state.sync.trigger);
    const user = useSelector((state) => state.user.userDetails);


    useEffect(() => {
        const run = async () => {
            if (!user) {
                setReady(true);
                return;
            }
            try {
                await scheduleSync(db,dispatch);
            } catch (err) {
                console.error("Sync failed:", err);
            } 
        };

        run();
    }, [trigger]);

    useEffect(() => {
        let appStateSub;
        let netSub;
        let interval;

        (async () => {
            try {
                // foreground sync
                appStateSub = AppState.addEventListener("change", state => {
                    if (state === "active") {
                        dispatch(triggerSync())
                    }
                });

            // network reconnect sync
            netSub = NetInfo.addEventListener(state => {
                if (state.isConnected) {
                    dispatch(triggerSync())
                }
            });

            // 🔥 periodic safety sync (IMPORTANT)
            interval = setInterval(() => {
                dispatch(triggerSync())
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