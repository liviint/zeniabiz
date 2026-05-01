import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { loadActiveContext } from "@/src/db/utils";
import { runSync } from "@/src/cloudSync/worker";

let syncing = false;

async function safeSync(db) {
  if (syncing) return;
  syncing = true;

  try {
    await runSync(db);
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    syncing = false;
  }
}

let scheduled = false;

function scheduleSync(db) {
  if (scheduled) return;

  scheduled = true;

  setTimeout(() => {
    scheduled = false;
    safeSync(db);
  }, 1000);
}

export default function SyncProvider({ children }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let appStateSub;
    let netSub;

    (async () => {
      try {
        // 1️⃣ Load session context FIRST
        await loadActiveContext(db);

        // 2️⃣ Initial sync
        await scheduleSync(db);

        // 3️⃣ App foreground sync
        appStateSub = AppState.addEventListener("change", state => {
          if (state === "active") {
            scheduleSync(db);
          }
        });

        // 4️⃣ Network reconnect sync
        netSub = NetInfo.addEventListener(state => {
          if (state.isConnected) {
            scheduleSync(db);
          }
        });

        setReady(true);
      } catch (err) {
        console.error("SyncProvider init error:", err);
      }
    })();

    return () => {
      appStateSub?.remove?.();
      netSub?.();
    };
  }, []);

  if (!ready) return null;

  return children;
}