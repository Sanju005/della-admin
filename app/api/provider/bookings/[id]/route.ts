import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { sendPushNotificationToUser } from "@/lib/push-notifications";
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

type BookingStatus =
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

type UpdatePayload = {
  status?: BookingStatus;
  note?: string;
};

type BookingOwnerRow = {
  id: string;
  customer_id: string;
  provider_id: string;
  booking_status: BookingStatus;
  service_label: string;
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

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  pending: ["accepted", "declined", "cancelled"],
  accepted: ["on_the_way", "cancelled"],
  on_the_way: ["arrived", "cancelled"],
  arrived: ["completed", "cancelled"],
  completed: ["paid"],
  paid: ["review_requested"],
  review_requested: [],
  reviewed: [],
  declined: [],
  cancelled: [],
};

function notificationTypeForStatus(status: BookingStatus) {
  switch (status) {
    case "accepted":
      return "booking_accepted";
    case "declined":
      return "booking_declined";
    case "on_the_way":
      return "provider_on_the_way";
    case "arrived":
      return "provider_arrived";
    case "completed":
      return "task_completed";
    case "paid":
      return "payment_done";
    case "review_requested":
      return "review_requested";
    case "cancelled":
      return "booking_cancelled";
    default:
      return null;
  }
}

function notificationContent(status: BookingStatus, serviceLabel: string, note: string) {
  switch (status) {
    case "accepted":
      return {
        title: "Booking confirmed",
        body: `Your ${serviceLabel} booking was accepted.${note ? ` Note: ${note}` : ""}`,
      };
    case "declined":
      return {
        title: "Booking declined",
        body: `Your ${serviceLabel} booking was declined.${note ? ` Reason: ${note}` : ""}`,
      };
    case "on_the_way":
      return {
        title: "Provider on the way",
        body: `Your ${serviceLabel} provider is on the way.`,
      };
    case "arrived":
      return {
        title: "Provider arrived",
        body: `Your ${serviceLabel} provider has arrived.`,
      };
    case "completed":
      return {
        title: "Task completed",
        body: `Your ${serviceLabel} task was marked completed.`,
      };
    case "paid":
      return {
        title: "Payment done",
        body: `Payment was marked complete for your ${serviceLabel} booking.`,
      };
    case "review_requested":
      return {
        title: "Review requested",
        body: `Please review your ${serviceLabel} booking.`,
      };
    case "cancelled":
      return {
        title: "Booking cancelled",
        body: `Your ${serviceLabel} booking was cancelled.`,
      };
    default:
      return null;
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const verified = await verifyProviderRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const params = await context.params;
  const payload = (await request.json()) as UpdatePayload;
  const nextStatus = payload.status;
  const note = payload.note?.trim() ?? "";

  if (!nextStatus) {
    return NextResponse.json(
      { error: "Booking status is required." },
      { status: 400 }
    );
  }

  const { data: booking, error: bookingError } = await verified.adminClient
    .from("bookings")
    .select("id, customer_id, provider_id, booking_status, service_label")
    .eq("id", params.id)
    .eq("provider_id", verified.profile.id)
    .maybeSingle();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "Booking was not found." },
      { status: 404 }
    );
  }

  const current = booking as BookingOwnerRow;

  if (!allowedTransitions[current.booking_status].includes(nextStatus)) {
    return NextResponse.json(
      { error: `Cannot move booking from ${current.booking_status} to ${nextStatus}.` },
      { status: 400 }
    );
  }

  const updatePayload: Record<string, string | BookingStatus> = {
    booking_status: nextStatus,
  };

  if (nextStatus === "accepted") {
    updatePayload.accepted_at = new Date().toISOString();
    updatePayload.provider_response_note = note;
  }

  if (nextStatus === "declined") {
    updatePayload.decline_reason = note || "Provider declined booking.";
  }

  if (nextStatus === "on_the_way") {
    updatePayload.on_the_way_at = new Date().toISOString();
  }

  if (nextStatus === "arrived") {
    updatePayload.arrived_at = new Date().toISOString();
  }

  if (nextStatus === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  }

  if (nextStatus === "paid") {
    updatePayload.paid_at = new Date().toISOString();
  }

  if (nextStatus === "review_requested") {
    updatePayload.review_requested_at = new Date().toISOString();
  }

  if (nextStatus === "cancelled") {
    updatePayload.cancelled_at = new Date().toISOString();
  }

  const { error: updateError } = await verified.adminClient
    .from("bookings")
    .update(updatePayload)
    .eq("id", current.id)
    .eq("provider_id", verified.profile.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Unable to update booking." },
      { status: 500 }
    );
  }

  const nextNotificationType = notificationTypeForStatus(nextStatus);
  const nextNotificationContent = notificationContent(
    nextStatus,
    current.service_label,
    note
  );

  if (nextNotificationType && nextNotificationContent) {
    await verified.adminClient.from("notifications").insert({
      user_id: current.customer_id,
      booking_id: current.id,
      notification_type: nextNotificationType,
      title: nextNotificationContent.title,
      body: nextNotificationContent.body,
    });

    await sendPushNotificationToUser(current.customer_id, {
      title: nextNotificationContent.title,
      body: nextNotificationContent.body,
      bookingId: current.id,
      path: `/profile/notifications?booking=${current.id}`,
    });
  }

  return NextResponse.json({ success: true });
}
