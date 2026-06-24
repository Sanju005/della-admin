import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceKey, getSupabaseUrl } from "@/lib/supabase-env";

const allowedAdminRoles = new Set(["super_admin", "admin", "manager", "customer_care", "customer_service"]);

type AdminProfileRow = {
  id: string;
  role: string | null;
};

type BookingRow = {
  id: string;
  customer_id: string;
  provider_id: string;
  booking_status: string | null;
  booking_mode: string | null;
  service_label: string | null;
  location_text: string | null;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  customer_note: string | null;
  provider_response_note: string | null;
  decline_reason: string | null;
  quoted_amount: number | null;
  created_at: string | null;
  accepted_at?: string | null;
  on_the_way_at?: string | null;
  arrived_at?: string | null;
  completed_at?: string | null;
  paid_at?: string | null;
  review_requested_at?: string | null;
  reviewed_at?: string | null;
  cancelled_at?: string | null;
};

type PaymentRow = {
  id: string;
  amount: number | null;
  payment_method: string | null;
  payment_option: string | null;
  status: string | null;
  provider_net_amount: number | null;
  company_commission_amount: number | null;
  company_payment_status: string | null;
  created_at: string | null;
  customer_payment_proof_data_url?: string | null;
  customer_payment_proof_file_name?: string | null;
  customer_payment_proof_mime_type?: string | null;
  provider_company_payment_proof_data_url?: string | null;
  provider_company_payment_proof_file_name?: string | null;
  provider_company_payment_proof_mime_type?: string | null;
};

type ReviewRow = Record<string, unknown> & {
  id: string;
  rating?: number | null;
  comment?: string | null;
  created_at?: string | null;
};

type BookingMessageRow = {
  id: string;
  sender_id: string | null;
  sender_role: string | null;
  message_text: string | null;
  created_at: string | null;
};

type BookingStatusHistoryRow = {
  id: string;
  old_status: string | null;
  new_status: string | null;
  changed_by: string | null;
  changed_by_role: string | null;
  note: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

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

function toTitleCase(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Pending";
  }

  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "RM0.00";
  }

  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatSchedule(dateValue?: string | null, startTime?: string | null, endTime?: string | null) {
  if (!dateValue) {
    return "Schedule not available";
  }

  const start = new Date(`${dateValue}T${startTime ?? "09:00:00"}`);
  const end = endTime ? new Date(`${dateValue}T${endTime}`) : null;

  if (Number.isNaN(start.getTime())) {
    return "Schedule not available";
  }

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(start);

  const startLabel = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  }).format(start);

  if (!end || Number.isNaN(end.getTime())) {
    return `${dateLabel}, ${startLabel}`;
  }

  const endLabel = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  }).format(end);

  return `${dateLabel}, ${startLabel} - ${endLabel}`;
}

