import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  getSupabaseServiceKey,
  getSupabaseUrl,
} from "@/lib/supabase-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProviderServiceRow = {
  id: string;
  service_type: string | null;
  years_experience: string | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  provider_service_specialties:
    | Array<{ specialty: string | null }>
    | null;
};

type ProviderProfileRow = {
  id: string;
  marketing_name: string | null;
  service_location: string | null;
  service_radius_km: number | null;
  bio: string | null;
  approval_status: string | null;
  is_visible: boolean | null;
  provider_services: ProviderServiceRow[] | null;
  provider_verifications:
    | {
        phone_verified: boolean | null;
        email_verified: boolean | null;
        identity_verified: boolean | null;
        kyc_verified: boolean | null;
        background_check_verified: boolean | null;
      }
    | Array<{
        phone_verified: boolean | null;
        email_verified: boolean | null;
        identity_verified: boolean | null;
        kyc_verified: boolean | null;
        background_check_verified: boolean | null;
      }>
    | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  phone: string | null;
};

function getAdminSupabaseClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceKey();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function relationItem<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function toTitleCase(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Pending";
  }

  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

async function verifyProviderRequest(request: Request) {
  const adminClient = getAdminSupabaseClient();

  if (!adminClient) {
    return { error: NextResponse.json({ error: "Supabase is not configured yet." }, { status: 500 }) };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    return { error: NextResponse.json({ error: "Missing auth token." }, { status: 401 }) };
  }

  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Invalid session." }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, full_name, email, role, status, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: "Provider profile was not found." }, { status: 404 }) };
  }

  if (profile.role !== "provider") {
    return { error: NextResponse.json({ error: "This account is not a provider." }, { status: 403 }) };
  }

  return {
    adminClient,
    authUser: user,
    profile: profile as ProfileRow,
  };
}

async function syncEmailVerification(
  adminClient: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  providerId: string,
  emailVerified: boolean,
) {
  const payload = {
    email_verified: emailVerified,
  };

  const byProviderId = await adminClient
    .from("provider_verifications")
    .upsert(
      {
        provider_id: providerId,
        ...payload,
      },
      { onConflict: "provider_id" },
    );

  if (!byProviderId.error) {
    return;
  }

  await adminClient
    .from("provider_verifications")
    .upsert(
      {
        id: providerId,
        ...payload,
      },
      { onConflict: "id" },
    );
}

async function fetchProviderSnapshot(
  adminClient: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  providerId: string,
) {
  const { data, error } = await adminClient
    .from("provider_profiles")
    .select(`
      id,
      marketing_name,
      service_location,
      service_radius_km,
      bio,
      approval_status,
      is_visible,
      provider_services (
        id,
        service_type,
        years_experience,
        hourly_rate,
        daily_rate,
        provider_service_specialties (
          specialty
        )
      ),
      provider_verifications (
        phone_verified,
        email_verified,
        identity_verified,
        kyc_verified,
        background_check_verified
      )
    `)
    .eq("id", providerId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ProviderProfileRow;
}

function buildResponse(profile: ProfileRow, providerProfile: ProviderProfileRow, authUser: { email_confirmed_at?: string | null }) {
  const verification = relationItem(providerProfile.provider_verifications);

  return {
    providerId: profile.id,
    fullName: profile.full_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    accountStatus: toTitleCase(profile.status),
    marketingName: providerProfile.marketing_name ?? "",
    serviceLocation: providerProfile.service_location ?? "",
    serviceRadiusKm: providerProfile.service_radius_km ?? 0,
    bio: providerProfile.bio ?? "",
    approvalStatus: toTitleCase(providerProfile.approval_status),
    isVisible: Boolean(providerProfile.is_visible),
    emailVerified: Boolean(authUser.email_confirmed_at) || Boolean(verification?.email_verified),
    phoneVerified: Boolean(verification?.phone_verified),
    identityVerified: Boolean(verification?.identity_verified),
    kycVerified: Boolean(verification?.kyc_verified),
    backgroundCheckVerified: Boolean(verification?.background_check_verified),
    services:
      providerProfile.provider_services?.map((service) => ({
        id: service.id,
        serviceType: service.service_type ?? "service",
        yearsExperience: service.years_experience ?? "",
        hourlyRate: Number(service.hourly_rate ?? 0),
        dailyRate: Number(service.daily_rate ?? 0),
        specialties:
          service.provider_service_specialties
            ?.map((item) => item.specialty)
            .filter((item): item is string => Boolean(item)) ?? [],
      })) ?? [],
  };
}

export async function GET(request: Request) {
  const verified = await verifyProviderRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const emailVerified = Boolean(verified.authUser.email_confirmed_at);
  await syncEmailVerification(verified.adminClient, verified.profile.id, emailVerified);

  const providerProfile = await fetchProviderSnapshot(verified.adminClient, verified.profile.id);

  if (!providerProfile) {
    return NextResponse.json({ error: "Provider listing was not found." }, { status: 404 });
  }

  return NextResponse.json(
    buildResponse(verified.profile, providerProfile, verified.authUser),
  );
}

type UpdatePayload = {
  fullName?: string;
  marketingName?: string;
  serviceLocation?: string;
  serviceRadiusKm?: number;
  bio?: string;
};

export async function PATCH(request: Request) {
  const verified = await verifyProviderRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const payload = (await request.json()) as UpdatePayload;

  if (typeof payload.fullName === "string" && payload.fullName.trim()) {
    const { error } = await verified.adminClient
      .from("profiles")
      .update({ full_name: payload.fullName.trim() })
      .eq("id", verified.profile.id);

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to update profile." }, { status: 500 });
    }
  }

  const providerPayload = Object.fromEntries(
    Object.entries({
      marketing_name: payload.marketingName?.trim(),
      service_location: payload.serviceLocation?.trim(),
      service_radius_km:
        typeof payload.serviceRadiusKm === "number" && Number.isFinite(payload.serviceRadiusKm)
          ? payload.serviceRadiusKm
          : undefined,
      bio: payload.bio?.trim(),
    }).filter(([, value]) => value !== undefined && value !== ""),
  );

  if (Object.keys(providerPayload).length > 0) {
    const { error } = await verified.adminClient
      .from("provider_profiles")
      .update(providerPayload)
      .eq("id", verified.profile.id);

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to update listing." }, { status: 500 });
    }
  }

  const emailVerified = Boolean(verified.authUser.email_confirmed_at);
  await syncEmailVerification(verified.adminClient, verified.profile.id, emailVerified);

  const refreshedProfile = await verified.adminClient
    .from("profiles")
    .select("id, full_name, email, role, status, phone")
    .eq("id", verified.profile.id)
    .maybeSingle();

  const providerProfile = await fetchProviderSnapshot(verified.adminClient, verified.profile.id);

  if (refreshedProfile.error || !refreshedProfile.data || !providerProfile) {
    return NextResponse.json({ error: "Unable to load updated provider." }, { status: 500 });
  }

  return NextResponse.json(
    buildResponse(
      refreshedProfile.data as ProfileRow,
      providerProfile,
      verified.authUser,
    ),
  );
}
