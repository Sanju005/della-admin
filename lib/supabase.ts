import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "./supabase-env";

let browserClient: SupabaseClient | null | undefined;

declare global {
  interface Window {
    __DELLA_PUBLIC_CONFIG?: {
      supabaseUrl?: string | null;
      supabasePublishableKey?: string | null;
      appBaseUrl?: string | null;
    };
  }
}

function getRuntimeSupabaseConfig() {
  if (typeof window !== "undefined" && window.__DELLA_PUBLIC_CONFIG) {
    return {
      url: window.__DELLA_PUBLIC_CONFIG.supabaseUrl ?? null,
      publishableKey:
        window.__DELLA_PUBLIC_CONFIG.supabasePublishableKey ?? null,
    };
  }

  return {
    url: getSupabaseUrl(),
    publishableKey: getSupabasePublishableKey(),
  };
}

export function getSupabaseClient() {
  if (browserClient !== undefined) {
    return browserClient;
  }

  const { url, publishableKey } = getRuntimeSupabaseConfig();

  if (!url || !publishableKey) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}

export const supabase =
  typeof window === "undefined" ? null : getSupabaseClient();
