import { bookings as mockBookings } from "../data/mock-data";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { DashboardBooking } from "../types";

type ProviderProfileRelation =
  | {
      marketing_name?: string | null;
    }
  | Array<{
      marketing_name?: string | null;
    }>
  | null;

type ProviderServiceRelation =
  | {
      service_type?: string | null;
    }
  | Array<{
      service_type?: string | null;
    }>
  | null;

type LiveBookingRow = {
  id: string;
  booking_status?: string | null;
  scheduled_date?: string | null;
  scheduled_start_time?: string | null;
  total_amount?: number | null;
  customer_id?: string | null;
  provider_id?: string | null;
  provider_profiles?: ProviderProfileRelation;
  provider_services?: ProviderServiceRelation;
};

type LivePaymentMethodRow = {
  booking_id?: string | null;
  payment_method?: string | null;
  payment_option?: string | null;
  created_at?: string | null;
};

type ProfileNameRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function relationItem<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function toTitleCase(value: string) {
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

function formatSchedule(dateValue?: string | null, timeValue?: string | null) {
  if (!dateValue) {
    return "Upcoming booking";
  }

  const parsed = new Date(`${dateValue}T${timeValue ?? "09:00:00"}`);
  if (Number.isNaN(parsed.getTime())) {
    return "Upcoming booking";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatStatus(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Pending";
  }

  if (value.trim().toLowerCase() === "in_progress") {
    return "In Progress";
  }

  return toTitleCase(value.trim());
}

function formatEntityId(value: string | null | undefined) {
  if (!value?.trim()) {
    return "#-";
  }

  return value.startsWith("#") ? value : `#${value.slice(0, 8).toUpperCase()}`;
}

function humanizeService(value?: string | null) {
  if (!value?.trim()) {
    return "Service";
  }

  return toTitleCase(value);
}

function buildName(row: ProfileNameRow) {
  return (
    row.full_name?.trim() ||
    row.email?.split("@")[0]?.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) ||
    "User"
  );
}

async function fetchProfileNameMap(ids: Array<string | null | undefined>) {
  if (!supabase) {
    return new Map<string, string>();
  }

  const uniqueIds = [...new Set(ids.filter((value): value is string => Boolean(value?.trim())))];

  if (!uniqueIds.length) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", uniqueIds);

  if (error || !data) {
    return new Map<string, string>();
  }

  return new Map((data as ProfileNameRow[]).map((row) => [row.id, buildName(row)]));
}

async function fetchLiveBookings() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_status,
      scheduled_date,
      scheduled_start_time,
      total_amount,
      customer_id,
      provider_id,
      provider_profiles (
        marketing_name
      ),
      provider_services (
        service_type
      )
    `)
    .order("scheduled_date", { ascending: false })
    .limit(200);

  if (error || !data?.length) {
    return null;
  }

  return data as LiveBookingRow[];
}

async function fetchPaymentMethodMap(bookingIds: string[]) {
  if (!supabase || bookingIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("payments")
    .select("booking_id, payment_method, payment_option, created_at")
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return new Map<string, string>();
  }

  const map = new Map<string, string>();

  for (const row of data as LivePaymentMethodRow[]) {
    const bookingId = row.booking_id?.trim();

    if (!bookingId || map.has(bookingId)) {
      continue;
    }

    map.set(bookingId, row.payment_option?.trim() || row.payment_method?.trim() || "Cash");
  }

  return map;
}

export async function listBookingsWithFallback(): Promise<DashboardBooking[]> {
  const liveBookings = await fetchLiveBookings();

  if (!liveBookings?.length) {
    return mockBookings;
  }

  const [profileNames, paymentMethodMap] = await Promise.all([
    fetchProfileNameMap([
      ...liveBookings.map((row) => row.customer_id),
      ...liveBookings.map((row) => row.provider_id),
    ]),
    fetchPaymentMethodMap(liveBookings.map((row) => row.id)),
  ]);

  return liveBookings.map((row) => {
    const providerProfile = relationItem(row.provider_profiles);
    const providerService = relationItem(row.provider_services);

    return {
      id: formatEntityId(row.id),
      bookingId: formatEntityId(row.id),
      service: humanizeService(providerService?.service_type),
      provider: providerProfile?.marketing_name?.trim() || profileNames.get(row.provider_id ?? "") || "Provider",
      customer: profileNames.get(row.customer_id ?? "") || "Customer",
      status: formatStatus(row.booking_status),
      amount: formatCurrency(row.total_amount ?? 0),
      schedule: formatSchedule(row.scheduled_date, row.scheduled_start_time),
      paymentMethod: paymentMethodMap.get(row.id) || "-",
    } satisfies DashboardBooking;
  });
}

export function buildBookingStats(rows: DashboardBooking[]) {
  const openTasks = rows.filter((row) => {
    const normalized = row.status.trim().toLowerCase();
    return !["completed", "cancelled", "canceled", "declined"].includes(normalized);
  }).length;
  const completedCount = rows.filter((row) => row.status.trim().toLowerCase() === "completed").length;
  const cancelledCount = rows.filter((row) => {
    const normalized = row.status.trim().toLowerCase();
    return ["cancelled", "canceled", "declined"].includes(normalized);
  }).length;

  return [
    {
      label: "Open tasks",
      value: openTasks.toLocaleString("en-MY"),
      note: "Pending, accepted, and active bookings",
    },
    {
      label: "Completed",
      value: completedCount.toLocaleString("en-MY"),
      note: "Completed bookings in loaded records",
    },
    {
      label: "Cancelled",
      value: cancelledCount.toLocaleString("en-MY"),
      note: "Cancelled or declined bookings",
    },
  ];
}
