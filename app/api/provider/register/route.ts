import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createProviderRegistration } from "@/lib/provider-registration-storage";
import type { ProviderRegistrationData } from "@/lib/provider-registration-types";
import {
  getSupabaseServiceKey,
  getSupabaseUrl,
} from "@/lib/supabase-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toSignupErrorMessage(errorMessage?: string) {
  const normalizedMessage = errorMessage?.trim().toLowerCase() ?? "";

  if (normalizedMessage.includes("email rate limit exceeded")) {
    return "Too many verification emails were requested. Please wait a few minutes and try again.";
  }

  if (normalizedMessage.includes("user already registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }

  return errorMessage || "Unable to create provider account.";
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

function normalizePhone(countryCode: string, phoneNumber: string) {
  const digits = phoneNumber.replace(/[^\d]/g, "");
  const normalizedCountryCode = countryCode.trim() || "+60";

  if (!digits) {
    return normalizedCountryCode;
  }

  if (digits.startsWith("60")) {
    return `+${digits}`;
  }

  const countryDigits = normalizedCountryCode.replace(/[^\d]/g, "");

  return `+${countryDigits}${digits}`;
}

function toServiceType(service: string) {
  return service.trim().toLowerCase();
}

function buildCaptionMap(
  payload: ProviderRegistrationData,
  key: "imageCaptions" | "certificateCaptions",
) {
  return Object.fromEntries(
    payload.selectedServices.map((service) => [
      toServiceType(service),
      payload.serviceDetails[service][key].filter((value) => value.trim().length > 0),
    ]),
  );
}

function buildAssetMap(
  payload: ProviderRegistrationData,
  key: "imageUrls" | "certificateUrls",
) {
  return Object.fromEntries(
    payload.selectedServices.map((service) => {
      const details = payload.serviceDetails[service] as ProviderRegistrationData["serviceDetails"][keyof ProviderRegistrationData["serviceDetails"]];
      const preferred = (details[key] ?? []).filter((value) => value.trim().length > 0);

      return [toServiceType(service), preferred];
    }),
  );
}

function buildProviderBio(payload: ProviderRegistrationData) {
  const specialties = payload.selectedServices
    .flatMap((service) => payload.serviceDetails[service].specialties)
    .filter(Boolean)
    .slice(0, 4);

  const services = payload.selectedServices.join(", ");
  const specialtyLabel = specialties.length > 0 ? ` Specialties: ${specialties.join(", ")}.` : "";

  return `Provider for ${services} in ${payload.basicProfile.serviceLocation}.${specialtyLabel}`;
}

function getProviderFullName(payload: ProviderRegistrationData) {
  return [payload.basicProfile.firstName, payload.basicProfile.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function normalizeDateOfBirth(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pickProfilePhotoUrl(payload: ProviderRegistrationData) {
  const basicProfile = payload.basicProfile as Record<string, unknown>;

  return normalizeOptionalText(basicProfile.profileImageUrl) ??
    normalizeOptionalText(basicProfile.profilePhotoUrl) ??
    normalizeOptionalText(basicProfile.profile_photo_url) ??
    normalizeOptionalText(basicProfile.photoUrl);
}

function pickProfilePhotoName(payload: ProviderRegistrationData) {
  const basicProfile = payload.basicProfile as Record<string, unknown>;

  return normalizeOptionalText(basicProfile.profileImageName) ??
    normalizeOptionalText(basicProfile.profilePhotoName) ??
    normalizeOptionalText(basicProfile.profile_image_name) ??
    normalizeOptionalText(basicProfile.photoName);
}

function pickEmergencyContact(payload: ProviderRegistrationData) {
  const sections = [
    payload.basicProfile as Record<string, unknown>,
    payload.account as Record<string, unknown>,
    payload.verification as Record<string, unknown>,
  ];

  for (const section of sections) {
    const value = normalizeOptionalText(section.emergencyContact) ?? normalizeOptionalText(section.emergency_contact);
    if (value) {
      return value;
    }
  }

  return null;
}

function buildProviderDocumentRows(
  providerId: string,
  payload: ProviderRegistrationData,
  frontImageUrl: string | null,
  backImageUrl: string | null,
) {
  const documentType = normalizeOptionalText(payload.verification.documentType) || "Identity Document";
  const rows = [];

  if (frontImageUrl) {
    rows.push({
      provider_id: providerId,
      document_type: "ic_front",
      label: `${documentType} Front`,
      file_url: frontImageUrl,
      notes: null,
      status: "Pending",
    });
  }

  if (backImageUrl) {
    rows.push({
      provider_id: providerId,
      document_type: "ic_back",
      label: `${documentType} Back`,
      file_url: backImageUrl,
      notes: null,
      status: "Pending",
    });
  }

  return rows;
}

async function upsertProviderVerification(
  adminClient: ReturnType<typeof getAdminSupabaseClient>,
  providerId: string,
  payload: {
    phoneVerified: boolean;
    emailVerified: boolean;
    identityVerified: boolean;
    identityDocumentType: string | null;
    frontImageName: string | null;
    backImageName: string | null;
    frontImageUrl: string | null;
    backImageUrl: string | null;
  },
) {
  if (!adminClient) {
    return { error: { message: "Supabase is not configured yet." } };
  }

  const verificationPayload = {
    phone_verified: payload.phoneVerified,
    email_verified: payload.emailVerified,
    identity_verified: payload.identityVerified,
    kyc_verified: payload.identityVerified,
    background_check_verified: false,
    document_type: payload.identityDocumentType,
    identity_document_type: payload.identityDocumentType,
    front_image_name: payload.frontImageName,
    back_image_name: payload.backImageName,
    document_front_url: payload.frontImageUrl,
    document_back_url: payload.backImageUrl,
    identity_front_image_url: payload.frontImageUrl,
    identity_back_image_url: payload.backImageUrl,
  };

  const byProviderId = await adminClient
    .from("provider_verifications")
    .upsert(
      {
        provider_id: providerId,
        ...verificationPayload,
      },
      { onConflict: "provider_id" },
    );

  if (!byProviderId.error) {
    return byProviderId;
  }

  return adminClient
    .from("provider_verifications")
    .upsert(
      {
        id: providerId,
        ...verificationPayload,
      },
      { onConflict: "id" },
    );
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ProviderRegistrationData;
    const fullName = getProviderFullName(payload);
    const sex = payload.basicProfile.sex === "Male" || payload.basicProfile.sex === "Female"
      ? payload.basicProfile.sex
      : "";
    const dateOfBirth = normalizeDateOfBirth(payload.basicProfile.dateOfBirth);
    const residentialAddress = payload.basicProfile.residentialAddress.trim() || null;
    const profilePhotoUrl = pickProfilePhotoUrl(payload);
    const profileImageName = pickProfilePhotoName(payload);
    const emergencyContact = pickEmergencyContact(payload);
    const verificationFrontImageUrl =
      normalizeOptionalText((payload.verification as Record<string, unknown>).frontImageUrl) ??
      normalizeOptionalText((payload.verification as Record<string, unknown>).identityFrontImageUrl);
    const verificationBackImageUrl =
      normalizeOptionalText((payload.verification as Record<string, unknown>).backImageUrl) ??
      normalizeOptionalText((payload.verification as Record<string, unknown>).identityBackImageUrl);

    if (!payload.basicProfile.firstName || !payload.basicProfile.lastName || !sex || !payload.account.email) {
      return NextResponse.json(
        { error: "Missing required registration fields." },
        { status: 400 }
      );
    }

    if (payload.selectedServices.length === 0) {
      return NextResponse.json(
        { error: "Select at least one service." },
        { status: 400 }
      );
    }

    if (payload.account.password !== payload.account.confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (payload.account.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const adminClient = getAdminSupabaseClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: "Supabase is not configured yet." },
        { status: 500 }
      );
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: payload.account.email.trim().toLowerCase(),
      password: payload.account.password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        first_name: payload.basicProfile.firstName.trim(),
        last_name: payload.basicProfile.lastName.trim(),
        sex,
        role: "provider",
        marketing_name: payload.basicProfile.marketingName.trim(),
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: toSignupErrorMessage(authError?.message) },
        { status: 400 }
      );
    }

    if (!authData.user.email_confirmed_at) {
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(
        authData.user.id,
        {
          email_confirm: true,
        }
      );

      if (confirmError) {
        return NextResponse.json(
          { error: "Account created, but email confirmation setup failed." },
          { status: 500 }
        );
      }
    }

    const providerId = authData.user.id;
    const normalizedPhone = normalizePhone(
      payload.account.phoneCountryCode,
      payload.account.phoneNumber,
    );
    const phoneVerified = payload.verification.phoneOtp.join("") === "123456";
    const identityVerified = Boolean(
      payload.verification.documentType &&
        payload.verification.frontImageName &&
        payload.verification.backImageName,
    );

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: providerId,
        full_name: fullName,
        email: payload.account.email.trim().toLowerCase(),
        role: "provider",
        phone: normalizedPhone,
        status: "pending",
      }, { onConflict: "id" });

    if (profileError) {
      return NextResponse.json(
        { error: "Account created, but profile setup failed." },
        { status: 500 }
      );
    }

    const { error: providerProfileError } = await adminClient
      .from("provider_profiles")
      .upsert(
        {
          id: providerId,
          marketing_name: payload.basicProfile.marketingName.trim(),
          service_location:
            payload.providerLocation.areaLabel.trim() ||
            payload.basicProfile.serviceLocation.trim(),
          service_radius_km: payload.providerLocation.radius || payload.basicProfile.serviceRadius,
          date_of_birth: dateOfBirth,
          sex,
          residential_address: residentialAddress,
          profile_photo_url: profilePhotoUrl,
          bio: buildProviderBio(payload),
          approval_status: "pending",
          is_visible: false,
        },
        { onConflict: "id" },
      );

    if (providerProfileError) {
      return NextResponse.json(
        { error: "Account created, but provider profile setup failed." },
        { status: 500 }
      );
    }

    const { error: metadataError } = await adminClient
      .from("provider_admin_metadata")
      .upsert(
        {
          provider_id: providerId,
          availability_days: payload.availability.days,
          availability_time_preset: payload.availability.timePreset,
          availability_start_time: payload.availability.startTime,
          availability_end_time: payload.availability.endTime,
          service_image_captions: buildCaptionMap(payload, "imageCaptions"),
          certificate_image_captions: buildCaptionMap(payload, "certificateCaptions"),
          service_image_files: buildAssetMap(payload, "imageUrls"),
          certificate_image_files: buildAssetMap(payload, "certificateUrls"),
          emergency_contact: emergencyContact,
          profile_image_name: profileImageName,
          current_latitude: payload.providerLocation.latitude,
          current_longitude: payload.providerLocation.longitude,
        },
        { onConflict: "provider_id" },
      );

    if (metadataError) {
      return NextResponse.json(
        { error: "Account created, but provider admin metadata setup failed." },
        { status: 500 }
      );
    }

    const verificationResult = await upsertProviderVerification(
      adminClient,
      providerId,
      {
        phoneVerified,
        emailVerified: true,
        identityVerified,
        identityDocumentType: normalizeOptionalText(payload.verification.documentType),
        frontImageName: normalizeOptionalText(payload.verification.frontImageName),
        backImageName: normalizeOptionalText(payload.verification.backImageName),
        frontImageUrl: verificationFrontImageUrl,
        backImageUrl: verificationBackImageUrl,
      },
    );

    if (verificationResult.error) {
      return NextResponse.json(
        { error: "Account created, but provider verification setup failed." },
        { status: 500 }
      );
    }

    const providerDocumentRows = buildProviderDocumentRows(
      providerId,
      payload,
      verificationFrontImageUrl,
      verificationBackImageUrl,
    );

    if (providerDocumentRows.length > 0) {
      const { error: providerDocumentsError } = await adminClient
        .from("provider_documents")
        .insert(providerDocumentRows);

      if (providerDocumentsError) {
        return NextResponse.json(
          { error: "Account created, but provider documents setup failed." },
          { status: 500 }
        );
      }
    }

    const providerServicesPayload = payload.selectedServices.map((service) => {
      const details = payload.serviceDetails[service];

      return {
        provider_id: providerId,
        service_type: toServiceType(service),
        years_experience: details.yearsExperience,
        hourly_rate: Number(details.hourlyRate || 0),
        daily_rate: Number(details.dailyRate || 0),
      };
    });

    const { data: insertedServices, error: providerServicesError } = await adminClient
      .from("provider_services")
      .insert(providerServicesPayload)
      .select("id, service_type");

    if (providerServicesError) {
      return NextResponse.json(
        { error: "Account created, but provider services setup failed." },
        { status: 500 }
      );
    }

    const serviceIdByType = new Map(
      (insertedServices ?? []).map((row) => [row.service_type, row.id] as const),
    );

    const specialtyPayload = payload.selectedServices.flatMap((service) => {
      const serviceType = toServiceType(service);
      const providerServiceId = serviceIdByType.get(serviceType);

      if (!providerServiceId) {
        return [];
      }

      return payload.serviceDetails[service].specialties
        .filter((specialty) => specialty.trim().length > 0)
        .map((specialty) => ({
          provider_service_id: providerServiceId,
          specialty,
        }));
    });

    if (specialtyPayload.length > 0) {
      const { error: specialtiesError } = await adminClient
        .from("provider_service_specialties")
        .insert(specialtyPayload);

      if (specialtiesError) {
        return NextResponse.json(
          { error: "Account created, but provider specialties setup failed." },
          { status: 500 }
        );
      }
    }

    const record = await createProviderRegistration(payload, providerId, {
      phoneVerified,
      emailVerified: true,
      identityVerified,
    });

    return NextResponse.json({
      id: record.id,
      status: record.status,
      phoneVerified: record.phoneVerified,
      emailVerified: record.emailVerified,
      identityVerified: record.identityVerified,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to submit provider registration.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
