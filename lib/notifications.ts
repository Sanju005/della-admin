import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const token = await getToken(messaging, {
    vapidKey: "YOUR_VAPID_KEY",
  });

  return token;
}