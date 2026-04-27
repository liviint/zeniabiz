import NetInfo from "@react-native-community/netinfo"
import { runSync } from "./worker"

export async function triggerSync(db) {
  const state = await NetInfo.fetch()

  if (state.isConnected) {
    await runSync(db)
  } else {
    console.log("Offline → skipping sync")
  }
}