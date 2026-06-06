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

function buildProviderBio(payload: ProviderRegistrationData) {
  const specialties = payload.selectedServices
    .flatMap((service) => payload.serviceDetails[service].specialties)
    .filter(Boolean)
    .slice(0, 4);

  const services = payload.selectedServices.join(", ");
  const specialtyLabel = specialties.length > 0 ? ` Specialties: ${specialties.join(", ")}.` : "";

  return `Provider for ${services} in ${payload.basicProfile.serviceLocation}.${specialtyLabel}`;
}

async function upsertProviderVerification(
  adminClient: ReturnType<typeof getAdminSupabaseClient>,
  providerId: string,
  phoneVerified: boolean,
  emailVerified: boolean,
  identityVerified: boolean,
) {
  if (!adminClient) {
    return { error: { message: "Supabase is not configured yet." } };
  }

  const payload = {
    phone_verified: phoneVerified,
    email_verified: emailVerified,
    identity_verified: identityVerified,
    kyc_verified: identityVerified,
    background_check_verified: false,
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
    return byProviderId;
  }

  return adminClient
    .from("provider_verifications")
    .upsert(
      {
        id: providerId,
        ...payload,
      },
      { onConflict: "id" },
    );
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ProviderRegistrationData;

    if (!payload.basicProfile.fullName || !payload.account.email) {
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
        full_name: payload.basicProfile.fullName.trim(),
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
        full_name: payload.basicProfile.fullName.trim(),
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
          service_radius_km: payload.providerLocation.radius,
          bio: buildProviderBio(payload),
          approval_status: "pending",
          is_visible: true,
        },
        { onConflict: "id" },
      );

    if (providerProfileError) {
      return NextResponse.json(
        { error: "Account created, but provider profile setup failed." },
        { status: 500 }
      );
    }

    const verificationResult = await upsertProviderVerification(
      adminClient,
      providerId,
      phoneVerified,
      true,
      identityVerified,
    );

    if (verificationResult.error) {
      return NextResponse.json(
        { error: "Account created, but provider verification setup failed." },
        { status: 500 }
      );
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
