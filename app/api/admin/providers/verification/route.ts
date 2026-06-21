import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAppBaseUrl, getSupabaseServiceKey, getSupabaseUrl } from "@/lib/supabase-env";

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

function buildAdminSupabaseClient() {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

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

async function verifyAdminRequest(request: Request) {
  const adminClient = buildAdminSupabaseClient();

  if (!adminClient) {
    return {
      error: NextResponse.json({ error: "Supabase admin credentials are missing." }, { status: 500, headers: corsHeaders(request.headers.get("origin")) }),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return {
      error: NextResponse.json({ error: "Missing auth token." }, { status: 401, headers: corsHeaders(request.headers.get("origin")) }),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: "Invalid admin session." }, { status: 401, headers: corsHeaders(request.headers.get("origin")) }),
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
      error: NextResponse.json({ error: "This account is not allowed to manage providers." }, { status: 403, headers: corsHeaders(request.headers.get("origin")) }),
    };
  }

  return { adminClient, adminProfile };
}

async function sendApprovalEmail(adminClient: NonNullable<ReturnType<typeof buildAdminSupabaseClient>>, providerId: string) {
  const resendApiKey = process.env.RESEND_API_KEY ?? process.env.EMAIL_API_KEY ?? "";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ??
    process.env.EMAIL_FROM_ADDRESS ??
    "DELLA <noreply@dellaapp.com>";

  if (!resendApiKey.trim()) {
    return { warning: "Provider approved, but RESEND_API_KEY is missing so the email was not sent." };
  }

  const [{ data: providerAccount }, { data: providerProfile }] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", providerId)
      .maybeSingle(),
    adminClient
      .from("provider_profiles")
      .select("marketing_name")
      .eq("id", providerId)
      .maybeSingle(),
  ]);

  const account = providerAccount as ProviderContactRow | null;
  const profile = providerProfile as ProviderProfileRow | null;

  if (!account?.email?.trim()) {
    return { warning: "Provider approved, but no provider email was found." };
  }

  const providerName =
    profile?.marketing_name?.trim() ||
    account.full_name?.trim() ||
    account.email.split("@")[0] ||
    "Provider";

  const appBaseUrl = getAppBaseUrl() ?? "https://app.dellaapp.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [account.email.trim()],
      subject: "Your DELLA provider listing is approved",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2 style="margin-bottom:12px;color:#16a34a">Your provider listing is now approved</h2>
          <p>Hi ${providerName},</p>
          <p>Your DELLA service provider profile has been approved and is now visible to customers.</p>
          <p>You can now receive bookings. Keep the app on and stay available for more job requests.</p>
          <p>
            <a href="${appBaseUrl}/login" style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600">
              Open DELLA app
            </a>
          </p>
          <p>Customers can now find your profile and start booking your services.</p>
          <p>Thanks,<br />DELLA Team</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    return { warning: payload.message || payload.error || "Provider approved, but the approval email was not sent." };
  }

  return { warning: null };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = corsHeaders(request.headers.get("origin"));
  const verified = await verifyAdminRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const payload = (await request.json().catch(() => ({}))) as VerificationAction;
  const providerId = payload.providerId?.trim() ?? "";

  if (!providerId) {
    return NextResponse.json({ error: "providerId is required." }, { status: 400, headers });
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
        { onConflict: "provider_id" }
      );

    if (verificationError) {
      return NextResponse.json({ error: verificationError.message || "Unable to request provider documents." }, { status: 500, headers });
    }

    await adminClient.from("provider_profiles").update({ approval_status: "document_review", is_visible: false }).eq("id", providerId);
    await adminClient.from("profiles").update({ status: "pending" }).eq("id", providerId);

    return NextResponse.json({ success: true }, { headers });
  }

  if (payload.action === "set_visibility") {
    const active = Boolean(payload.active);

    const { error: profileError } = await adminClient
      .from("provider_profiles")
      .update({ is_visible: active })
      .eq("id", providerId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message || "Unable to update provider visibility." }, { status: 500, headers });
    }

    await adminClient.from("profiles").update({ status: active ? "active" : "paused" }).eq("id", providerId);

    return NextResponse.json({ success: true }, { headers });
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
      { onConflict: "provider_id" }
    );

  if (verificationError) {
    return NextResponse.json({ error: verificationError.message || "Unable to approve provider verification." }, { status: 500, headers });
  }

  const { error: profileError } = await adminClient
    .from("provider_profiles")
    .update({
      approval_status: "approved",
      is_visible: true,
    })
    .eq("id", providerId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message || "Unable to update provider approval." }, { status: 500, headers });
  }

  const { error: accountError } = await adminClient
    .from("profiles")
    .update({ status: "active" })
    .eq("id", providerId);

  if (accountError) {
    return NextResponse.json({ error: accountError.message || "Unable to activate provider account." }, { status: 500, headers });
  }

  const emailResult = await sendApprovalEmail(adminClient, providerId);
  return NextResponse.json({ success: true, warning: emailResult.warning }, { headers });
}
