import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// How notifications should behave
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  if (!Device.isDevice) return false;

  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== "granted") {
    const newSettings = await Notifications.requestPermissionsAsync();
    return newSettings.status === "granted";
  }
  return true;
}

export async function scheduleLocalNotification({ title, body, hour, minute }) {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      hour,
      minute,
      repeats: true, // Daily
    },
  });
}

export function cancelNotification(id) {
  return Notifications.cancelScheduledNotificationAsync(id);
}
