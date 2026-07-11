import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceKey, getSupabaseUrl } from "@/lib/supabase-env";

type SettlementAction = {
  action?: "mark_paid" | "mark_rejected";
  paymentId?: string;
};

type AdminProfileRow = {
  id: string;
  role: string | null;
};

const allowedAdminRoles = new Set(["super_admin", "admin", "manager", "customer_care"]);

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
      error: NextResponse.json(
        { error: "Supabase admin credentials are missing." },
        { status: 500, headers: corsHeaders(request.headers.get("origin")) }
      ),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Missing auth token." },
        { status: 401, headers: corsHeaders(request.headers.get("origin")) }
      ),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { error: "Invalid admin session." },
        { status: 401, headers: corsHeaders(request.headers.get("origin")) }
      ),
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
      error: NextResponse.json(
        { error: "This account is not allowed to manage cash settlements." },
        { status: 403, headers: corsHeaders(request.headers.get("origin")) }
      ),
    };
  }

  return { adminClient };
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

  const payload = (await request.json().catch(() => ({}))) as SettlementAction;
  const paymentId = payload.paymentId?.trim() ?? "";

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId is required." }, { status: 400, headers });
  }

  if (payload.action !== "mark_paid" && payload.action !== "mark_rejected") {
    return NextResponse.json({ error: "A valid action is required." }, { status: 400, headers });
  }

  const company_payment_status = payload.action === "mark_paid" ? "paid" : "rejected";
  const company_paid_at = payload.action === "mark_paid" ? new Date().toISOString() : null;

  const { data, error } = await verified.adminClient
    .from("payments")
    .update({
      company_payment_status,
      company_paid_at,
    })
    .eq("id", paymentId)
    .select("id, company_payment_status, company_paid_at")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Unable to update payment settlement status." },
      { status: 500, headers }
    );
  }

  return NextResponse.json(
    {
      success: true,
      payment: data,
    },
    { headers }
  );
}
