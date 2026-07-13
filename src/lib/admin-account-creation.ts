import { supabase } from "./supabase";

export type CreateCustomerInput = {
  accountType: "customer";
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  status?: string;
  dob?: string;
  gender?: string;
  city?: string;
  region?: string;
  country?: string;
};

export type CreateProviderInput = {
  accountType: "provider";
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  status?: string;
  dob?: string;
  gender?: string;
  city?: string;
  region?: string;
  country?: string;
  marketingName?: string;
  profilePhotoUrl?: string;
  serviceType?: string;
  serviceLocation?: string;
  address?: string;
  bio?: string;
  serviceRadiusKm?: number;
  yearsExperience?: string;
  hourlyRate?: number;
  dailyRate?: number;
  availabilityDays?: string[];
  availabilityPreset?: string;
  availabilityStartTime?: string;
  availabilityEndTime?: string;
  approvalStatus?: string;
  visible?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  kycVerified?: boolean;
  backgroundCheckVerified?: boolean;
};

export type CreateAccountInput = CreateCustomerInput | CreateProviderInput;

type CreateAccountResponse = {
  error: string | null;
  userId?: string;
};

const adminAccountCreateApiUrl =
  import.meta.env.VITE_ADMIN_ACCOUNT_CREATE_URL?.trim() || "/api/admin/accounts/create";

async function getAdminAccessToken() {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export async function createAdminManagedAccount(
  payload: CreateAccountInput,
): Promise<CreateAccountResponse> {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const accessToken = await getAdminAccessToken();

  if (!accessToken) {
    return { error: "Admin session expired. Please sign in again." };
  }

  try {
    const response = await fetch(adminAccountCreateApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = (await response.json().catch(() => ({}))) as {
      error?: string;
      userId?: string;
    };

    if (!response.ok) {
      return {
        error: responsePayload.error || "Unable to create account.",
      };
    }

    return {
      error: null,
      userId: responsePayload.userId,
    };
  } catch {
    return {
      error: "Unable to reach the admin account service.",
    };
  }
}
