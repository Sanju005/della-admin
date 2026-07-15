import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const providerId = process.argv[2]?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!providerId) {
  console.error("Usage: node scripts/inspect-provider-live.mjs <provider-id>");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function normalize(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

async function maybeRow(table, matchKey, matchValue, select) {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq(matchKey, matchValue)
    .maybeSingle();

  if (error) {
    if (error.message.includes("Could not find the table")) {
      return null;
    }

    throw error;
  }

  return data ?? null;
}

async function manyRows(table, matchKey, matchValue, select) {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq(matchKey, matchValue);

  if (error) {
    if (error.message.includes("Could not find the table")) {
      return [];
    }

    throw error;
  }

  return data ?? [];
}

async function main() {
  const profile = await maybeRow(
    "profiles",
    "id",
    providerId,
    "id, full_name, email, role, status, phone, created_at",
  );

  const providerProfile = await maybeRow(
    "provider_profiles",
    "id",
    providerId,
    "id, marketing_name, profile_photo_url, service_location, service_radius_km, date_of_birth, sex, residential_address, bio, average_rating, total_reviews, approval_status, is_visible, created_at",
  );

  const verification = await maybeRow(
    "provider_verifications",
    "provider_id",
    providerId,
    "provider_id, phone_verified, email_verified, identity_verified, kyc_verified, background_check_verified, document_type, document_front_url, document_back_url, front_image_name, back_image_name, requested_documents, admin_note, last_reviewed_at, identity_document_type, identity_front_image_url, identity_back_image_url",
  );

  const adminMetadata = await maybeRow(
    "provider_admin_metadata",
    "provider_id",
    providerId,
    "provider_id, availability_days, availability_time_preset, availability_start_time, availability_end_time, service_image_captions, certificate_image_captions, service_image_files, certificate_image_files, emergency_contact, profile_image_name, current_latitude, current_longitude, created_at",
  );

  const services = await manyRows(
    "provider_services",
    "provider_id",
    providerId,
    "id, provider_id, service_type, years_experience, hourly_rate, daily_rate",
  );

  const specialtyIds = services.map((row) => row.id).filter(Boolean);
  let specialties = [];
  if (specialtyIds.length > 0) {
    const { data, error } = await supabase
      .from("provider_service_specialties")
      .select("provider_service_id, specialty")
      .in("provider_service_id", specialtyIds);

    if (error) {
      throw error;
    }

    specialties = data ?? [];
  }

  console.log(JSON.stringify({
    providerId,
    profile,
    providerProfile,
    verification,
    adminMetadata,
    services,
    specialties,
    visibilityCheck: {
      hasProfile: Boolean(profile),
      hasProviderProfile: Boolean(providerProfile),
      hasVerification: Boolean(verification),
      hasAdminMetadata: Boolean(adminMetadata),
      hasProfilePhotoUrl: Boolean(providerProfile?.profile_photo_url),
      hasProfileImageName: Boolean(adminMetadata?.profile_image_name),
      hasIdentityFrontImageUrl: Boolean(verification?.identity_front_image_url || verification?.document_front_url),
      hasIdentityBackImageUrl: Boolean(verification?.identity_back_image_url || verification?.document_back_url),
      hasServiceImages: Boolean(
        adminMetadata?.service_image_files &&
          Object.values(adminMetadata.service_image_files).flat().filter(Boolean).length,
      ),
      hasCertificateImages: Boolean(
        adminMetadata?.certificate_image_files &&
          Object.values(adminMetadata.certificate_image_files).flat().filter(Boolean).length,
      ),
      hasEmergencyContact: Boolean(adminMetadata?.emergency_contact),
      hasCoordinates: typeof adminMetadata?.current_latitude === "number" && typeof adminMetadata?.current_longitude === "number",
      serviceCount: services.length,
      specialtyCount: specialties.length,
    },
    preview: {
      name: normalize(profile?.full_name),
      email: normalize(profile?.email),
      phone: normalize(profile?.phone),
      marketingName: normalize(providerProfile?.marketing_name),
      profilePhotoUrl: normalize(providerProfile?.profile_photo_url),
      profileImageName: normalize(adminMetadata?.profile_image_name),
      serviceLocation: normalize(providerProfile?.service_location),
      radiusKm: normalize(providerProfile?.service_radius_km),
      dob: normalize(providerProfile?.date_of_birth),
      sex: normalize(providerProfile?.sex),
      residentialAddress: normalize(providerProfile?.residential_address),
      emergencyContact: normalize(adminMetadata?.emergency_contact),
      availabilityDays: normalize(adminMetadata?.availability_days),
      availabilityPreset: normalize(adminMetadata?.availability_time_preset),
      availabilityStart: normalize(adminMetadata?.availability_start_time),
      availabilityEnd: normalize(adminMetadata?.availability_end_time),
      icOrPassportType: normalize(verification?.identity_document_type || verification?.document_type),
      icFrontUrl: normalize(verification?.identity_front_image_url || verification?.document_front_url),
      icBackUrl: normalize(verification?.identity_back_image_url || verification?.document_back_url),
      serviceImageFiles: normalize(adminMetadata?.service_image_files),
      certificateImageFiles: normalize(adminMetadata?.certificate_image_files),
      serviceImageCaptions: normalize(adminMetadata?.service_image_captions),
      certificateImageCaptions: normalize(adminMetadata?.certificate_image_captions),
      services: normalize(services),
      specialties: normalize(specialties),
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
