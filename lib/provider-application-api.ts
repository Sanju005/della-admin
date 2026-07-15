import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceKey, getSupabaseUrl } from "@/lib/supabase-env";

export type ProviderApplicationPortfolioItemPayload = {
  title: string;
  caption: string;
  image_url: string;
};

export type ProviderApplicationServicePayload = {
  service_id: string;
  service_name: string;
  years_experience: number | null;
  specialties: string | null;
  radius_km: number | null;
  service_description: string | null;
  hourly_price: number | null;
  daily_price?: number | null;
  minimum_booking_hours: number | null;
  payments: string[];
  availability_modes: string[];
  certificates_label?: string | null;
  driving_license_label?: string | null;
  portfolio: ProviderApplicationPortfolioItemPayload[];
};

export type ProviderApplicationDocumentPayload = {
  document_type: string;
  label: string;
  file_url: string | null;
  notes?: string | null;
};

export type ProviderApplicationPayload = {
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  residential_address: string;
  current_location: string;
  email: string;
  phone_number: string;
  id_number: string;
  profile_photo_url?: string | null;
  verification_email: string;
  verification_phone: string;
  documents: ProviderApplicationDocumentPayload[];
  services: ProviderApplicationServicePayload[];
  emergency_contact?: string | null;
};

type ProviderProfileSnapshot = {
  id: string;
  marketing_name: string | null;
  profile_photo_url: string | null;
  service_location: string | null;
  service_radius_km: number | null;
  date_of_birth: string | null;
  sex: string | null;
  residential_address: string | null;
  bio: string | null;
  approval_status: string | null;
  is_visible: boolean | null;
  average_rating: number | null;
  total_reviews: number | null;
};

type ProviderServiceSnapshot = {
  id: string;
  provider_id: string;
  service_type: string | null;
  years_experience: string | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  provider_service_specialties?: Array<{ specialty: string | null }> | null;
};

type ProviderVerificationSnapshot = {
  provider_id: string;
  phone_verified: boolean | null;
  email_verified: boolean | null;
  identity_verified: boolean | null;
  kyc_verified: boolean | null;
  background_check_verified: boolean | null;
  document_type: string | null;
  front_image_name: string | null;
  back_image_name: string | null;
  admin_note: string | null;
  last_reviewed_at: string | null;
};

type ProviderMetadataSnapshot = {
  provider_id: string;
  availability_days: string[] | null;
  availability_time_preset: string | null;
  availability_start_time: string | null;
  availability_end_time: string | null;
  service_image_captions: Record<string, string[] | null> | null;
  certificate_image_captions: Record<string, string[] | null> | null;
  service_image_files: Record<string, string[] | null> | null;
  certificate_image_files: Record<string, string[] | null> | null;
  emergency_contact: string | null;
  profile_image_name: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
};

type ProviderDocumentSnapshot = {
  id: string;
  provider_id: string;
  document_type: string | null;
  label: string | null;
  file_url: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
};

type ProviderAccountSnapshot = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  phone: string | null;
  created_at: string | null;
};

type BookingSnapshot = {
  id: string;
  booking_status: string | null;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  location_text: string | null;
  quoted_amount: number | null;
  provider_services:
    | {
        service_type: string | null;
      }
    | Array<{
        service_type: string | null;
      }>
    | null;
};

type PaymentSnapshot = {
  amount: number | null;
  provider_net_amount: number | null;
  created_at: string | null;
};

type ReviewSnapshot = {
  rating: number | null;
};

export function getAdminSupabaseClient() {
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

export function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function normalizeOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function formatYearsExperience(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "";
  }

  return `${Math.round(value)} ${Math.round(value) === 1 ? "Year" : "Years"}`;
}

export function splitFullName(fullName: string) {
  const trimmed = normalizeOptionalText(fullName);
  const [firstName = "", ...rest] = trimmed.split(/\s+/).filter(Boolean);

  return {
    firstName,
    lastName: rest.join(" "),
  };
}

export function relationItem<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function normalizePhone(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("60")) {
    return `+${digits}`;
  }

  return `+60${digits}`;
}

