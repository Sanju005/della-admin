import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAppBaseUrl, getSupabaseServiceKey, getSupabaseUrl } from "@/lib/supabase-env";

type ApprovalNotifyPayload = {
  providerId?: string;
};

function corsHeaders(origin?: string | null) {
  const allowedOrigin =
    origin && /^https:\/\/admin\.dellaapp\.com$/i.test(origin)
      ? origin
      : "https://admin.dellaapp.com";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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

async function sendApprovalEmail(to: string, providerName: string) {
  const resendApiKey = process.env.RESEND_API_KEY ?? process.env.EMAIL_API_KEY ?? "";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ??
    process.env.EMAIL_FROM_ADDRESS ??
    "DELLA <noreply@dellaapp.com>";
  const appBaseUrl = getAppBaseUrl() ?? "https://app.dellaapp.com";

  if (!resendApiKey.trim()) {
    return { error: "RESEND_API_KEY is missing on the app deployment." };
  }

  const subject = "Your DELLA provider listing is approved";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="margin-bottom:12px;color:#16a34a">Your provider listing is now approved</h2>
      <p>Hi ${providerName},</p>
      <p>Your DELLA service provider profile has been approved and is now visible to customers.</p>
      <p>You can now start receiving bookings. Keep the app on and stay available to catch more job requests.</p>
      <p>
        <a href="${appBaseUrl}/login" style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600">
          Open DELLA app
        </a>
      </p>
      <p>Customers can now find your profile in the marketplace and start booking your services.</p>
      <p>Thanks,<br />DELLA Team</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    return { error: payload.message || payload.error || "Unable to send approval email." };
  }

  return { error: null };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = corsHeaders(request.headers.get("origin"));
  const payload = (await request.json().catch(() => ({}))) as ApprovalNotifyPayload;
  const providerId = payload.providerId?.trim() ?? "";

  if (!providerId) {
    return NextResponse.json({ error: "providerId is required." }, { status: 400, headers });
  }

  const adminClient = buildAdminSupabaseClient();

  if (!adminClient) {
    return NextResponse.json({ error: "Supabase admin credentials are missing." }, { status: 500, headers });
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", providerId)
    .maybeSingle();

  if (profileError || !profile?.email?.trim()) {
    return NextResponse.json({ error: "Provider email could not be found." }, { status: 404, headers });
  }

  const { data: providerProfile } = await adminClient
    .from("provider_profiles")
    .select("marketing_name")
    .eq("id", providerId)
    .maybeSingle();

  const providerName =
    providerProfile?.marketing_name?.trim() ||
    profile.full_name?.trim() ||
    profile.email.split("@")[0] ||
    "Provider";

  const emailResult = await sendApprovalEmail(profile.email.trim(), providerName);

  if (emailResult.error) {
    return NextResponse.json({ error: emailResult.error }, { status: 500, headers });
  }

  return NextResponse.json({ success: true }, { headers });
}
