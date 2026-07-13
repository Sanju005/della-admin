import { createClient } from "@supabase/supabase-js";

type AssetFetcher = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

export interface Env {
  ASSETS: AssetFetcher;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
}

type VerificationAction =
  | {
      action: "approve";
      providerId?: string;
      note?: string;
    }
  | {
      action: "request_documents";
      providerId?: string;
      note?: string;
      requestedDocuments?: string[];
    }
  | {
      action: "set_visibility";
      providerId?: string;
      active?: boolean;
    };

type PaymentSettlementAction = {
  action: "mark_paid" | "mark_rejected";
  paymentId?: string;
};

type AccountCreatePayload = {
  accountType?: "customer" | "provider";
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
  status?: string;
  dob?: string;
  gender?: string;
  city?: string;
  region?: string;
  country?: string;
  marketingName?: string;
  profilePhoto?: {
    fileName?: string;
    dataUrl?: string;
    caption?: string;
  };
  address?: string;
  bio?: string;
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
  identityDocumentType?: string;
  services?: Array<{
    serviceType?: string;
    serviceLocation?: string;
    serviceRadiusKm?: number;
    yearsExperience?: string;
    hourlyRate?: number;
    dailyRate?: number;
    workImages?: Array<{
      fileName?: string;
      dataUrl?: string;
      caption?: string;
    }>;
  }>;
  documents?: Array<{
    documentType?: string;
    label?: string;
    status?: string;
    file?: {
      fileName?: string;
      dataUrl?: string;
      caption?: string;
    };
  }>;
};

type AdminProfileRow = {
  id: string;
  role: string | null;
};

type ProviderContactRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type ProviderProfileRow = {
  marketing_name: string | null;
};

type PaymentSettlementRow = {
  id: string;
  company_payment_status: string | null;
  company_paid_at: string | null;
  provider_company_payment_proof_data_url: string | null;
  customer_payment_proof_data_url: string | null;
};

const allowedAdminRoles = new Set(["super_admin", "admin", "manager", "customer_care"]);
const approvalRequestOptions = [
  "IC / Passport / Driving License",
  "Proof of Address",
  "Professional Certificates",
  "Background Check",
];

function corsHeaders(origin?: string | null) {
  const allowedOrigin =
    origin && /^https:\/\/admin\.dellaapp\.com$/i.test(origin)
      ? origin
      : "https://admin.dellaapp.com";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data: unknown, init?: ResponseInit, origin?: string | null) {
  return Response.json(data, {
    ...init,
    headers: {
      ...corsHeaders(origin),
      ...(init?.headers ?? {}),
    },
  });
}

function buildAdminSupabaseClient(env: Env) {
  const url = env.SUPABASE_URL?.trim() || env.VITE_SUPABASE_URL?.trim() || "";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function splitPhoneNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      countryCode: null,
      phoneNumber: null,
    };
  }

  if (!trimmed.startsWith("+")) {
    return {
      countryCode: null,
      phoneNumber: trimmed,
    };
  }

  const match = trimmed.match(/^(\+\d+)\s*(.*)$/);

  return {
    countryCode: match?.[1] ?? null,
    phoneNumber: match?.[2]?.trim() || null,
  };
}

