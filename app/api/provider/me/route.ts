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
  profile_photo_url?: string | null;
  service_location: string | null;
  service_radius_km: number | null;
  date_of_birth?: string | null;
  sex?: string | null;
  residential_address?: string | null;
  bio: string | null;
  approval_status: string | null;
  is_visible: boolean | null;
  provider_admin_metadata?:
    | {
        availability_days?: string[] | null;
        availability_time_preset?: string | null;
        availability_start_time?: string | null;
        availability_end_time?: string | null;
        emergency_contact?: string | null;
        current_latitude?: number | null;
        current_longitude?: number | null;
      }
    | Array<{
        availability_days?: string[] | null;
        availability_time_preset?: string | null;
        availability_start_time?: string | null;
        availability_end_time?: string | null;
        emergency_contact?: string | null;
        current_latitude?: number | null;
        current_longitude?: number | null;
      }>
    | null;
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

function normalizeRole(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
}

function isProviderRole(value: string | null | undefined) {
  const normalized = normalizeRole(value);
  return normalized === "provider" || normalized === "service_provider";
}

function splitFullName(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName,
    lastName: rest.join(" "),
  };
}

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

function formatAvailabilityDays(days: string[] | null | undefined) {
  const cleanDays = (days ?? []).map((value) => value.trim()).filter(Boolean);

  if (!cleanDays.length) {
    return "Not set";
  }

  return cleanDays.join(", ");
}

function formatAvailabilityHours(metadata: {
  availability_time_preset?: string | null;
  availability_start_time?: string | null;
  availability_end_time?: string | null;
} | null | undefined) {
  if (!metadata) {
    return "Not set";
  }

  const preset = metadata.availability_time_preset?.trim() || "";
  const start = metadata.availability_start_time?.trim() || "";
  const end = metadata.availability_end_time?.trim() || "";

  if (preset && preset.toLowerCase() !== "custom time") {
    return preset;
  }

  if (start && end) {
    return `${start} - ${end}`;
  }

  return preset || "Not set";
}

function formatCoordinates(latitude: number | null | undefined, longitude: number | null | undefined) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return "Not captured";
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
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

  if (!isProviderRole(profile.role)) {
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
      profile_photo_url,
      service_location,
      service_radius_km,
      date_of_birth,
      sex,
      residential_address,
      bio,
      approval_status,
      is_visible,
      provider_admin_metadata (
        availability_days,
        availability_time_preset,
        availability_start_time,
        availability_end_time,
        emergency_contact,
        current_latitude,
        current_longitude
      ),
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
  const metadata = relationItem(providerProfile.provider_admin_metadata);

  return {
    providerId: profile.id,
    fullName: profile.full_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    accountStatus: toTitleCase(profile.status),
    marketingName: providerProfile.marketing_name ?? "",
    profilePhotoUrl: providerProfile.profile_photo_url ?? "",
    serviceLocation: providerProfile.service_location ?? "",
    serviceRadiusKm: providerProfile.service_radius_km ?? 0,
    dateOfBirth: providerProfile.date_of_birth ?? "",
    sex: providerProfile.sex ?? "",
    residentialAddress: providerProfile.residential_address ?? "",
    emergencyContact: metadata?.emergency_contact ?? "",
    availabilityDays: formatAvailabilityDays(metadata?.availability_days),
    availabilityHours: formatAvailabilityHours(metadata),
    currentCoordinates: formatCoordinates(metadata?.current_latitude, metadata?.current_longitude),
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
  emergencyContact?: string;
  availabilityDays?: string;
  availabilityHours?: string;
};

function parseAvailabilityDays(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAvailabilityHours(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      preset: null as string | null,
      start: null as string | null,
      end: null as string | null,
    };
  }

  const rangeMatch = trimmed.match(/^(.+?)\s*-\s*(.+)$/);

  if (rangeMatch) {
    return {
      preset: "Custom Time",
      start: rangeMatch[1].trim() || null,
      end: rangeMatch[2].trim() || null,
    };
  }

  return {
    preset: trimmed,
    start: null,
    end: null,
  };
}

export async function PATCH(request: Request) {
  const verified = await verifyProviderRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const payload = (await request.json()) as UpdatePayload;
  const nextFullName = payload.fullName?.trim() ?? "";
  const nextMarketingName = payload.marketingName?.trim() ?? "";
  const nextEmergencyContact = payload.emergencyContact?.trim() ?? "";
  const nextAvailabilityDays =
    typeof payload.availabilityDays === "string" ? parseAvailabilityDays(payload.availabilityDays) : null;
  const nextAvailabilityHours =
    typeof payload.availabilityHours === "string" ? parseAvailabilityHours(payload.availabilityHours) : null;

  if (nextFullName) {
    const { error } = await verified.adminClient
      .from("profiles")
      .update({ full_name: nextFullName })
      .eq("id", verified.profile.id);

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to update profile." }, { status: 500 });
    }
  }

  if (nextFullName || nextMarketingName) {
    const currentMetadata =
      verified.authUser.user_metadata && typeof verified.authUser.user_metadata === "object"
        ? verified.authUser.user_metadata
        : {};
    const nameParts = nextFullName ? splitFullName(nextFullName) : null;

    const { error } = await verified.adminClient.auth.admin.updateUserById(verified.profile.id, {
      user_metadata: {
        ...currentMetadata,
        ...(nextFullName
          ? {
              full_name: nextFullName,
              first_name: nameParts?.firstName ?? "",
              last_name: nameParts?.lastName ?? "",
            }
          : {}),
        ...(nextMarketingName ? { marketing_name: nextMarketingName } : {}),
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to update provider account metadata." }, { status: 500 });
    }
  }

  const providerPayload = Object.fromEntries(
    Object.entries({
      marketing_name: nextMarketingName || undefined,
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

  if (
    typeof payload.emergencyContact === "string" ||
    typeof payload.availabilityDays === "string" ||
    typeof payload.availabilityHours === "string"
  ) {
    const metadataPayload = {
      provider_id: verified.profile.id,
      ...(typeof payload.emergencyContact === "string"
        ? { emergency_contact: nextEmergencyContact || null }
        : {}),
      ...(typeof payload.availabilityDays === "string"
        ? { availability_days: nextAvailabilityDays }
        : {}),
      ...(typeof payload.availabilityHours === "string"
        ? {
            availability_time_preset: nextAvailabilityHours?.preset ?? null,
            availability_start_time: nextAvailabilityHours?.start ?? null,
            availability_end_time: nextAvailabilityHours?.end ?? null,
          }
        : {}),
    };

    const { error } = await verified.adminClient
      .from("provider_admin_metadata")
      .upsert(metadataPayload, { onConflict: "provider_id" });

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to update provider metadata." }, { status: 500 });
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
