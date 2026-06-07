import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";
import { getSupabaseClient } from "./supabase";

const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    console.warn("[FCM] Notifications are not available in this environment.");
    return null;
  }

  const permission = await Notification.requestPermission().catch((error) => {
    console.error("[FCM] Failed to request notification permission:", error);
    return "default" as NotificationPermission;
  });

  if (permission !== "granted") {
    console.warn(`[FCM] Notification permission not granted: ${permission}`);
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.warn("[FCM] Firebase messaging is unavailable.");
    return null;
  }

  if (!firebaseVapidKey) {
    console.error("[FCM] Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY.");
    return null;
  }

  const token = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: await navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .catch((error) => {
        console.error("[FCM] Service worker registration failed:", error);
        throw error;
      }),
  }).catch((error) => {
    console.error("[FCM] Failed to get Firebase token:", error);
    return null;
  });

  return token;
}

export async function saveFCMToken(fcmToken: string) {
  try {
    if (!fcmToken) {
      console.warn("[FCM] No token received. Skipping save.");
      return { success: false, error: "Missing FCM token." };
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      console.error("[FCM] Supabase client is not configured.");
      return { success: false, error: "Supabase client is not configured." };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[FCM] Unable to load current Supabase user:", userError);
      return { success: false, error: userError?.message || "User not found." };
    }

    console.log("[FCM] Saving token for user:", user.id);

    const { error } = await supabase.from("user_devices").upsert(
      {
        user_id: user.id,
        fcm_token: fcmToken,
        platform: "web",
      },
      {
        onConflict: "user_id,fcm_token",
      }
    );

    if (error) {
      console.error("[FCM] Failed to save token to user_devices:", error);
      return { success: false, error: error.message };
    }

    console.log("[FCM] Token saved successfully.");
    return { success: true };
  } catch (error) {
    console.error("[FCM] Unexpected error while saving token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
