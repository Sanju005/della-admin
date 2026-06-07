import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  isSupported,
  type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCNnSdYrL-iKY0fCglW00YiiLeWso6DVAs",
  authDomain: "dellaapp.firebaseapp.com",
  projectId: "dellaapp",
  storageBucket: "dellaapp.firebasestorage.app",
  messagingSenderId: "609758824758",
  appId: "1:609758824758:web:4999a6268be583d32c4b97",
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const supported = await isSupported().catch((error) => {
    console.error("[FCM] Messaging support check failed:", error);
    return false;
  });

  if (!supported) {
    console.warn("[FCM] Firebase messaging is not supported in this browser.");
    return null;
  }

  return getMessaging(firebaseApp);
}
