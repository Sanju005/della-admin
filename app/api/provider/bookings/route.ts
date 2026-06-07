import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  getSupabaseServiceKey,
  getSupabaseUrl,
} from "@/lib/supabase-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type BookingRow = {
  id: string;
  customer_id: string;
  service_label: string;
  service_key: string;
  location_text: string;
  booking_mode: "hourly" | "daily";
  booking_status:
    | "pending"
    | "accepted"
    | "on_the_way"
    | "arrived"
    | "completed"
    | "paid"
    | "review_requested"
    | "reviewed"
    | "declined"
    | "cancelled";
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  customer_note: string | null;
  provider_response_note: string | null;
  decline_reason: string | null;
  quoted_amount: number | null;
  created_at: string;
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

async function verifyProviderRequest(request: Request) {
  const adminClient = getAdminSupabaseClient();

  if (!adminClient) {
    return {
      error: NextResponse.json(
        { error: "Supabase is not configured yet." },
        { status: 500 }
      ),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Missing auth token." },
        { status: 401 }
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
        { error: "Invalid session." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      error: NextResponse.json(
        { error: "Provider profile was not found." },
        { status: 404 }
      ),
    };
  }

  if ((profile as ProfileRow).role !== "provider") {
    return {
      error: NextResponse.json(
        { error: "This account is not a provider account." },
        { status: 403 }
      ),
    };
  }

  return {
    adminClient,
    authUser: user,
    profile: profile as ProfileRow,
  };
}

function formatDateTimeLabel(date: string, startTime: string, endTime: string) {
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);

  const dateLabel = new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(start);

  const formatTime = (value: Date) =>
    new Intl.DateTimeFormat("en-MY", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(value);

  return `${dateLabel}, ${formatTime(start)} - ${formatTime(end)}`;
}

function providerStatusLabel(status: BookingRow["booking_status"]) {
  switch (status) {
    case "pending":
      return "Awaiting Action";
    case "accepted":
      return "Accepted";
    case "on_the_way":
      return "On the Way";
    case "arrived":
      return "Arrived";
    case "completed":
      return "Task Completed";
    case "paid":
      return "Payment Done";
    case "review_requested":
      return "Request Review";
    case "reviewed":
      return "Reviewed";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
  }
}

function toBucket(status: BookingRow["booking_status"]) {
  if (status === "pending") {
    return "requests";
  }

  if (status === "declined" || status === "cancelled") {
    return "closed";
  }

  if (status === "reviewed") {
    return "closed";
  }

  if (
    status === "completed" ||
    status === "paid" ||
    status === "review_requested"
  ) {
    return "completed";
  }

  return "active";
}

async function loadCustomerNames(
  adminClient: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  customerIds: string[]
) {
  if (customerIds.length === 0) {
    return new Map<string, string>();
  }

  const { data } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .in("id", customerIds);

  return new Map(
    ((data ?? []) as Array<{ id: string; full_name: string | null }>).map((row) => [
      row.id,
      row.full_name?.trim() || "Customer",
    ])
  );
}

export async function GET(request: Request) {
  const verified = await verifyProviderRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const { data, error } = await verified.adminClient
    .from("bookings")
    .select(`
      id,
      customer_id,
      service_label,
      service_key,
      location_text,
      booking_mode,
      booking_status,
      scheduled_date,
      scheduled_start_time,
      scheduled_end_time,
      customer_note,
      provider_response_note,
      decline_reason,
      quoted_amount,
      created_at
    `)
    .eq("provider_id", verified.profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load provider bookings." },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as BookingRow[];
  const customerNames = await loadCustomerNames(
    verified.adminClient,
    [...new Set(rows.map((row) => row.customer_id))]
  );

  return NextResponse.json({
    bookings: rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      customerName: customerNames.get(row.customer_id) || "Customer",
      serviceLabel: row.service_label,
      serviceKey: row.service_key,
      location: row.location_text,
      bookingMode: row.booking_mode,
      bookingStatus: row.booking_status,
      statusLabel: providerStatusLabel(row.booking_status),
      bucket: toBucket(row.booking_status),
      schedule: formatDateTimeLabel(
        row.scheduled_date,
        row.scheduled_start_time,
        row.scheduled_end_time
      ),
      customerNote: row.customer_note ?? "",
      providerResponseNote: row.provider_response_note ?? "",
      declineReason: row.decline_reason ?? "",
      quotedAmount: Number(row.quoted_amount ?? 0),
      createdAt: row.created_at,
    })),
  });
}