function compactId(value: string) {
  return value.startsWith("#") ? value : `#${value.slice(0, 8).toUpperCase()}`;
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function pickFirstText(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = normalizeOptionalText(row[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

async function verifyAdminRequest(request: Request) {
  const adminClient = buildAdminSupabaseClient();

  if (!adminClient) {
    return {
      error: NextResponse.json({ error: "Supabase admin credentials are missing." }, { status: 500 }),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return {
      error: NextResponse.json({ error: "Missing auth token." }, { status: 401 }),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: "Invalid admin session." }, { status: 401 }),
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
      error: NextResponse.json({ error: "This account is not allowed to view provider bookings." }, { status: 403 }),
    };
  }

  return { adminClient };
}

async function fetchProfileMap(adminClient: NonNullable<ReturnType<typeof buildAdminSupabaseClient>>, ids: Array<string | null | undefined>) {
  const uniqueIds = [...new Set(ids.filter((value): value is string => Boolean(value?.trim())))];

  if (!uniqueIds.length) {
    return new Map<string, string>();
  }

  const { data } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .in("id", uniqueIds);

  return new Map(
    ((data ?? []) as ProfileRow[]).map((row) => [
      row.id,
      row.full_name?.trim() || row.email?.split("@")[0]?.replace(/[._-]+/g, " ") || "User",
    ]),
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const verified = await verifyAdminRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const { adminClient } = verified;
  const params = await context.params;
  const bookingId = params.id?.trim();

  if (!bookingId) {
    return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
  }

  const { data: bookingData, error: bookingError } = await adminClient
    .from("bookings")
    .select("id, customer_id, provider_id, booking_status, booking_mode, service_label, location_text, scheduled_date, scheduled_start_time, scheduled_end_time, customer_note, provider_response_note, decline_reason, quoted_amount, created_at, accepted_at, on_the_way_at, arrived_at, completed_at, paid_at, review_requested_at, reviewed_at, cancelled_at")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !bookingData) {
    return NextResponse.json({ error: "Booking was not found." }, { status: 404 });
  }

  const booking = bookingData as BookingRow;

  const [paymentsResult, reviewsResult, messagesResult, historyResult, profileMap] = await Promise.all([
    adminClient
      .from("payments")
      .select("id, amount, payment_method, payment_option, status, provider_net_amount, company_commission_amount, company_payment_status, created_at, customer_payment_proof_data_url, customer_payment_proof_file_name, customer_payment_proof_mime_type, provider_company_payment_proof_data_url, provider_company_payment_proof_file_name, provider_company_payment_proof_mime_type")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false }),
    adminClient
      .from("reviews")
      .select("*")
      .eq("provider_id", booking.provider_id)
      .eq("customer_id", booking.customer_id)
      .order("created_at", { ascending: false })
      .limit(20),
    adminClient
      .from("booking_messages")
      .select("id, sender_id, sender_role, message_text, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true }),
    adminClient
      .from("booking_status_history")
      .select("id, old_status, new_status, changed_by, changed_by_role, note, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true }),
    fetchProfileMap(adminClient, [booking.customer_id, booking.provider_id]),
  ]);

  const messages = ((messagesResult.data ?? []) as BookingMessageRow[]).map((row) => ({
    id: row.id,
    sender: profileMap.get(row.sender_id ?? "") || toTitleCase(row.sender_role),
    senderRole: toTitleCase(row.sender_role),
    message: row.message_text?.trim() || "",
    createdAt: formatDateTime(row.created_at),
  }));

  const milestoneTimeline = [
    {
      id: "created",
      title: "Booking created",
      note: "Customer created the booking request.",
      time: formatDateTime(booking.created_at),
      status: "Created",
    },
    ...([
      booking.accepted_at ? { id: "accepted_at", title: "Accepted", note: booking.provider_response_note?.trim() || "Provider accepted the task.", time: formatDateTime(booking.accepted_at), status: "Accepted" } : null,
      booking.on_the_way_at ? { id: "on_the_way_at", title: "On the way", note: "Provider started travelling to the task location.", time: formatDateTime(booking.on_the_way_at), status: "On The Way" } : null,
      booking.arrived_at ? { id: "arrived_at", title: "Arrived", note: "Provider arrived on site.", time: formatDateTime(booking.arrived_at), status: "Arrived" } : null,
      booking.completed_at ? { id: "completed_at", title: "Completed", note: "Provider marked the task as completed.", time: formatDateTime(booking.completed_at), status: "Completed" } : null,
      booking.paid_at ? { id: "paid_at", title: "Payment done", note: "Payment was marked paid.", time: formatDateTime(booking.paid_at), status: "Paid" } : null,
      booking.review_requested_at ? { id: "review_requested_at", title: "Review requested", note: "Provider requested customer review.", time: formatDateTime(booking.review_requested_at), status: "Review Requested" } : null,
      booking.reviewed_at ? { id: "reviewed_at", title: "Reviewed", note: "Review flow was completed.", time: formatDateTime(booking.reviewed_at), status: "Reviewed" } : null,
      booking.cancelled_at ? { id: "cancelled_at", title: "Cancelled", note: booking.decline_reason?.trim() || "Booking was cancelled.", time: formatDateTime(booking.cancelled_at), status: "Cancelled" } : null,
    ].filter(Boolean) as Array<{ id: string; title: string; note: string; time: string; status: string }>),
  ];

  const statusHistory = ((historyResult.data ?? []) as BookingStatusHistoryRow[]).map((row) => ({
    id: row.id,
    fromStatus: toTitleCase(row.old_status),
    toStatus: toTitleCase(row.new_status),
    actor: profileMap.get(row.changed_by ?? "") || toTitleCase(row.changed_by_role),
    actorRole: toTitleCase(row.changed_by_role),
    note: row.note?.trim() || `${toTitleCase(row.changed_by_role)} updated the task status.`,
    time: formatDateTime(row.created_at),
  }));

  const images = ((paymentsResult.data ?? []) as PaymentRow[]).flatMap((row) => {
    const items = [];

    if (row.customer_payment_proof_data_url?.trim()) {
      items.push({
        id: `${row.id}-customer-proof`,
        label: "Customer payment proof",
        url: row.customer_payment_proof_data_url.trim(),
        fileName: row.customer_payment_proof_file_name?.trim() || undefined,
        mimeType: row.customer_payment_proof_mime_type?.trim() || undefined,
      });
    }

    if (row.provider_company_payment_proof_data_url?.trim()) {
      items.push({
        id: `${row.id}-provider-proof`,
        label: "Provider company payment proof",
        url: row.provider_company_payment_proof_data_url.trim(),
        fileName: row.provider_company_payment_proof_file_name?.trim() || undefined,
        mimeType: row.provider_company_payment_proof_mime_type?.trim() || undefined,
      });
    }

    return items;
  });

  const reviewRows = ((reviewsResult.data ?? []) as ReviewRow[])
    .filter((row) => {
      const bookingMatch = normalizeOptionalText(row.booking_id) === booking.id;
      if (bookingMatch) {
        return true;
      }

      return normalizeOptionalText(row.provider_id) === booking.provider_id &&
        normalizeOptionalText(row.customer_id) === booking.customer_id;
    })
    .map((row) => {
      const reviewerRole = pickFirstText(row, ["reviewer_role", "author_role", "created_by_role"]) ||
        (normalizeOptionalText(row.reviewer_id) === booking.customer_id ? "Customer" :
          normalizeOptionalText(row.reviewer_id) === booking.provider_id ? "Provider" :
          "Customer");
      const reviewerName = normalizeOptionalText(row.reviewer_id)
        ? profileMap.get(normalizeOptionalText(row.reviewer_id)) || reviewerRole
        : reviewerRole;
      const reviewFor = pickFirstText(row, ["reviewee_role", "target_role"]) ||
        (reviewerRole.toLowerCase() === "provider" ? "Customer" : "Provider");
      const reply = pickFirstText(row, ["reply", "provider_reply", "customer_reply", "admin_reply"]);

      return {
        id: String(row.id),
        reviewer: reviewerName,
        reviewFor: toTitleCase(reviewFor),
        reviewerRole: toTitleCase(reviewerRole),
        rating: Math.max(1, Math.min(5, Math.round(Number(row.rating ?? 0) || 0))),
        comment: normalizeOptionalText(row.comment) || "No review comment.",
        reply: reply || undefined,
        createdAt: formatDateTime(typeof row.created_at === "string" ? row.created_at : null),
      };
    });

  return NextResponse.json({
    detail: {
      bookingId: compactId(booking.id),
      rawBookingId: booking.id,
      service: booking.service_label?.trim() || "Service",
      customer: profileMap.get(booking.customer_id) || "Customer",
      provider: profileMap.get(booking.provider_id) || "Provider",
      status: toTitleCase(booking.booking_status),
      bookingMode: toTitleCase(booking.booking_mode),
      amount: formatCurrency(booking.quoted_amount ?? 0),
      schedule: formatSchedule(booking.scheduled_date, booking.scheduled_start_time, booking.scheduled_end_time),
      location: booking.location_text?.trim() || "Location not captured",
      createdAt: formatDateTime(booking.created_at),
      scheduledStart: formatDateTime(
        booking.scheduled_date && booking.scheduled_start_time
          ? `${booking.scheduled_date}T${booking.scheduled_start_time}`
          : null,
      ),
      scheduledEnd: formatDateTime(
        booking.scheduled_date && booking.scheduled_end_time
          ? `${booking.scheduled_date}T${booking.scheduled_end_time}`
          : null,
      ),
      notes: [
        { label: "Customer note", value: booking.customer_note?.trim() || "No customer note." },
        { label: "Provider response", value: booking.provider_response_note?.trim() || "No provider response note." },
        { label: "Decline / cancel note", value: booking.decline_reason?.trim() || "No decline or cancellation note." },
      ],
      timeline: milestoneTimeline,
      statusHistory,
      payments: ((paymentsResult.data ?? []) as PaymentRow[]).map((row) => ({
        id: compactId(row.id),
        amount: formatCurrency(row.amount ?? 0),
        method: row.payment_option?.trim() || row.payment_method?.trim() || "Payment",
        status: toTitleCase(row.status),
        providerNetAmount: formatCurrency(row.provider_net_amount ?? 0),
        companyCommissionAmount: formatCurrency(row.company_commission_amount ?? 0),
        companyStatus: toTitleCase(row.company_payment_status),
        createdAt: formatDateTime(row.created_at),
      })),
      reviews: reviewRows,
      messages,
      images,
    },
  });
}