export function normalizeServiceKey(value: string) {
  return normalizeOptionalText(value).toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function buildAvailabilityMetadata(services: ProviderApplicationServicePayload[]) {
  const firstService = services[0];

  if (!firstService) {
    return {
      availabilityDays: [] as string[],
      availabilityPreset: "",
    };
  }

  const availabilityDays = firstService.availability_modes
    .map((value) => normalizeOptionalText(value))
    .filter((value) => value && !value.toLowerCase().startsWith("time:"));
  const timePreset = firstService.availability_modes
    .map((value) => normalizeOptionalText(value))
    .find((value) => value.toLowerCase().startsWith("time:"));

  return {
    availabilityDays,
    availabilityPreset: timePreset?.replace(/^time:\s*/i, "") ?? "",
  };
}

function buildServiceImageMaps(services: ProviderApplicationServicePayload[]) {
  const serviceImageFiles: Record<string, string[]> = {};
  const serviceImageCaptions: Record<string, string[]> = {};

  for (const service of services) {
    const key = normalizeServiceKey(service.service_id || service.service_name);
    const items = (service.portfolio ?? []).filter((item) => normalizeOptionalText(item.image_url));

    if (!key || items.length === 0) {
      continue;
    }

    serviceImageFiles[key] = items
      .map((item) => normalizeOptionalText(item.image_url))
      .filter(Boolean);
    serviceImageCaptions[key] = items
      .map((item) => normalizeOptionalText(item.caption) || normalizeOptionalText(item.title) || "Portfolio image")
      .filter(Boolean);
  }

  return { serviceImageFiles, serviceImageCaptions };
}

function buildCertificateMaps(
  services: ProviderApplicationServicePayload[],
  documents: ProviderApplicationDocumentPayload[],
) {
  const certificatesByService = new Map<string, ProviderApplicationDocumentPayload[]>();

  for (const document of documents) {
    if (normalizeOptionalText(document.document_type).toLowerCase() !== "certificate") {
      continue;
    }

    const documentLabel = normalizeOptionalText(document.label);
    const matchingService = services.find((service) => documentLabel.toLowerCase().startsWith(normalizeOptionalText(service.service_name).toLowerCase()));

    if (!matchingService) {
      continue;
    }

    const key = normalizeServiceKey(matchingService.service_id || matchingService.service_name);
    const current = certificatesByService.get(key) ?? [];
    current.push(document);
    certificatesByService.set(key, current);
  }

  const certificateImageFiles: Record<string, string[]> = {};
  const certificateImageCaptions: Record<string, string[]> = {};

  for (const [key, items] of certificatesByService) {
    certificateImageFiles[key] = items.map((item) => normalizeOptionalText(item.file_url)).filter(Boolean);
    certificateImageCaptions[key] = items
      .map((item) => normalizeOptionalText(item.notes) || normalizeOptionalText(item.label) || "Certificate")
      .filter(Boolean);
  }

  return { certificateImageFiles, certificateImageCaptions };
}

async function findOrCreateProviderAccount(
  adminClient: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  payload: ProviderApplicationPayload,
) {
  const email = normalizeOptionalText(payload.email).toLowerCase();
  const fullName = `${normalizeOptionalText(payload.first_name)} ${normalizeOptionalText(payload.last_name)}`.trim();
  const phone = normalizePhone(payload.phone_number);

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile?.id) {
    return {
      providerId: existingProfile.id,
      created: false,
      fullName,
      phone,
      email,
    };
  }

  const generatedPassword = `Della-${crypto.randomUUID()}!`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      first_name: normalizeOptionalText(payload.first_name),
      last_name: normalizeOptionalText(payload.last_name),
      role: "provider",
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Unable to create provider account.");
  }

  return {
    providerId: data.user.id,
    created: true,
    fullName,
    phone,
    email,
  };
}

