import { supabase } from "./supabase";

export type ServiceCommissionSetting = {
  serviceKey: string;
  serviceLabel: string;
  commissionPercent: number;
};

const settingsApiUrl =
  import.meta.env.VITE_ADMIN_SERVICE_COMMISSION_SETTINGS_URL?.trim() ||
  "/api/admin/service-commission-settings";

async function getAdminAccessToken() {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export async function listServiceCommissionSettings() {
  const accessToken = await getAdminAccessToken();

  if (!accessToken) {
    throw new Error("Admin session expired. Please sign in again.");
  }

  const response = await fetch(settingsApiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    settings?: ServiceCommissionSetting[];
  };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load service commission settings.");
  }

  return payload.settings ?? [];
}

export async function saveServiceCommissionSettings(settings: ServiceCommissionSetting[]) {
  const accessToken = await getAdminAccessToken();

  if (!accessToken) {
    throw new Error("Admin session expired. Please sign in again.");
  }

  const response = await fetch(settingsApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ settings }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to save service commission settings.");
  }
}
