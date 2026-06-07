import { deleteToken, getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";
import { getSupabaseClient } from "./supabase";

const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

export type PushSetupState = {
  hasSavedToken: boolean;
  permission: NotificationPermission | "unsupported";
};

async function ensureMessagingServiceWorker() {
  return navigator.serviceWorker.register("/firebase-messaging-sw.js").catch((error) => {
    console.error("[FCM] Service worker registration failed:", error);
    throw error;
  });
}

async function getCurrentNotificationPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported" as const;
  }

  return Notification.permission;
}

export async function getCurrentFCMToken() {
  const permission = await getCurrentNotificationPermission();

  if (permission !== "granted") {
    console.warn(`[FCM] Cannot get token because permission is ${permission}.`);
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
    serviceWorkerRegistration: await ensureMessagingServiceWorker(),
  }).catch((error) => {
    console.error("[FCM] Failed to get Firebase token:", error);
    return null;
  });

  return token;
}

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

  return getCurrentFCMToken();
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

export async function disablePushNotifications() {
  try {
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

    const token = await getCurrentFCMToken();

    if (token) {
      const { error: deleteDbError } = await supabase
        .from("user_devices")
        .delete()
        .eq("user_id", user.id)
        .eq("fcm_token", token);

      if (deleteDbError) {
        console.error("[FCM] Failed to remove token from user_devices:", deleteDbError);
        return { success: false, error: deleteDbError.message };
      }

      const messaging = await getFirebaseMessaging();

      if (messaging) {
        const deleted = await deleteToken(messaging).catch((error) => {
          console.error("[FCM] Failed to delete Firebase token:", error);
          return false;
        });

        console.log(`[FCM] Firebase token deletion status: ${deleted}`);
      }
    } else {
      const { error: deleteDbError } = await supabase
        .from("user_devices")
        .delete()
        .eq("user_id", user.id)
        .eq("platform", "web");

      if (deleteDbError) {
        console.error("[FCM] Failed to remove web push records:", deleteDbError);
        return { success: false, error: deleteDbError.message };
      }
    }

    console.log("[FCM] Push notifications disabled for this web device.");
    return { success: true };
  } catch (error) {
    console.error("[FCM] Unexpected error while disabling push:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPushSetupState(): Promise<PushSetupState> {
  try {
    const permission = await getCurrentNotificationPermission();

    if (permission === "unsupported") {
      return {
        permission,
        hasSavedToken: false,
      };
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      return {
        permission,
        hasSavedToken: false,
      };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        permission,
        hasSavedToken: false,
      };
    }

    const token = permission === "granted" ? await getCurrentFCMToken() : null;

    if (!token) {
      return {
        permission,
        hasSavedToken: false,
      };
    }

    const { data, error } = await supabase
      .from("user_devices")
      .select("fcm_token")
      .eq("user_id", user.id)
      .eq("fcm_token", token)
      .eq("platform", "web")
      .maybeSingle();

    if (error) {
      console.error("[FCM] Failed to load push setup state:", error);
    }

    return {
      permission,
      hasSavedToken: Boolean(data?.fcm_token),
    };
  } catch (error) {
    console.error("[FCM] Unexpected error while loading push setup state:", error);
    return {
      permission: "unsupported",
      hasSavedToken: false,
    };
  }
}