export async function upsertProviderApplication(
  adminClient: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  payload: ProviderApplicationPayload,
) {
  const { providerId, fullName, phone, email } = await findOrCreateProviderAccount(adminClient, payload);
  const serviceLocation = normalizeOptionalText(payload.current_location);
  const primaryRadius =
    payload.services
      .map((service) => normalizeOptionalNumber(service.radius_km))
      .find((value): value is number => typeof value === "number") ?? null;
  const { availabilityDays, availabilityPreset } = buildAvailabilityMetadata(payload.services);
  const { serviceImageFiles, serviceImageCaptions } = buildServiceImageMaps(payload.services);
  const { certificateImageFiles, certificateImageCaptions } = buildCertificateMaps(payload.services, payload.documents);
  const emergencyContact =
    normalizeOptionalText(payload.emergency_contact) ||
    normalizeOptionalText(payload.verification_phone) ||
    phone;
  const profileImageName = normalizeOptionalText(payload.profile_photo_url).split("/").pop() || "";

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: providerId,
        full_name: fullName,
        email,
        role: "provider",
        phone: phone || null,
        status: "pending",
      },
      { onConflict: "id" },
    );

  if (profileError) {
    throw new Error(profileError.message || "Unable to save provider account profile.");
  }

  const { error: providerProfileError } = await adminClient
    .from("provider_profiles")
    .upsert(
      {
        id: providerId,
        marketing_name: fullName,
        profile_photo_url: normalizeOptionalText(payload.profile_photo_url) || null,
        service_location: serviceLocation || null,
        service_radius_km: primaryRadius,
        date_of_birth: normalizeOptionalText(payload.date_of_birth) || null,
        residential_address: normalizeOptionalText(payload.residential_address) || null,
        bio: payload.services
          .map((service) => normalizeOptionalText(service.service_description))
          .filter(Boolean)
          .join("\n\n") || null,
        approval_status: "pending",
        is_visible: false,
      },
      { onConflict: "id" },
    );

  if (providerProfileError) {
    throw new Error(providerProfileError.message || "Unable to save provider profile.");
  }

  const { error: metadataError } = await adminClient
    .from("provider_admin_metadata")
    .upsert(
      {
        provider_id: providerId,
        availability_days: availabilityDays,
        availability_time_preset: availabilityPreset || null,
        service_image_files: Object.keys(serviceImageFiles).length ? serviceImageFiles : {},
        service_image_captions: Object.keys(serviceImageCaptions).length ? serviceImageCaptions : {},
        certificate_image_files: Object.keys(certificateImageFiles).length ? certificateImageFiles : {},
        certificate_image_captions: Object.keys(certificateImageCaptions).length ? certificateImageCaptions : {},
        emergency_contact: emergencyContact || null,
        profile_image_name: profileImageName || null,
      },
      { onConflict: "provider_id" },
    );

  if (metadataError) {
    throw new Error(metadataError.message || "Unable to save provider metadata.");
  }

  const existingServices = await adminClient
    .from("provider_services")
    .select("id")
    .eq("provider_id", providerId);

  const existingServiceIds = (existingServices.data ?? []).map((row) => row.id as string).filter(Boolean);

  if (existingServiceIds.length) {
    await adminClient
      .from("provider_service_specialties")
      .delete()
      .in("provider_service_id", existingServiceIds);
  }

  await adminClient.from("provider_services").delete().eq("provider_id", providerId);

  const insertedServices = await adminClient
    .from("provider_services")
    .insert(
      payload.services.map((service) => ({
        provider_id: providerId,
        service_type: normalizeServiceKey(service.service_id || service.service_name),
        years_experience: formatYearsExperience(normalizeOptionalNumber(service.years_experience)),
        hourly_rate: normalizeOptionalNumber(service.hourly_price),
        daily_rate: normalizeOptionalNumber(service.daily_price),
      })),
    )
    .select("id, service_type");

  if (insertedServices.error) {
    throw new Error(insertedServices.error.message || "Unable to save provider services.");
  }

  const serviceIdByType = new Map(
    ((insertedServices.data ?? []) as Array<{ id: string; service_type: string | null }>).map((row) => [
      normalizeServiceKey(row.service_type ?? ""),
      row.id,
    ]),
  );

  const specialtyRows = payload.services.flatMap((service) => {
    const providerServiceId = serviceIdByType.get(normalizeServiceKey(service.service_id || service.service_name));

    if (!providerServiceId) {
      return [];
    }

    return normalizeOptionalText(service.specialties)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((specialty) => ({
        provider_service_id: providerServiceId,
        specialty,
      }));
  });

  if (specialtyRows.length) {
    const { error } = await adminClient.from("provider_service_specialties").insert(specialtyRows);

    if (error) {
      throw new Error(error.message || "Unable to save provider specialties.");
    }
  }

  const identityFront = payload.documents.find((document) => normalizeOptionalText(document.document_type).toLowerCase() === "ic_front");
  const identityBack = payload.documents.find((document) => normalizeOptionalText(document.document_type).toLowerCase() === "ic_back");
  const phoneVerified = normalizeOptionalText(payload.verification_phone) === phone;
  const emailVerified = normalizeOptionalText(payload.verification_email).toLowerCase() === email;
  const identityVerified = Boolean(identityFront?.file_url && identityBack?.file_url && normalizeOptionalText(payload.id_number));

  const { error: verificationError } = await adminClient
    .from("provider_verifications")
    .upsert(
      {
        provider_id: providerId,
        phone_verified: phoneVerified,
        email_verified: emailVerified,
        identity_verified: identityVerified,
        kyc_verified: identityVerified,
        background_check_verified: false,
        document_type: normalizeOptionalText(payload.id_number) || null,
        front_image_name: normalizeOptionalText(identityFront?.label) || null,
        back_image_name: normalizeOptionalText(identityBack?.label) || null,
        requested_documents: [],
        admin_note: "",
      },
      { onConflict: "provider_id" },
    );

  if (verificationError) {
    throw new Error(verificationError.message || "Unable to save provider verification.");
  }

  await adminClient.from("provider_documents").delete().eq("provider_id", providerId);

  const documentRows = payload.documents
    .filter((document) => normalizeOptionalText(document.document_type) && normalizeOptionalText(document.file_url))
    .map((document) => ({
      provider_id: providerId,
      document_type: normalizeOptionalText(document.document_type),
      label: normalizeOptionalText(document.label) || "Document",
      file_url: normalizeOptionalText(document.file_url),
      notes: normalizeOptionalText(document.notes) || null,
      status: "Pending",
    }));

  if (documentRows.length) {
    const { error } = await adminClient.from("provider_documents").insert(documentRows);

    if (error) {
      throw new Error(error.message || "Unable to save provider documents.");
    }
  }

  return { providerId };
}

