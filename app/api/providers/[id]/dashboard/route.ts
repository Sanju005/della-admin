import { NextResponse } from "next/server";

import {
  fetchProviderDashboardBundle,
  getAdminSupabaseClient,
  relationItem,
} from "@/lib/provider-application-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatSchedule(dateValue: string | null, timeValue: string | null) {
  if (!dateValue) {
    return "Upcoming";
  }

  const parsed = new Date(`${dateValue}T${timeValue ?? "09:00:00"}`);

  if (Number.isNaN(parsed.getTime())) {
    return "Upcoming";
  }

  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminClient = getAdminSupabaseClient();

  if (!adminClient) {
    return NextResponse.json({ ok: false, error: "Supabase is not configured yet." }, { status: 500 });
  }

  const { id } = await params;
  const bundle = await fetchProviderDashboardBundle(adminClient, id);

  const totalBalance = bundle.payments.reduce((sum, payment) => sum + (payment.provider_net_amount ?? payment.amount ?? 0), 0);
  const completed = bundle.bookings.filter((booking) => ["completed", "paid", "review_requested", "reviewed"].includes((booking.booking_status ?? "").toLowerCase())).length;
  const inProgress = bundle.bookings.filter((booking) => ["accepted", "scheduled", "in_progress"].includes((booking.booking_status ?? "").toLowerCase())).length;
  const newOrders = bundle.bookings.filter((booking) => (booking.booking_status ?? "").toLowerCase() === "pending").length;
  const totalRating = bundle.reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0);
  const avgRating = bundle.reviews.length ? totalRating / bundle.reviews.length : 0;

  return NextResponse.json({
    ok: true,
    balance: {
      total: Number(totalBalance.toFixed(2)),
      available: Number(totalBalance.toFixed(2)),
    },
    overview: {
      new_orders: newOrders,
      completed,
      in_progress: inProgress,
      rating: Number(avgRating.toFixed(1)),
    },
    performance: {
      rating: Number(avgRating.toFixed(1)),
      completion_rate: bundle.bookings.length ? Number(((completed / bundle.bookings.length) * 100).toFixed(1)) : 0,
      average_response_minutes: 0,
      total_jobs: bundle.bookings.length,
    },
    recent_orders: bundle.bookings.slice(0, 5).map((booking) => {
      const service = relationItem(booking.provider_services);
      return {
        id: booking.id,
        image_url: "",
        service_name: service?.service_type ?? "service",
        schedule: formatSchedule(booking.scheduled_date, booking.scheduled_start_time),
        location: booking.location_text ?? "Location not captured",
        status:
          (booking.booking_status ?? "").toLowerCase() === "completed"
            ? "Completed"
            : (booking.booking_status ?? "").toLowerCase() === "in_progress"
              ? "In Progress"
              : "New",
        price: formatMoney(booking.quoted_amount ?? 0),
      };
    }),
    earnings: {
      today: 0,
      this_week: Number(totalBalance.toFixed(2)),
      this_month: Number(totalBalance.toFixed(2)),
    },
  });
}
