import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  getSupabaseServiceKey,
  getSupabaseUrl,
} from "@/lib/supabase-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReportPayload = {
  reportedUserId?: string | null;
  bookingId?: string | null;
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
};

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

async function verifyRequest(request: Request) {
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

  return { adminClient, user };
}

export async function GET(request: Request) {
  const verified = await verifyRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const { data, error } = await verified.adminClient
    .from("user_reports")
    .select("id, title, description, category, priority, status, booking_id, reported_user_id, created_at")
    .eq("reporter_id", verified.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message || "Unable to load reports." }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? [] });
}

export async function POST(request: Request) {
  const verified = await verifyRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const payload = (await request.json()) as ReportPayload;
  const title = payload.title?.trim() ?? "";

  if (!title) {
    return NextResponse.json({ error: "Report title is required." }, { status: 400 });
  }

  const { data, error } = await verified.adminClient
    .from("user_reports")
    .insert({
      reporter_id: verified.user.id,
      reported_user_id: payload.reportedUserId?.trim() || null,
      booking_id: payload.bookingId?.trim() || null,
      title,
      description: payload.description?.trim() || "",
      category: payload.category?.trim() || "general",
      priority: payload.priority?.trim() || "medium",
      status: "submitted",
    })
    .select("id, title, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || "Unable to submit report." }, { status: 500 });
  }

  return NextResponse.json({ report: data }, { status: 201 });
}
