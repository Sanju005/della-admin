import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "./supabase-env";

type ProviderServiceRow = {
  id: string;
  service_type: string;
  years_experience: string | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  provider_service_specialties:
    | Array<{
        specialty: string | null;
      }>
    | null;
};

type ProviderVerificationRow = {
  phone_verified: boolean | null;
  email_verified: boolean | null;
  identity_verified: boolean | null;
};

type ProviderRow = {
  id: string;
  marketing_name: string | null;
  service_location: string | null;
  service_radius_km: number | null;
  bio: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  approval_status: string | null;
  provider_services: ProviderServiceRow[] | null;
  provider_verifications: ProviderVerificationRow | ProviderVerificationRow[] | null;
};

export type MarketplaceProvider = {
  id: string;
  name: string;
  location: string;
  radiusKm: number;
  bio: string;
  rating: number;
  reviews: number;
  serviceLabel: string;
  yearsExperience: string;
  hourlyRate: number;
  dailyRate: number;
  specialties: string[];
  phoneVerified: boolean;
  identityVerified: boolean;
  isApproved: boolean;
};

export type MarketplaceData = {
  providers: MarketplaceProvider[];
  totalProviders: number;
  services: string[];
  errorMessage: string | null;
};

const serviceLabels: Record<string, string> = {
  chef: "Chef",
  maid: "Maid",
  tutor: "Tutor",
  driver: "Driver",
  cleaner: "Cleaner",
  babysitter: "Babysitter",
  plumber: "Plumber",
  electrician: "Electrician",
  other: "Other",
};

function humanizeService(type: string) {
  return serviceLabels[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

function buildSupabasePublicClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabasePublishableKey();

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const getMarketplaceData = cache(async (): Promise<MarketplaceData> => {
  const supabase = buildSupabasePublicClient();

  if (!supabase) {
    return {
      providers: [],
      totalProviders: 0,
      services: [],
      errorMessage:
        "Supabase public keys are not configured in this app yet, so provider listings cannot be loaded here.",
    };
  }

  const { data, error } = await supabase
    .from("provider_profiles")
    .select(
      `
        id,
        marketing_name,
        service_location,
        service_radius_km,
        bio,
        average_rating,
        total_reviews,
        approval_status,
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
          identity_verified
        )
      `,
    )
    .eq("is_visible", true)
    .order("average_rating", { ascending: false });

  if (error) {
    return {
      providers: [],
      totalProviders: 0,
      services: [],
      errorMessage: error.message,
    };
  }

  const rows = (data ?? []) as ProviderRow[];
  const services = new Set<string>();

  const providers = rows
    .map((row) => {
      const firstService = row.provider_services?.[0];

      if (!firstService) {
        return null;
      }

      services.add(humanizeService(firstService.service_type));

      const verificationRow = Array.isArray(row.provider_verifications)
        ? row.provider_verifications[0]
        : row.provider_verifications;

      return {
        id: row.id,
        name: row.marketing_name ?? "DELLA Provider",
        location: row.service_location ?? "Malaysia",
        radiusKm: row.service_radius_km ?? 0,
        bio: row.bio ?? "Trusted services available through DELLA.",
        rating: Number(row.average_rating ?? 0),
        reviews: row.total_reviews ?? 0,
        serviceLabel: humanizeService(firstService.service_type),
        yearsExperience: firstService.years_experience ?? "New",
        hourlyRate: Number(firstService.hourly_rate ?? 0),
        dailyRate: Number(firstService.daily_rate ?? 0),
        specialties:
          firstService.provider_service_specialties
            ?.map((item) => item.specialty)
            .filter((item): item is string => Boolean(item))
            .slice(0, 3) ?? [],
        phoneVerified:
          row.approval_status === "approved" &&
          Boolean(verificationRow?.email_verified) &&
          Boolean(verificationRow?.phone_verified),
        identityVerified:
          row.approval_status === "approved" &&
          Boolean(verificationRow?.email_verified) &&
          Boolean(verificationRow?.identity_verified),
        isApproved:
          row.approval_status === "approved" && Boolean(verificationRow?.email_verified),
      };
    })
    .filter((provider): provider is MarketplaceProvider => provider !== null);

  return {
    providers,
    totalProviders: providers.length,
    services: Array.from(services),
    errorMessage: null,
  };
});
