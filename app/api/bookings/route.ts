import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import type { Booking } from "@/lib/profile-types";
import { buildProviderPortraitSrc, type ProviderCategoryKey } from "@/lib/provider-catalog";
import {
  getSupabaseServiceKey,
  getSupabaseUrl,
} from "@/lib/supabase-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BookingBody = {
  providerId?: string;
  providerName?: string;
  serviceKey?: string;
  serviceLabel?: string;
  location?: string;
  bookingMode?: "hourly" | "daily";
  dateLabel?: string;
  startTimeLabel?: string;
  endTimeLabel?: string;
  timeLabel?: string;
  durationHours?: number;
  notes?: string;
  hourlyRate?: number;
  dailyRate?: number;
  totalAmount?: number;
};

type CompleteBookingBody = {
  providerId: string;
  providerName: string;
  serviceKey: string;
  serviceLabel: string;
  location: string;
  bookingMode: "hourly" | "daily";
  dateLabel: string;
  startTimeLabel: string;
  endTimeLabel: string;
  timeLabel: string;
  durationHours: number;
  notes: string;
  hourlyRate: number;
  dailyRate: number;
  totalAmount: number;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type ProviderProfileRow = {
  id: string;
  marketing_name: string | null;
};

type BookingRow = {
  id: string;
  provider_id: string;
  service_key: string;
  service_label: string;
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
  decline_reason: string | null;
  quoted_amount: number | null;
  created_at: string;
};

type ProviderServiceRow = {
  id: string;
  service_type: string | null;
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

function isValidBody(value: BookingBody): value is CompleteBookingBody {
  return (
    typeof value.providerId === "string" &&
    typeof value.providerName === "string" &&
    typeof value.serviceKey === "string" &&
    typeof value.serviceLabel === "string" &&
    typeof value.location === "string" &&
    (value.bookingMode === "hourly" || value.bookingMode === "daily") &&
    typeof value.dateLabel === "string" &&
    typeof value.startTimeLabel === "string" &&
    typeof value.endTimeLabel === "string" &&
    typeof value.timeLabel === "string" &&
    typeof value.durationHours === "number" &&
    typeof value.notes === "string" &&
    typeof value.hourlyRate === "number" &&
    typeof value.dailyRate === "number" &&
    typeof value.totalAmount === "number"
  );
}

async function verifyCustomerRequest(request: Request) {
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
        { error: "Customer profile was not found." },
        { status: 404 }
      ),
    };
  }

  if ((profile as ProfileRow).role === "provider") {
    return {
      error: NextResponse.json(
        { error: "This account is a provider account." },
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

function parseDateLabel(value: string) {
  const parts = value.split(",").map((part) => part.trim());
  const datePart = parts.length >= 2 ? parts.slice(1).join(", ") : value.trim();
  const parsed = new Date(datePart);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTimeLabel(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  let hour24 = hour % 12;

  if (period === "PM") {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
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

  return {
    schedule: `${dateLabel}, ${formatTime(start)} - ${formatTime(end)}`,
    timeOnly: `${formatTime(start)} - ${formatTime(end)}`,
  };
}

function isProviderCategoryKey(value: string): value is ProviderCategoryKey {
  return [
    "chef",
    "maid",
    "babysitter",
    "driver",
    "cleaner",
    "tutor",
    "plumber",
    "electrician",
  ].includes(value);
}

function userStatusLabel(status: BookingRow["booking_status"]) {
  switch (status) {
    case "pending":
      return "Request Sent";
    case "accepted":
      return "Confirmed";
    case "on_the_way":
      return "On the Way";
    case "arrived":
      return "Arrived";
    case "completed":
      return "Task Completed";
    case "paid":
      return "Paid";
    case "review_requested":
      return "Review";
    case "reviewed":
      return "Reviewed";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
  }
}

function toBookingTab(status: BookingRow["booking_status"]): Booking["status"] {
  if (status === "declined" || status === "cancelled") {
    return "cancelled";
  }

  if (status === "completed" || status === "paid" || status === "review_requested" || status === "reviewed") {
    return "completed";
  }

  return "upcoming";
}

function toBadgeTone(status: BookingRow["booking_status"]): Booking["badgeTone"] {
  if (status === "declined" || status === "cancelled") {
    return "slate";
  }

  if (status === "pending") {
    return "amber";
  }

  return "green";
}

function buildUserActivitySteps(status: BookingRow["booking_status"]): Booking["activitySteps"] {
  const stepOrder: string[] = [
    "pending",
    "accepted",
    "on_the_way",
    "arrived",
    "completed",
    "paid",
    "review_requested",
  ] as const;

  const labels = [
    "Request Sent",
    "Confirmed",
    "On the Way",
    "Arrived",
    "Task Completed",
    "Paid",
    "Review",
  ];

  const currentIndex = stepOrder.indexOf(
    status === "reviewed" ? "review_requested" : status
  );

  return labels.map((label, index) => ({
    label,
    status:
      currentIndex === -1
        ? index === 0
          ? "current"
          : "pending"
        : index < currentIndex
          ? "done"
          : index === currentIndex
            ? status === "reviewed" && label === "Review"
              ? "done"
              : "current"
            : "pending",
  }));
}

function mapLiveBookingToUi(
  row: BookingRow,
  providerName: string
): Booking {
  const scheduleParts = formatDateTimeLabel(
    row.scheduled_date,
    row.scheduled_start_time,
    row.scheduled_end_time
  );

  const serviceKey = isProviderCategoryKey(row.service_key)
    ? row.service_key
    : "cleaner";

  return {
    id: row.id,
    service: `${row.service_label} Service`,
    provider: providerName,
    schedule: scheduleParts.schedule,
    location: row.location_text,
    status: toBookingTab(row.booking_status),
    statusLabel: userStatusLabel(row.booking_status),
    badgeTone: toBadgeTone(row.booking_status),
    thumbnail:
      serviceKey === "chef"
        ? "food"
        : serviceKey === "driver" || serviceKey === "plumber"
          ? "car"
          : "cleaning",
    imageSrc: buildProviderPortraitSrc({
      name: providerName,
      serviceKey,
    }),
    paymentAmount: Number(row.quoted_amount ?? 0),
    paymentMethod:
      row.booking_status === "paid" || row.booking_status === "review_requested" || row.booking_status === "reviewed"
        ? "Card / FPX"
        : "Not paid yet",
    notes: row.customer_note ?? "",
    cancelledBy: row.booking_status === "declined" ? "Service provider" : "User",
    cancellationReason: row.decline_reason ?? "",
    activitySteps: buildUserActivitySteps(row.booking_status),
  };
}

async function loadProviderNames(
  adminClient: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  providerIds: string[]
) {
  if (providerIds.length === 0) {
    return new Map<string, string>();
  }

  const { data } = await adminClient
    .from("provider_profiles")
    .select("id, marketing_name")
    .in("id", providerIds);

  return new Map(
    ((data ?? []) as ProviderProfileRow[]).map((row) => [
      row.id,
      row.marketing_name?.trim() || "DELLA Provider",
    ])
  );
}

export async function GET(request: Request) {
  const verified = await verifyCustomerRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const { data, error } = await verified.adminClient
    .from("bookings")
    .select(`
      id,
      provider_id,
      service_key,
      service_label,
      location_text,
      booking_mode,
      booking_status,
      scheduled_date,
      scheduled_start_time,
      scheduled_end_time,
      customer_note,
      decline_reason,
      quoted_amount,
      created_at
    `)
    .eq("customer_id", verified.profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load bookings." },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as BookingRow[];
  const providerNames = await loadProviderNames(
    verified.adminClient,
    [...new Set(rows.map((row) => row.provider_id))]
  );

  return NextResponse.json({
    bookings: rows.map((row) =>
      mapLiveBookingToUi(
        row,
        providerNames.get(row.provider_id) || "DELLA Provider"
      )
    ),
  });
}

export async function POST(request: Request) {
  const verified = await verifyCustomerRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const payload = (await request.json()) as BookingBody;

  if (!isValidBody(payload)) {
    return NextResponse.json(
      { error: "Booking request is missing required fields." },
      { status: 400 }
    );
  }

  const scheduledDate = parseDateLabel(payload.dateLabel);
  const scheduledStartTime = parseTimeLabel(payload.startTimeLabel);
  const scheduledEndTime = parseTimeLabel(payload.endTimeLabel);

  if (!scheduledDate || !scheduledStartTime || !scheduledEndTime) {
    return NextResponse.json(
      { error: "Booking date or time format is invalid." },
      { status: 400 }
    );
  }

  const { data: providerService } = await verified.adminClient
    .from("provider_services")
    .select("id, service_type")
    .eq("provider_id", payload.providerId)
    .eq("service_type", payload.serviceKey)
    .maybeSingle();

  const providerServiceRow = providerService as ProviderServiceRow | null;

  const { data: insertedBooking, error: bookingError } = await verified.adminClient
    .from("bookings")
    .insert({
      customer_id: verified.profile.id,
      provider_id: payload.providerId,
      provider_service_id: providerServiceRow?.id ?? null,
      booking_status: "pending",
      booking_mode: payload.bookingMode,
      service_key: payload.serviceKey,
      service_label: payload.serviceLabel,
      location_text: payload.location,
      scheduled_date: scheduledDate,
      scheduled_start_time: scheduledStartTime,
      scheduled_end_time: scheduledEndTime,
      duration_hours: payload.durationHours,
      customer_note: payload.notes,
      hourly_rate: payload.hourlyRate,
      daily_rate: payload.dailyRate,
      quoted_amount: payload.totalAmount,
    })
    .select(`
      id,
      provider_id,
      service_key,
      service_label,
      location_text,
      booking_mode,
      booking_status,
      scheduled_date,
      scheduled_start_time,
      scheduled_end_time,
      customer_note,
      decline_reason,
      quoted_amount,
      created_at
    `)
    .single();

  if (bookingError || !insertedBooking) {
    return NextResponse.json(
      { error: bookingError?.message || "Unable to create booking right now." },
      { status: 500 }
    );
  }

  if (payload.notes.trim()) {
    await verified.adminClient.from("booking_messages").insert({
      booking_id: insertedBooking.id,
      sender_id: verified.profile.id,
      sender_role: "customer",
      message_text: payload.notes.trim(),
    });
  }

  await verified.adminClient.from("notifications").insert({
    user_id: payload.providerId,
    booking_id: insertedBooking.id,
    notification_type: "booking_created",
    title: "New booking request",
    body: `${verified.profile.full_name?.trim() || "A customer"} requested ${payload.serviceLabel} service.`,
  });

  const booking = mapLiveBookingToUi(
    insertedBooking as BookingRow,
    payload.providerName
  );

  return NextResponse.json({ booking }, { status: 201 });
}