function splitFullName(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function normalizeServiceKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

async function verifyAdminRequest(request: Request, env: Env): Promise<VerifiedAdminRequest> {
  const adminClient = buildAdminSupabaseClient(env);
  const origin = request.headers.get("origin");

  if (!adminClient) {
    return {
      error: json({ error: "Worker env is missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 }, origin),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return {
      error: json({ error: "Missing auth token." }, { status: 401 }, origin),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user) {
    return {
      error: json({ error: "Invalid admin session." }, { status: 401 }, origin),
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const adminProfile = profile as AdminProfileRow | null;

  if (profileError || !adminProfile || !allowedAdminRoles.has((adminProfile.role ?? "").trim().toLowerCase())) {
    return {
      error: json({ error: "This account is not allowed to manage providers." }, { status: 403 }, origin),
    };
  }

  return { adminClient };
}

type VerifiedAdminRequest =
  | {
      adminClient: NonNullable<ReturnType<typeof buildAdminSupabaseClient>>;
    }
  | {
      error: Response;
    };

async function sendApprovalEmail(env: Env, provider: ProviderContactRow | null, profile: ProviderProfileRow | null) {
  const resendApiKey = env.RESEND_API_KEY?.trim() ?? "";
  const fromEmail = env.RESEND_FROM_EMAIL?.trim() || "DELLA <noreply@dellaapp.com>";

  if (!resendApiKey) {
    return { warning: "Provider approved, but RESEND_API_KEY is missing so the email was not sent." };
  }

  if (!provider?.email?.trim()) {
    return { warning: "Provider approved, but no provider email was found." };
  }

  const providerName =
    profile?.marketing_name?.trim() ||
    provider.full_name?.trim() ||
    provider.email.split("@")[0] ||
    "Provider";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [provider.email.trim()],
      subject: "Your DELLA provider listing is approved",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2 style="margin-bottom:12px;color:#16a34a">Your provider listing is now approved</h2>
          <p>Hi ${providerName},</p>
          <p>Your DELLA service provider profile has been approved and is now visible to customers.</p>
          <p>You can now receive bookings. Keep the app on and stay available for more job requests.</p>
          <p>Customers can now find your profile and start booking your services.</p>
          <p>Thanks,<br />DELLA Team</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    return {
      warning: payload.message || payload.error || "Provider approved, but the approval email was not sent.",
    };
  }

  return { warning: null };
}

async function handleProviderVerification(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, { status: 405 }, origin);
  }

  const verified = await verifyAdminRequest(request, env);
  if ("error" in verified) {
    return verified.error;
  }

  const payload = (await request.json().catch(() => ({}))) as VerificationAction;
  const providerId = payload.providerId?.trim() ?? "";

  if (!providerId) {
    return json({ error: "providerId is required." }, { status: 400 }, origin);
  }

  const { adminClient } = verified;
  const timestamp = new Date().toISOString();

  if (payload.action === "request_documents") {
    const cleanedDocuments = (payload.requestedDocuments ?? [])
      .map((value) => value.trim())
      .filter((value) => approvalRequestOptions.includes(value));

    const { error: verificationError } = await adminClient
      .from("provider_verifications")
      .upsert(
        {
          provider_id: providerId,
          requested_documents: cleanedDocuments,
          admin_note: payload.note?.trim() ?? "",
          last_reviewed_at: timestamp,
        },
        { onConflict: "provider_id" },
      );

    if (verificationError) {
      return json({ error: verificationError.message || "Unable to request provider documents." }, { status: 500 }, origin);
    }

    await adminClient
      .from("provider_profiles")
      .update({ approval_status: "document_review", is_visible: false })
      .eq("id", providerId);
    await adminClient.from("profiles").update({ status: "pending" }).eq("id", providerId);

    return json({ success: true }, undefined, origin);
  }

  if (payload.action === "set_visibility") {
    const active = Boolean(payload.active);

    const { error: profileError } = await adminClient
      .from("provider_profiles")
      .update({ is_visible: active })
      .eq("id", providerId);

    if (profileError) {
      return json({ error: profileError.message || "Unable to update provider visibility." }, { status: 500 }, origin);
    }

    await adminClient.from("profiles").update({ status: active ? "active" : "paused" }).eq("id", providerId);
    return json({ success: true }, undefined, origin);
  }

  const { error: verificationError } = await adminClient
    .from("provider_verifications")
    .upsert(
      {
        provider_id: providerId,
        identity_verified: true,
        kyc_verified: true,
        background_check_verified: true,
        requested_documents: [],
        admin_note: payload.note?.trim() ?? "",
        last_reviewed_at: timestamp,
      },
      { onConflict: "provider_id" },
    );

  if (verificationError) {
    return json({ error: verificationError.message || "Unable to approve provider verification." }, { status: 500 }, origin);
  }

  const { error: profileError } = await adminClient
    .from("provider_profiles")
    .update({
      approval_status: "approved",
      is_visible: true,
    })
    .eq("id", providerId);

  if (profileError) {
    return json({ error: profileError.message || "Unable to update provider approval." }, { status: 500 }, origin);
  }

  const { error: accountError } = await adminClient
    .from("profiles")
    .update({ status: "active" })
    .eq("id", providerId);

  if (accountError) {
    return json({ error: accountError.message || "Unable to activate provider account." }, { status: 500 }, origin);
  }

  const [{ data: providerAccount }, { data: providerProfile }] = await Promise.all([
    adminClient.from("profiles").select("id, full_name, email").eq("id", providerId).maybeSingle(),
    adminClient.from("provider_profiles").select("marketing_name").eq("id", providerId).maybeSingle(),
  ]);

  const emailResult = await sendApprovalEmail(
    env,
    (providerAccount as ProviderContactRow | null) ?? null,
    (providerProfile as ProviderProfileRow | null) ?? null,
  );

  return json({ success: true, warning: emailResult.warning }, undefined, origin);
}

async function handlePaymentSettlement(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, { status: 405 }, origin);
  }

  const verified = await verifyAdminRequest(request, env);
  if ("error" in verified) {
    return verified.error;
  }

  const payload = (await request.json().catch(() => ({}))) as PaymentSettlementAction;
  const paymentId = payload.paymentId?.trim() ?? "";

  if ((payload.action !== "mark_paid" && payload.action !== "mark_rejected") || !paymentId) {
    return json({ error: "A valid paymentId is required." }, { status: 400 }, origin);
  }

  const { adminClient } = verified;
  const { data: payment, error: paymentError } = await adminClient
    .from("payments")
    .select("id, company_payment_status, company_paid_at, provider_company_payment_proof_data_url, customer_payment_proof_data_url")
    .eq("id", paymentId)
    .maybeSingle();

  const paymentRow = (payment as PaymentSettlementRow | null) ?? null;

  if (paymentError || !paymentRow) {
    return json({ error: "Payment record was not found." }, { status: 404 }, origin);
  }

  const hasSettlementProof =
    Boolean(paymentRow.provider_company_payment_proof_data_url?.trim()) ||
    Boolean(paymentRow.customer_payment_proof_data_url?.trim());

  if (payload.action === "mark_paid" && !hasSettlementProof) {
    return json({ error: "Provider payment slip is missing for this payment." }, { status: 400 }, origin);
  }

  const nextStatus = payload.action === "mark_paid" ? "paid" : "rejected";
  const alreadyInTargetStatus = (paymentRow.company_payment_status ?? "").trim().toLowerCase() === nextStatus;
  if (alreadyInTargetStatus) {
    return json({
      success: true,
      payment: {
        id: paymentRow.id,
        company_payment_status: paymentRow.company_payment_status,
        company_paid_at: paymentRow.company_paid_at,
      },
    }, undefined, origin);
  }

  const approvedAt = payload.action === "mark_paid" ? new Date().toISOString() : null;
  const { data: updatedPayment, error: updateError } = await adminClient
    .from("payments")
    .update({
      company_payment_status: nextStatus,
      company_paid_at: approvedAt,
    })
    .eq("id", paymentId)
    .select("id, company_payment_status, company_paid_at")
    .maybeSingle();

  if (updateError || !updatedPayment) {
    return json({ error: updateError?.message || "Unable to approve provider commission payment." }, { status: 500 }, origin);
  }

  return json({
    success: true,
    payment: updatedPayment,
  }, undefined, origin);
}

async function handleAccountCreate(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, { status: 405 }, origin);
  }

  const verified = await verifyAdminRequest(request, env);
  if ("error" in verified) {
    return verified.error;
  }

  const payload = (await request.json().catch(() => ({}))) as AccountCreatePayload;
  const accountType = payload.accountType === "provider" ? "provider" : payload.accountType === "customer" ? "customer" : "";
  const fullName = payload.fullName?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password?.trim() ?? "";
  const phone = payload.phone?.trim() ?? "";

  if (!accountType || !fullName || !email || !password) {
    return json({ error: "accountType, fullName, email, and password are required." }, { status: 400 }, origin);
  }

  const { adminClient } = verified;
  const { data: createdUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: accountType === "provider" ? "service_provider" : "customer",
    },
  });

  if (authError || !createdUser.user) {
    return json({ error: authError?.message || "Unable to create auth account." }, { status: 400 }, origin);
  }

  const userId = createdUser.user.id;
  const normalizedStatus = payload.status?.trim() || (accountType === "provider" ? "pending" : "active");
  const normalizedCountry = payload.country?.trim() || "Malaysia";
  const { countryCode, phoneNumber } = splitPhoneNumber(phone);
  const { firstName, lastName } = splitFullName(fullName);

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    email,
    phone: phone || null,
    role: accountType === "provider" ? "service_provider" : "customer",
    status: normalizedStatus,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    return json({ error: profileError.message || "Unable to create profile record." }, { status: 500 }, origin);
  }

  if (accountType === "customer") {
    const { error: customerError } = await adminClient.from("customer_profiles").upsert({
      id: userId,
      first_name: firstName || null,
      last_name: lastName || null,
      date_of_birth: payload.dob?.trim() || null,
      phone_number: phoneNumber,
      country_code: countryCode,
      city: payload.city?.trim() || null,
      region: payload.region?.trim() || null,
      country: normalizedCountry,
      verified: normalizedStatus.toLowerCase() === "active",
    });

    if (customerError) {
      await adminClient.auth.admin.deleteUser(userId);
      return json({ error: customerError.message || "Unable to create customer profile." }, { status: 500 }, origin);
    }
  } else {
    const providerVisible = Boolean(payload.visible);
    const approvalStatus = payload.approvalStatus?.trim() || "pending";
    const normalizedServices = (payload.services ?? [])
      .map((service) => ({
        serviceType: service.serviceType?.trim() || "",
        serviceLocation: service.serviceLocation?.trim() || "",
        serviceRadiusKm:
          typeof service.serviceRadiusKm === "number" && Number.isFinite(service.serviceRadiusKm)
            ? service.serviceRadiusKm
            : null,
        yearsExperience: service.yearsExperience?.trim() || "",
        hourlyRate:
          typeof service.hourlyRate === "number" && Number.isFinite(service.hourlyRate)
            ? service.hourlyRate
            : null,
        dailyRate:
          typeof service.dailyRate === "number" && Number.isFinite(service.dailyRate)
            ? service.dailyRate
            : null,
        workImages: (service.workImages ?? []).filter((item) => item.dataUrl?.trim()),
      }))
      .filter((service) => service.serviceType);
    const primaryService = normalizedServices[0] ?? null;
    const serviceLocation = primaryService?.serviceLocation || payload.city?.trim() || null;
    const serviceRadiusKm = primaryService?.serviceRadiusKm ?? null;

    const { error: providerProfileError } = await adminClient.from("provider_profiles").upsert({
      id: userId,
      marketing_name: payload.marketingName?.trim() || fullName,
      profile_photo_url: payload.profilePhoto?.dataUrl?.trim() || null,
      service_location: serviceLocation,
      service_radius_km: serviceRadiusKm,
      date_of_birth: payload.dob?.trim() || null,
      sex: payload.gender?.trim() || null,
      residential_address: payload.address?.trim() || null,
      bio: payload.bio?.trim() || null,
      approval_status: approvalStatus,
      is_visible: providerVisible,
    });

    if (providerProfileError) {
      await adminClient.auth.admin.deleteUser(userId);
      return json({ error: providerProfileError.message || "Unable to create provider profile." }, { status: 500 }, origin);
    }

    if (normalizedServices.length) {
      const { error: serviceError } = await adminClient.from("provider_services").insert(
        normalizedServices.map((service) => ({
          provider_id: userId,
          service_type: service.serviceType,
          years_experience: service.yearsExperience || null,
          hourly_rate: service.hourlyRate,
          daily_rate: service.dailyRate,
        })),
      );

      if (serviceError) {
        await adminClient.auth.admin.deleteUser(userId);
        return json({ error: serviceError.message || "Unable to create provider service." }, { status: 500 }, origin);
      }
    }

    const { error: verificationError } = await adminClient.from("provider_verifications").upsert({
      provider_id: userId,
      phone_verified: Boolean(payload.phoneVerified),
      email_verified: Boolean(payload.emailVerified),
      identity_verified: Boolean(payload.identityVerified),
      kyc_verified: Boolean(payload.kycVerified),
      background_check_verified: Boolean(payload.backgroundCheckVerified),
      document_type: payload.identityDocumentType?.trim() || null,
      front_image_name: payload.documents?.[0]?.file?.fileName?.trim() || null,
      back_image_name: payload.documents?.[1]?.file?.fileName?.trim() || null,
      requested_documents: [],
      admin_note: "",
    });

    if (verificationError) {
      await adminClient.auth.admin.deleteUser(userId);
      return json({ error: verificationError.message || "Unable to create provider verification." }, { status: 500 }, origin);
    }

    const serviceImageFiles = Object.fromEntries(
      normalizedServices.map((service) => [
        normalizeServiceKey(service.serviceType),
        service.workImages.map((item) => item.dataUrl?.trim() || "").filter(Boolean),
      ]),
    );
    const serviceImageCaptions = Object.fromEntries(
      normalizedServices.map((service) => [
        normalizeServiceKey(service.serviceType),
        service.workImages.map((item) => item.caption?.trim() || item.fileName?.trim() || "Work image").filter(Boolean),
      ]),
    );

    const { error: metadataError } = await adminClient.from("provider_admin_metadata").upsert({
      provider_id: userId,
      availability_days: (payload.availabilityDays ?? []).map((value) => value.trim()).filter(Boolean),
      availability_time_preset: payload.availabilityPreset?.trim() || null,
      availability_start_time: payload.availabilityStartTime?.trim() || null,
      availability_end_time: payload.availabilityEndTime?.trim() || null,
      service_image_files: Object.keys(serviceImageFiles).length ? serviceImageFiles : null,
      service_image_captions: Object.keys(serviceImageCaptions).length ? serviceImageCaptions : null,
    });

    if (metadataError) {
      await adminClient.auth.admin.deleteUser(userId);
      return json({ error: metadataError.message || "Unable to create provider availability." }, { status: 500 }, origin);
    }

    const normalizedDocuments = (payload.documents ?? [])
      .filter((document) => document.documentType?.trim() && document.file?.dataUrl?.trim())
      .map((document) => ({
        provider_id: userId,
        document_type: document.documentType?.trim() || "identity_document",
        label: document.label?.trim() || "Identity Document",
        file_url: document.file?.dataUrl?.trim() || null,
        notes: document.file?.caption?.trim() || null,
        status: document.status?.trim() || "Pending",
      }));

    if (normalizedDocuments.length) {
      const { error: documentError } = await adminClient.from("provider_documents").insert(normalizedDocuments);

      if (documentError) {
        await adminClient.auth.admin.deleteUser(userId);
        return json({ error: documentError.message || "Unable to create provider documents." }, { status: 500 }, origin);
      }
    }
  }

  return json({ success: true, userId }, { status: 201 }, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/admin/providers/verification") {
      return handleProviderVerification(request, env);
    }

    if (url.pathname === "/api/admin/payments/settlement") {
      return handlePaymentSettlement(request, env);
    }

    if (url.pathname === "/api/admin/accounts/create") {
      return handleAccountCreate(request, env);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;
    const isAssetRequest =
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/favicon") ||
      /\.[a-z0-9]+$/i.test(url.pathname);

    if (
      request.method === "GET" &&
      assetResponse.status === 404 &&
      acceptsHtml &&
      !isAssetRequest &&
      !url.pathname.startsWith("/api/")
    ) {
      const indexRequest = new Request(new URL("/index.html", url.origin), request);
      return env.ASSETS.fetch(indexRequest);
    }

    return assetResponse;
  },
};