export async function fetchProviderApplicationBundle(
  adminClient: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  providerId: string,
) {
  const [{ data: account }, { data: profile }, { data: services }, { data: verification }, { data: metadata }, { data: documents }] =
    await Promise.all([
      adminClient
        .from("profiles")
        .select("id, full_name, email, role, status, phone, created_at")
        .eq("id", providerId)
        .maybeSingle(),
      adminClient
        .from("provider_profiles")
        .select("id, marketing_name, profile_photo_url, service_location, service_radius_km, date_of_birth, sex, residential_address, bio, approval_status, is_visible, average_rating, total_reviews")
        .eq("id", providerId)
        .maybeSingle(),
      adminClient
        .from("provider_services")
        .select("id, provider_id, service_type, years_experience, hourly_rate, daily_rate, provider_service_specialties ( specialty )")
        .eq("provider_id", providerId),
      adminClient
        .from("provider_verifications")
        .select("provider_id, phone_verified, email_verified, identity_verified, kyc_verified, background_check_verified, document_type, front_image_name, back_image_name, admin_note, last_reviewed_at")
        .eq("provider_id", providerId)
        .maybeSingle(),
      adminClient
        .from("provider_admin_metadata")
        .select("provider_id, availability_days, availability_time_preset, availability_start_time, availability_end_time, service_image_captions, certificate_image_captions, service_image_files, certificate_image_files, emergency_contact, profile_image_name, current_latitude, current_longitude")
        .eq("provider_id", providerId)
        .maybeSingle(),
      adminClient
        .from("provider_documents")
        .select("id, provider_id, document_type, label, file_url, notes, status, created_at")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false }),
    ]);

  return {
    account: (account as ProviderAccountSnapshot | null) ?? null,
    profile: (profile as ProviderProfileSnapshot | null) ?? null,
    services: (services as ProviderServiceSnapshot[] | null) ?? [],
    verification: (verification as ProviderVerificationSnapshot | null) ?? null,
    metadata: (metadata as ProviderMetadataSnapshot | null) ?? null,
    documents: (documents as ProviderDocumentSnapshot[] | null) ?? [],
  };
}

export async function fetchProviderDashboardBundle(
  adminClient: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  providerId: string,
) {
  const [{ data: bookings }, { data: payments }, { data: reviews }] = await Promise.all([
    adminClient
      .from("bookings")
      .select("id, booking_status, scheduled_date, scheduled_start_time, location_text, quoted_amount, provider_services ( service_type )")
      .eq("provider_id", providerId)
      .order("scheduled_date", { ascending: false })
      .limit(20),
    adminClient
      .from("payments")
      .select("amount, provider_net_amount, created_at")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false })
      .limit(50),
    adminClient
      .from("reviews")
      .select("rating")
      .eq("provider_id", providerId)
      .limit(100),
  ]);

  return {
    bookings: (bookings as BookingSnapshot[] | null) ?? [],
    payments: (payments as PaymentSnapshot[] | null) ?? [],
    reviews: (reviews as ReviewSnapshot[] | null) ?? [],
  };
}
