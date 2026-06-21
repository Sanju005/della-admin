import { bookings, payments, providers as mockProviders, reviews as mockReviews } from "../data/mock-data";
import { providerDetailRecords } from "../data/provider-detail-mocks";
import { isSupabaseConfigured, supabase } from "./supabase";
import type {
  ProviderCancelledTaskRow,
  ProviderDetailRecord,
  ProviderDocumentItem,
  ProviderPayoutRow,
  ProviderRow,
  ProviderTaskRow,
  ProviderUpcomingTaskRow,
  UserMetric,
  UserReviewItem,
} from "../types";

type ProviderProfileRow = {
  id: string;
  marketing_name?: string | null;
  service_location?: string | null;
  service_radius_km?: number | null;
  date_of_birth?: string | null;
  sex?: string | null;
  residential_address?: string | null;
  bio?: string | null;
  average_rating?: number | null;
  total_reviews?: number | null;
  approval_status?: string | null;
  is_visible?: boolean | null;
  provider_services?:
    | Array<{
        service_type?: string | null;
        years_experience?: string | null;
        hourly_rate?: number | null;
        daily_rate?: number | null;
        provider_service_specialties?: Array<{ specialty?: string | null }> | null;
      }>
    | null;
  provider_verifications?:
    | {
        phone_verified?: boolean | null;
        email_verified?: boolean | null;
        identity_verified?: boolean | null;
        kyc_verified?: boolean | null;
        background_check_verified?: boolean | null;
        document_type?: string | null;
        front_image_name?: string | null;
        back_image_name?: string | null;
        requested_documents?: string[] | null;
        admin_note?: string | null;
        last_reviewed_at?: string | null;
      }
    | Array<{
        phone_verified?: boolean | null;
        email_verified?: boolean | null;
        identity_verified?: boolean | null;
        kyc_verified?: boolean | null;
        background_check_verified?: boolean | null;
        document_type?: string | null;
        front_image_name?: string | null;
        back_image_name?: string | null;
        requested_documents?: string[] | null;
        admin_note?: string | null;
        last_reviewed_at?: string | null;
      }>
    | null;
  provider_admin_metadata?: ProviderAdminMetadataRow | null;
};

type ProviderServiceRow = {
  provider_id: string;
  service_type?: string | null;
  years_experience?: string | null;
  hourly_rate?: number | null;
  daily_rate?: number | null;
  provider_service_specialties?: Array<{ specialty?: string | null }> | null;
};

type ProviderVerificationRow = {
  provider_id: string;
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
  identity_verified?: boolean | null;
  kyc_verified?: boolean | null;
  background_check_verified?: boolean | null;
  document_type?: string | null;
  front_image_name?: string | null;
  back_image_name?: string | null;
  requested_documents?: string[] | null;
  admin_note?: string | null;
  last_reviewed_at?: string | null;
};

type ProviderAdminMetadataRow = {
  provider_id: string;
  availability_days?: string[] | null;
  availability_time_preset?: string | null;
  availability_start_time?: string | null;
  availability_end_time?: string | null;
  service_image_captions?: Record<string, string[] | null> | null;
  certificate_image_captions?: Record<string, string[] | null> | null;
  service_image_files?: Record<string, string[] | null> | null;
  certificate_image_files?: Record<string, string[] | null> | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
};

type ProviderAccountRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  phone?: string | null;
  created_at?: string | null;
};

type LiveBookingRow = {
  id: string;
  booking_status?: string | null;
  scheduled_date?: string | null;
  scheduled_start_time?: string | null;
  total_amount?: number | null;
  decline_reason?: string | null;
  customer_id?: string | null;
  provider_id?: string | null;
  provider_services?:
    | {
        service_type?: string | null;
      }
    | Array<{
        service_type?: string | null;
      }>
    | null;
};

type LivePaymentRow = {
  id: string;
  status?: string | null;
  amount?: number | null;
  payment_method?: string | null;
  created_at?: string | null;
  customer_id?: string | null;
  provider_id?: string | null;
};

type LiveReviewRow = {
  id: string;
  rating?: number | null;
  comment?: string | null;
  created_at?: string | null;
  customer_id?: string | null;
  provider_id?: string | null;
};

type ProviderProfilePayload = {
  detail: ProviderDetailRecord | null;
};

type ProfileNameRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export const providerDocumentRequestOptions = [
  "IC / Passport / Driving License",
  "Proof of Address",
  "Professional Certificates",
  "Background Check",
] as const;

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

function formatStatus(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Active";
  }

  return toTitleCase(value);
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

function formatApprovalStatus(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Pending";
  }

  return toTitleCase(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateOfBirth(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const beforeBirthday =
    now.getMonth() < date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() < date.getDate());

  if (beforeBirthday) {
    age -= 1;
  }

  return `${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)}${age >= 0 ? ` (${age} years)` : ""}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Recently active";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently active";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRate(value: number | null | undefined, suffix: string) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return "Not set";
  }

  return `${formatCurrency(value)}${suffix}`;
}

function formatAvailabilityDays(days: string[] | null | undefined) {
  const cleanDays = (days ?? []).map((value) => value.trim()).filter(Boolean);

  if (!cleanDays.length) {
    return "Not set";
  }

  if (cleanDays.length === 7) {
    return "Monday - Sunday";
  }

  return cleanDays.join(", ");
}

function formatAvailabilityHours(metadata: ProviderAdminMetadataRow | null | undefined) {
  if (!metadata) {
    return "Not set";
  }

  const preset = metadata.availability_time_preset?.trim() || "";
  const start = metadata.availability_start_time?.trim() || "";
  const end = metadata.availability_end_time?.trim() || "";

  if (preset && preset.toLowerCase() !== "custom time") {
    return preset;
  }

  if (start && end) {
    return `${start} - ${end}`;
  }

  return preset || "Not set";
}

function formatCoordinates(metadata: ProviderAdminMetadataRow | null | undefined) {
  const latitude = metadata?.current_latitude;
  const longitude = metadata?.current_longitude;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return "Not captured";
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function formatSchedule(dateValue?: string | null, timeValue?: string | null) {
  if (!dateValue) {
    return "Upcoming task";
  }

  const date = new Date(`${dateValue}T${timeValue ?? "09:00:00"}`);
  if (Number.isNaN(date.getTime())) {
    return "Upcoming task";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function humanizeService(value?: string | null) {
  if (!value?.trim()) {
    return "Service";
  }

  return toTitleCase(value);
}

function mapTaskStatus(value?: string | null) {
  if (!value?.trim()) {
    return "Pending";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "in_progress") {
    return "In Progress";
  }

  if (normalized === "scheduled") {
    return "Confirmed";
  }

  return toTitleCase(normalized);
}

function formatDocumentStatus(verified: boolean, requested: boolean) {
  if (verified) {
    return "Verified";
  }

  if (requested) {
    return "Requested";
  }

  return "Pending";
}

function findMockProviderRowByIdOrName(id: string, name?: string | null, email?: string | null) {
  const normalizedName = name?.trim().toLowerCase();
  const normalizedEmail = email?.trim().toLowerCase();

  return mockProviders.find((row) => {
    if (row.id === id) {
      return true;
    }

    if (normalizedName && row.provider.trim().toLowerCase() === normalizedName) {
      return true;
    }

    if (normalizedEmail && row.provider.trim().toLowerCase() === normalizedEmail.split("@")[0]) {
      return true;
    }

    return false;
  });
}

function findMockProviderDetail(id: string, name?: string | null, email?: string | null) {
  const direct = providerDetailRecords[id];
  if (direct) {
    return direct;
  }

  const normalizedName = name?.trim().toLowerCase();
  const normalizedEmail = email?.trim().toLowerCase();

  return Object.values(providerDetailRecords).find((record) => {
    if (normalizedName && record.name.trim().toLowerCase() === normalizedName) {
      return true;
    }

    if (normalizedEmail && record.email.trim().toLowerCase() === normalizedEmail) {
      return true;
    }

    return false;
  });
}

function getMockTasks(name: string) {
  const normalized = name.trim().toLowerCase();

  return bookings.filter((booking) => booking.provider.trim().toLowerCase() === normalized);
}

function getMockProviderPayments(name: string) {
  const normalized = name.trim().toLowerCase();

  return payments.filter((payment) => payment.provider.trim().toLowerCase() === normalized);
}

function getMockProviderReviews(name: string) {
  const normalized = name.trim().toLowerCase();

  return mockReviews
    .filter((review) => review.provider.trim().toLowerCase() === normalized)
    .map((review) => ({
      id: review.id,
      provider: review.customer,
      rating: Math.max(1, Math.min(5, Number(review.rating) || 5)),
      review: review.comment,
      date: review.date,
    })) satisfies UserReviewItem[];
}

async function fetchProfileNameMap(ids: Array<string | null | undefined>) {
  if (!supabase) {
    return new Map<string, string>();
  }

  const uniqueIds = [...new Set(ids.filter((value): value is string => Boolean(value?.trim())))];

  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", uniqueIds);

  if (error || !data) {
    return new Map<string, string>();
  }

  return new Map(
    (data as ProfileNameRow[]).map((row) => [
      row.id,
      row.full_name?.trim() || row.email?.split("@")[0]?.replace(/[._-]+/g, " ") || "Customer",
    ])
  );
}

async function fetchProviderProfiles() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("provider_profiles")
    .select("id, marketing_name, service_location, service_radius_km, date_of_birth, sex, residential_address, bio, average_rating, total_reviews, approval_status, is_visible")
    .order("average_rating", { ascending: false })
    .limit(200);

  if (error || !data?.length) {
    return null;
  }

  const profiles = data as ProviderProfileRow[];
  const ids = profiles.map((profile) => profile.id);

  const [{ data: serviceRows }, { data: verificationRows }, { data: metadataRows }] = await Promise.all([
    supabase
      .from("provider_services")
      .select(`
        provider_id,
        service_type,
        years_experience,
        hourly_rate,
        daily_rate,
        provider_service_specialties (
          specialty
        )
      `)
      .in("provider_id", ids),
    supabase
      .from("provider_verifications")
      .select("provider_id, phone_verified, email_verified, identity_verified, kyc_verified, background_check_verified, document_type, front_image_name, back_image_name, requested_documents, admin_note, last_reviewed_at")
      .in("provider_id", ids),
    supabase
      .from("provider_admin_metadata")
      .select("provider_id, availability_days, availability_time_preset, availability_start_time, availability_end_time, service_image_captions, certificate_image_captions, service_image_files, certificate_image_files, current_latitude, current_longitude")
      .in("provider_id", ids),
  ]);

  const servicesByProvider = new Map<string, ProviderServiceRow[]>();
  for (const row of (serviceRows as ProviderServiceRow[] | null | undefined) ?? []) {
    const current = servicesByProvider.get(row.provider_id) ?? [];
    current.push(row);
    servicesByProvider.set(row.provider_id, current);
  }

  const verificationByProvider = new Map(
    ((verificationRows as ProviderVerificationRow[] | null | undefined) ?? []).map((row) => [row.provider_id, row])
  );
  const metadataByProvider = new Map(
    ((metadataRows as ProviderAdminMetadataRow[] | null | undefined) ?? []).map((row) => [row.provider_id, row])
  );

  return profiles.map((profile) => ({
    ...profile,
    provider_services: servicesByProvider.get(profile.id) ?? null,
    provider_verifications: verificationByProvider.get(profile.id) ?? null,
    provider_admin_metadata: metadataByProvider.get(profile.id) ?? null,
  }));
}

async function fetchProviderProfileById(providerId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("provider_profiles")
    .select("id, marketing_name, service_location, service_radius_km, date_of_birth, sex, residential_address, bio, average_rating, total_reviews, approval_status, is_visible")
    .eq("id", providerId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const profile = data as ProviderProfileRow;

  const [{ data: serviceRows }, { data: verificationRow }, { data: metadataRow }] = await Promise.all([
    supabase
      .from("provider_services")
      .select(`
        provider_id,
        service_type,
        years_experience,
        hourly_rate,
        daily_rate,
        provider_service_specialties (
          specialty
        )
      `)
      .eq("provider_id", providerId),
    supabase
      .from("provider_verifications")
      .select("provider_id, phone_verified, email_verified, identity_verified, kyc_verified, background_check_verified, document_type, front_image_name, back_image_name, requested_documents, admin_note, last_reviewed_at")
      .eq("provider_id", providerId)
      .maybeSingle(),
    supabase
      .from("provider_admin_metadata")
      .select("provider_id, availability_days, availability_time_preset, availability_start_time, availability_end_time, service_image_captions, certificate_image_captions, service_image_files, certificate_image_files, current_latitude, current_longitude")
      .eq("provider_id", providerId)
      .maybeSingle(),
  ]);

  return {
    ...profile,
    provider_services: (serviceRows as ProviderServiceRow[] | null | undefined) ?? null,
    provider_verifications: verificationRow ?? null,
    provider_admin_metadata: (metadataRow as ProviderAdminMetadataRow | null | undefined) ?? null,
  };
}

async function fetchProviderAccountById(providerId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status, phone, created_at")
    .eq("id", providerId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ProviderAccountRow;
}

function mapProviderRow(liveProfile: ProviderProfileRow, liveAccount: ProviderAccountRow | null): ProviderRow {
  const mockRow = findMockProviderRowByIdOrName(
    liveProfile.id,
    liveProfile.marketing_name ?? liveAccount?.full_name,
    liveAccount?.email
  );
  const firstService = relationItem(liveProfile.provider_services);

  return {
    id: liveProfile.id,
    provider: liveProfile.marketing_name?.trim() || liveAccount?.full_name?.trim() || mockRow?.provider || "DELLA Provider",
    service: humanizeService(firstService?.service_type) || mockRow?.service || "Service",
    rating:
      typeof liveProfile.average_rating === "number"
        ? Number(liveProfile.average_rating).toFixed(1)
        : mockRow?.rating || "0.0",
    status: formatStatus(liveAccount?.status ?? (liveProfile.is_visible === false ? "paused" : "active")),
    zone: liveProfile.service_location?.trim() || mockRow?.zone || "Malaysia",
    verification: formatStatus(liveProfile.approval_status) || mockRow?.verification || "Pending",
  };
}

async function tryFetchProviderTasks(providerId: string) {
  if (!supabase) {
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
      decline_reason,
      customer_id,
      provider_id,
      provider_services (
        service_type
      )
    `)
    .eq("provider_id", providerId)
    .order("scheduled_date", { ascending: false })
    .limit(30);

  if (error || !data) {
    return null;
  }

  return data as LiveBookingRow[];
}

async function tryFetchProviderPayments(providerId: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("payments")
    .select("id, status, amount, payment_method, created_at, provider_id")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    return null;
  }

  return data as LivePaymentRow[];
}

async function tryFetchProviderReviews(providerId: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, provider_id")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    return null;
  }

  return data as LiveReviewRow[];
}

function buildTaskRows(liveRows: LiveBookingRow[], customerNames: Map<string, string>): {
  completedTaskRows: ProviderTaskRow[];
  upcomingTaskRows: ProviderUpcomingTaskRow[];
  cancelledTaskRows: ProviderCancelledTaskRow[];
} {
  const completedTaskRows = liveRows
    .filter((row) => ["completed"].includes((row.booking_status ?? "").toLowerCase()))
    .slice(0, 5)
    .map((row) => {
      const service = relationItem(row.provider_services);
      return {
        id: row.id.startsWith("#") ? row.id : `#${row.id.slice(0, 8).toUpperCase()}`,
        service: humanizeService(service?.service_type),
        customer: customerNames.get(row.customer_id ?? "") || "Customer",
        date: formatDate(row.scheduled_date),
        amount: formatCurrency(row.total_amount ?? 0),
        status: mapTaskStatus(row.booking_status),
      };
    });

  const upcomingTaskRows = liveRows
    .filter((row) => !["completed", "cancelled", "canceled"].includes((row.booking_status ?? "").toLowerCase()))
    .slice(0, 5)
    .map((row) => {
      const service = relationItem(row.provider_services);
      return {
        id: row.id.startsWith("#") ? row.id : `#${row.id.slice(0, 8).toUpperCase()}`,
        service: humanizeService(service?.service_type),
        customer: customerNames.get(row.customer_id ?? "") || "Customer",
        schedule: formatSchedule(row.scheduled_date, row.scheduled_start_time),
        amount: formatCurrency(row.total_amount ?? 0),
        status: mapTaskStatus(row.booking_status),
      };
    });

  const cancelledTaskRows = liveRows
    .filter((row) => ["cancelled", "canceled", "declined"].includes((row.booking_status ?? "").toLowerCase()))
    .slice(0, 5)
    .map((row) => {
      const service = relationItem(row.provider_services);
      return {
        id: row.id.startsWith("#") ? row.id : `#${row.id.slice(0, 8).toUpperCase()}`,
        service: humanizeService(service?.service_type),
        customer: customerNames.get(row.customer_id ?? "") || "Customer",
        schedule: formatSchedule(row.scheduled_date, row.scheduled_start_time),
        amount: formatCurrency(row.total_amount ?? 0),
        status: mapTaskStatus(row.booking_status),
        reason: row.decline_reason?.trim() || "No reason recorded",
      };
    });

  return { completedTaskRows, upcomingTaskRows, cancelledTaskRows };
}

function buildPayoutRows(livePayments: LivePaymentRow[]): ProviderPayoutRow[] {
  return livePayments.slice(0, 5).map((row) => ({
    id: row.id.startsWith("#") ? row.id : `#${row.id.slice(0, 8).toUpperCase()}`,
    type: row.payment_method?.trim() || "Payment",
    amount: formatCurrency(row.amount ?? 0),
    date: formatDate(row.created_at),
    status: formatStatus(row.status),
  }));
}

function buildReviewRows(liveReviews: LiveReviewRow[], customerNames: Map<string, string>): UserReviewItem[] {
  return liveReviews.slice(0, 7).map((row) => ({
    id: row.id,
    provider: customerNames.get(row.customer_id ?? "") || "Customer Review",
    rating: Math.max(1, Math.min(5, Math.round(row.rating ?? 5))),
    review: row.comment?.trim() || "Shared feedback",
    date: formatDate(row.created_at),
  }));
}

function buildMetrics(
  fallbackMetrics: UserMetric[],
  taskRows: LiveBookingRow[] | null,
  paymentRows: LivePaymentRow[] | null,
  serviceAreaCount: number,
  averageRating: number | null | undefined,
  reviewCount: number | null | undefined
) {
  if (!taskRows?.length && !paymentRows?.length) {
    return fallbackMetrics;
  }

  const totalTasks = taskRows?.length ?? 0;
  const completedTasks = taskRows?.filter((row) => (row.booking_status ?? "").toLowerCase() === "completed").length ?? 0;
  const upcomingTasks =
    taskRows?.filter((row) => !["completed", "cancelled", "canceled"].includes((row.booking_status ?? "").toLowerCase())).length ?? 0;
  const totalEarnings = paymentRows?.reduce((sum, row) => sum + (row.amount ?? 0), 0) ?? 0;
  const completionRate = totalTasks > 0 ? `${((completedTasks / totalTasks) * 100).toFixed(1)}%` : "0.0%";

  return [
    { id: "lpm-1", label: "Total Tasks", value: String(totalTasks), note: "View all tasks", tone: "emerald" },
    { id: "lpm-2", label: "Completed Tasks", value: String(completedTasks), note: completionRate, tone: "emerald" },
    { id: "lpm-3", label: "Upcoming Tasks", value: String(upcomingTasks), note: "Next 7 days", tone: "violet" },
    fallbackMetrics[3] ?? { id: "lpm-4", label: "Active Time", value: "0h 0m", note: "Total logged hours", tone: "sky" },
    { id: "lpm-5", label: "Service Areas", value: String(serviceAreaCount || 1), note: "Areas covered", tone: "amber" },
    { id: "lpm-6", label: "Total Earnings", value: formatCurrency(totalEarnings), note: "All time", tone: "emerald" },
    fallbackMetrics[6] ?? { id: "lpm-7", label: "Withdrawn", value: "RM0.00", note: "Total withdrawn", tone: "violet" },
    {
      id: "lpm-8",
      label: "Reviews",
      value: String(reviewCount ?? 0),
      note: `${Number(averageRating ?? 0).toFixed(1)} average`,
      tone: "amber",
    },
  ] satisfies UserMetric[];
}

function buildGeneratedProviderDetail(
  providerId: string,
  liveProfile: ProviderProfileRow,
  liveAccount: ProviderAccountRow | null,
  firstService:
    | {
        service_type?: string | null;
        years_experience?: string | null;
        hourly_rate?: number | null;
        daily_rate?: number | null;
        provider_service_specialties?: Array<{ specialty?: string | null }> | null;
      }
    | null,
): ProviderDetailRecord {
  const approvalStatus = formatApprovalStatus(liveProfile.approval_status);
  const verification = relationItem(liveProfile.provider_verifications);
  const metadata = liveProfile.provider_admin_metadata ?? null;
  const serviceKey = firstService?.service_type?.trim().toLowerCase() || "";
  const name =
    liveProfile.marketing_name?.trim() ||
    liveAccount?.full_name?.trim() ||
    "DELLA Provider";
  const joinedAt = formatDateTime(liveAccount?.created_at);
  const memberSince = formatDate(liveAccount?.created_at);
  const specialties =
    firstService?.provider_service_specialties
      ?.map((item) => item.specialty?.trim())
      .filter((item): item is string => Boolean(item)) ?? [];

  return {
    providerId,
    name,
    email: liveAccount?.email?.trim() || "Not provided",
    status: formatStatus(liveAccount?.status ?? (liveProfile.is_visible === false ? "paused" : "active")),
    visibilityStatus: liveProfile.is_visible === false ? "Hidden" : "Visible",
    roleBadge: "Provider",
    joinedAt,
    lastLogin: "Recently active",
    serviceType: humanizeService(firstService?.service_type),
    serviceArea: liveProfile.service_location?.trim() || "Malaysia",
    serviceRadiusKm: `${Number(liveProfile.service_radius_km ?? 0).toFixed(0)} km`,
    yearsExperience: firstService?.years_experience?.trim() || "Not set",
    hourlyRate: formatRate(firstService?.hourly_rate, " / hr"),
    dailyRate: formatRate(firstService?.daily_rate, " / day"),
    currentCoordinates: formatCoordinates(metadata),
    rating: typeof liveProfile.average_rating === "number" ? liveProfile.average_rating.toFixed(1) : "0.0",
    ratingNote: `(${liveProfile.total_reviews ?? 0} reviews)`,
    phone: liveAccount?.phone?.trim() || "Not provided",
    dob: formatDateOfBirth(liveProfile.date_of_birth),
    gender: liveProfile.sex?.trim() || "Not provided",
    language: "Not provided",
    nationalId: verification?.document_type?.trim() || "Document pending",
    emergencyContact: "Not provided",
    address: liveProfile.residential_address?.trim() || "Not provided",
    about: liveProfile.bio?.trim() || "Provider profile is awaiting full verification.",
    approvalStatus,
    backgroundCheck: verification?.background_check_verified ? "Verified" : "Pending",
    kycStatus: verification?.kyc_verified || verification?.identity_verified ? "Verified" : "Pending",
    verificationNote: verification?.admin_note?.trim() || "",
    requestedDocuments: verification?.requested_documents?.filter(Boolean) ?? [],
    phoneVerified: Boolean(verification?.phone_verified),
    emailVerified: Boolean(verification?.email_verified),
    identityVerified: Boolean(verification?.identity_verified),
    backgroundCheckVerified: Boolean(verification?.background_check_verified),
    memberSince,
    device: "Unknown",
    completedJobs: "0",
    cancellationRate: "0.0%",
    responseRate: "Pending",
    averageRating: typeof liveProfile.average_rating === "number" ? liveProfile.average_rating.toFixed(1) : "0.0",
    totalReviews: String(liveProfile.total_reviews ?? 0),
    onTimeRate: "Pending",
    repeatCustomers: "Pending",
    workingDays: formatAvailabilityDays(metadata?.availability_days),
    workingHours: formatAvailabilityHours(metadata),
    availabilityPreset: metadata?.availability_time_preset?.trim() || "Not set",
    totalTasks: "0",
    completedTasks: "0",
    upcomingTasks: "0",
    activeTime: "0h 0m",
    areaCount: "1",
    totalEarnings: "RM0.00",
    withdrawn: "RM0.00",
    reviewsCount: String(liveProfile.total_reviews ?? 0),
    metrics: [
      { id: "g-1", label: "Total Tasks", value: "0", note: "View all tasks", tone: "emerald" },
      { id: "g-2", label: "Completed Tasks", value: "0", note: "0.0%", tone: "emerald" },
      { id: "g-3", label: "Upcoming Tasks", value: "0", note: "Next 7 days", tone: "violet" },
      { id: "g-4", label: "Active Time", value: "0h 0m", note: "Total logged hours", tone: "sky" },
      { id: "g-5", label: "Service Areas", value: "1", note: "Areas covered", tone: "amber" },
      { id: "g-6", label: "Total Earnings", value: "RM0.00", note: "All time", tone: "emerald" },
      { id: "g-7", label: "Withdrawn", value: "RM0.00", note: "Total withdrawn", tone: "violet" },
      {
        id: "g-8",
        label: "Reviews",
        value: String(liveProfile.total_reviews ?? 0),
        note: `${typeof liveProfile.average_rating === "number" ? liveProfile.average_rating.toFixed(1) : "0.0"} average`,
        tone: "amber",
      },
    ],
    serviceAreas: [
      {
        id: "live-sa-1",
        label: liveProfile.service_location?.trim() || "Malaysia",
        tag: "Primary",
      },
    ],
    skills: firstService?.service_type
      ? [{ id: `skill-${firstService.service_type}`, label: humanizeService(firstService.service_type) }]
      : [],
    specialties,
    serviceImageCaptions:
      serviceKey && metadata?.service_image_captions?.[serviceKey]?.length
        ? metadata.service_image_captions[serviceKey]?.filter(Boolean) ?? []
        : [],
    serviceImageFiles:
      serviceKey && metadata?.service_image_files?.[serviceKey]?.length
        ? metadata.service_image_files[serviceKey]?.filter(Boolean) ?? []
        : [],
    certificateImageCaptions:
      serviceKey && metadata?.certificate_image_captions?.[serviceKey]?.length
        ? metadata.certificate_image_captions[serviceKey]?.filter(Boolean) ?? []
        : [],
    certificateImageFiles:
      serviceKey && metadata?.certificate_image_files?.[serviceKey]?.length
        ? metadata.certificate_image_files[serviceKey]?.filter(Boolean) ?? []
        : [],
    documents: [
      {
        id: "live-doc-phone",
        label: "Phone Verification",
        status: verification?.phone_verified ? "Verified" : "Pending",
        updated: verification?.last_reviewed_at ? formatDate(verification.last_reviewed_at) : undefined,
      },
      {
        id: "live-doc-email",
        label: "Email Verification",
        status: verification?.email_verified ? "Verified" : "Pending",
        updated: verification?.last_reviewed_at ? formatDate(verification.last_reviewed_at) : undefined,
      },
      {
        id: "live-doc-front",
        label: verification?.document_type?.trim() || "Identity Document",
        status: formatDocumentStatus(
          Boolean(verification?.identity_verified),
          Boolean(verification?.requested_documents?.includes(providerDocumentRequestOptions[0])),
        ),
        fileName: verification?.front_image_name?.trim() || undefined,
        updated: verification?.last_reviewed_at ? formatDate(verification.last_reviewed_at) : undefined,
      },
      {
        id: "live-doc-back",
        label: "Back of Document",
        status: verification?.back_image_name?.trim()
          ? formatDocumentStatus(Boolean(verification?.identity_verified), false)
          : "Pending",
        fileName: verification?.back_image_name?.trim() || undefined,
        updated: verification?.last_reviewed_at ? formatDate(verification.last_reviewed_at) : undefined,
      },
    ],
    completedTaskRows: [],
    upcomingTaskRows: [],
    cancelledTaskRows: [],
    payoutRows: [],
    recentReviews: [],
    recentActions: [],
    activityLog: [
      {
        id: "live-activity-1",
        title: "Provider registered",
        note: `Approval status: ${approvalStatus}`,
        time: joinedAt,
        tone: "amber",
      },
    ],
  };
}

export async function listProvidersWithFallback() {
  const liveProfiles = await fetchProviderProfiles();

  if (!liveProfiles?.length) {
    return mockProviders;
  }

  const liveAccounts = await Promise.all(liveProfiles.map((profile) => fetchProviderAccountById(profile.id)));
  const liveRows = liveProfiles.map((profile, index) => mapProviderRow(profile, liveAccounts[index] ?? null));
  const seen = new Set(liveRows.flatMap((row) => [row.id.trim().toLowerCase(), row.provider.trim().toLowerCase()]));
  const mockRemainder = mockProviders.filter(
    (row) => !seen.has(row.id.trim().toLowerCase()) && !seen.has(row.provider.trim().toLowerCase())
  );

  return [...liveRows, ...mockRemainder];
}

export function buildProviderStats(rows: ProviderRow[]) {
  const activeCount = rows.filter((row) => ["active", "approved", "verified"].includes(row.status.toLowerCase())).length;
  const approvedCount = rows.filter((row) => row.verification.toLowerCase().includes("approved") || row.verification.toLowerCase().includes("verified")).length;
  const pausedCount = rows.filter((row) => ["paused", "suspended", "pending"].includes(row.status.toLowerCase())).length;

  return [
    {
      label: "Active providers",
      value: activeCount.toLocaleString("en-MY"),
      note: `${rows.length.toLocaleString("en-MY")} total provider accounts`,
    },
    {
      label: "Approved",
      value: approvedCount.toLocaleString("en-MY"),
      note: "Ready for marketplace visibility",
    },
    {
      label: "Needs review",
      value: pausedCount.toLocaleString("en-MY"),
      note: "Paused, pending, or suspended providers",
    },
  ];
}

export async function getProviderProfileWithFallback(providerId: string): Promise<ProviderProfilePayload> {
  const liveProfile = await fetchProviderProfileById(providerId);

  if (!liveProfile) {
    const fallback = providerDetailRecords[providerId] ?? null;
    return { detail: fallback };
  }

  const liveAccount = await fetchProviderAccountById(providerId);
  const firstService = relationItem(liveProfile.provider_services);
  const verification = relationItem(liveProfile.provider_verifications);
  const metadata = liveProfile.provider_admin_metadata ?? null;
  const serviceKey = firstService?.service_type?.trim().toLowerCase() || "";
  const fallback = findMockProviderDetail(
    providerId,
    liveProfile.marketing_name ?? liveAccount?.full_name,
    liveAccount?.email
  );
  const generatedDetail = buildGeneratedProviderDetail(providerId, liveProfile, liveAccount, firstService);
  const baseDetail = generatedDetail;
  const serviceAreas = [{ id: "live-sa-1", label: liveProfile.service_location?.trim() || "Malaysia", tag: "Primary" }];

  const liveTasks = await tryFetchProviderTasks(providerId);
  const livePayments = await tryFetchProviderPayments(providerId);
  const liveReviews = await tryFetchProviderReviews(providerId);
  const customerNames = await fetchProfileNameMap([
    ...(liveTasks?.map((row) => row.customer_id) ?? []),
    ...(liveReviews?.map((row) => row.customer_id) ?? []),
  ]);
  const taskRows = liveTasks?.length ? buildTaskRows(liveTasks, customerNames) : null;
  const payoutRows = livePayments?.length ? buildPayoutRows(livePayments) : baseDetail.payoutRows;
  const reviewRows = liveReviews?.length
    ? buildReviewRows(liveReviews, customerNames)
    : fallback && getMockProviderReviews(fallback.name).length
      ? getMockProviderReviews(fallback.name)
      : [];
  const metrics = buildMetrics(
    baseDetail.metrics,
    liveTasks,
    livePayments,
    serviceAreas.length,
    liveProfile.average_rating,
    liveProfile.total_reviews
  );

  const status = formatStatus(liveAccount?.status ?? (liveProfile.is_visible === false ? "paused" : "active"));

  const detail: ProviderDetailRecord = {
    ...baseDetail,
    providerId,
    name: liveProfile.marketing_name?.trim() || liveAccount?.full_name?.trim() || baseDetail.name,
    email: liveAccount?.email?.trim() || baseDetail.email,
    status,
    visibilityStatus: liveProfile.is_visible === false ? "Hidden" : "Visible",
    joinedAt: formatDateTime(liveAccount?.created_at) || baseDetail.joinedAt,
    lastLogin: baseDetail.lastLogin,
    serviceType: humanizeService(firstService?.service_type),
    serviceArea: liveProfile.service_location?.trim() || baseDetail.serviceArea,
    serviceRadiusKm: `${Number(liveProfile.service_radius_km ?? 0).toFixed(0)} km`,
    yearsExperience: firstService?.years_experience?.trim() || baseDetail.yearsExperience,
    hourlyRate: formatRate(firstService?.hourly_rate, " / hr"),
    dailyRate: formatRate(firstService?.daily_rate, " / day"),
    currentCoordinates: formatCoordinates(metadata),
    rating: typeof liveProfile.average_rating === "number" ? liveProfile.average_rating.toFixed(1) : baseDetail.rating,
    ratingNote: `(${liveProfile.total_reviews ?? (Number(baseDetail.totalReviews) || 0)} reviews)`,
    phone: liveAccount?.phone?.trim() || baseDetail.phone,
    dob: formatDateOfBirth(liveProfile.date_of_birth) || baseDetail.dob,
    gender: liveProfile.sex?.trim() || baseDetail.gender,
    address: liveProfile.residential_address?.trim() || baseDetail.address,
    nationalId: verification?.document_type?.trim() || baseDetail.nationalId,
    about: liveProfile.bio?.trim() || baseDetail.about,
    approvalStatus: formatApprovalStatus(liveProfile.approval_status),
    backgroundCheck: verification?.background_check_verified ? "Verified" : baseDetail.backgroundCheck,
    kycStatus: verification?.kyc_verified || verification?.identity_verified ? "Verified" : baseDetail.kycStatus,
    verificationNote: verification?.admin_note?.trim() || baseDetail.verificationNote,
    requestedDocuments: verification?.requested_documents?.filter(Boolean) ?? baseDetail.requestedDocuments,
    phoneVerified: Boolean(verification?.phone_verified),
    emailVerified: Boolean(verification?.email_verified),
    identityVerified: Boolean(verification?.identity_verified),
    backgroundCheckVerified: Boolean(verification?.background_check_verified),
    memberSince: formatDate(liveAccount?.created_at) || baseDetail.memberSince,
    completedJobs:
      taskRows?.completedTaskRows.length ? String(taskRows.completedTaskRows.length) : baseDetail.completedJobs,
    cancellationRate:
      liveTasks?.length
        ? `${(
            (liveTasks.filter((row) => ["cancelled", "canceled"].includes((row.booking_status ?? "").toLowerCase())).length /
              liveTasks.length) *
            100
          ).toFixed(1)}%`
        : baseDetail.cancellationRate,
    averageRating: typeof liveProfile.average_rating === "number" ? liveProfile.average_rating.toFixed(1) : baseDetail.averageRating,
    totalReviews: String(liveProfile.total_reviews ?? (Number(baseDetail.totalReviews) || 0)),
    workingDays: formatAvailabilityDays(metadata?.availability_days),
    workingHours: formatAvailabilityHours(metadata),
    availabilityPreset: metadata?.availability_time_preset?.trim() || baseDetail.availabilityPreset || "Not set",
    totalTasks: liveTasks?.length ? String(liveTasks.length) : baseDetail.totalTasks,
    completedTasks: taskRows?.completedTaskRows.length ? String(taskRows.completedTaskRows.length) : baseDetail.completedTasks,
    upcomingTasks: taskRows?.upcomingTaskRows.length ? String(taskRows.upcomingTaskRows.length) : baseDetail.upcomingTasks,
    areaCount: String(serviceAreas.length),
    totalEarnings:
      livePayments?.length
        ? formatCurrency(livePayments.reduce((sum, row) => sum + (row.amount ?? 0), 0))
        : baseDetail.totalEarnings,
    reviewsCount: String(liveProfile.total_reviews ?? (Number(baseDetail.reviewsCount) || 0)),
    metrics,
    serviceAreas,
    specialties:
      firstService?.provider_service_specialties
        ?.map((item) => item.specialty?.trim())
        .filter((item): item is string => Boolean(item)) ?? baseDetail.specialties ?? [],
    serviceImageCaptions:
      serviceKey && metadata?.service_image_captions?.[serviceKey]?.length
        ? metadata.service_image_captions[serviceKey]?.filter(Boolean) ?? []
        : baseDetail.serviceImageCaptions ?? [],
    serviceImageFiles:
      serviceKey && metadata?.service_image_files?.[serviceKey]?.length
        ? metadata.service_image_files[serviceKey]?.filter(Boolean) ?? []
        : baseDetail.serviceImageFiles ?? [],
    certificateImageCaptions:
      serviceKey && metadata?.certificate_image_captions?.[serviceKey]?.length
        ? metadata.certificate_image_captions[serviceKey]?.filter(Boolean) ?? []
        : baseDetail.certificateImageCaptions ?? [],
    certificateImageFiles:
      serviceKey && metadata?.certificate_image_files?.[serviceKey]?.length
        ? metadata.certificate_image_files[serviceKey]?.filter(Boolean) ?? []
        : baseDetail.certificateImageFiles ?? [],
    documents: [
      {
        id: "live-doc-1",
        label: "Phone Verification",
        status: verification?.phone_verified ? "Verified" : "Pending",
        updated: verification?.last_reviewed_at ? formatDate(verification.last_reviewed_at) : undefined,
      },
      {
        id: "live-doc-2",
        label: "Email Verification",
        status: verification?.email_verified ? "Verified" : "Pending",
        updated: verification?.last_reviewed_at ? formatDate(verification.last_reviewed_at) : undefined,
      },
      {
        id: "live-doc-3",
        label: "Identity Verification",
        status: formatDocumentStatus(
          Boolean(verification?.identity_verified),
          Boolean(verification?.requested_documents?.length),
        ),
        fileName: verification?.front_image_name?.trim() || undefined,
        updated: verification?.last_reviewed_at ? formatDate(verification.last_reviewed_at) : undefined,
      },
      {
        id: "live-doc-4",
        label: "Back of Document",
        status: verification?.back_image_name?.trim()
          ? formatDocumentStatus(Boolean(verification?.identity_verified), false)
          : "Pending",
        fileName: verification?.back_image_name?.trim() || undefined,
        updated: verification?.last_reviewed_at ? formatDate(verification.last_reviewed_at) : undefined,
      },
    ] satisfies ProviderDocumentItem[],
    completedTaskRows: taskRows?.completedTaskRows.length ? taskRows.completedTaskRows : baseDetail.completedTaskRows,
    upcomingTaskRows: taskRows?.upcomingTaskRows.length ? taskRows.upcomingTaskRows : baseDetail.upcomingTaskRows,
    cancelledTaskRows: taskRows?.cancelledTaskRows.length ? taskRows.cancelledTaskRows : baseDetail.cancelledTaskRows,
    payoutRows,
    recentReviews: reviewRows,
  };

  if (reviewRows.length) {
    detail.reviewsCount = String(reviewRows.length);
  }

  return { detail };
}

export async function updateProviderProfile(
  providerId: string,
  updates: {
    full_name?: string;
    email?: string;
    phone?: string;
    status?: string;
    marketing_name?: string;
    service_location?: string;
    date_of_birth?: string;
    sex?: string;
    residential_address?: string;
    bio?: string;
  }
) {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const profilePayload = Object.fromEntries(
    Object.entries({
      full_name: updates.full_name,
      email: updates.email,
      phone: updates.phone,
      status: updates.status,
    }).filter(([, value]) => typeof value === "string" && value.trim() !== "")
  );

  const providerPayload = Object.fromEntries(
    Object.entries({
      marketing_name: updates.marketing_name,
      service_location: updates.service_location,
      date_of_birth: updates.date_of_birth,
      sex: updates.sex,
      residential_address: updates.residential_address,
      bio: updates.bio,
    }).filter(([, value]) => typeof value === "string" && value.trim() !== "")
  );

  if (Object.keys(profilePayload).length) {
    const { error } = await supabase.from("profiles").update(profilePayload).eq("id", providerId);
    if (error) {
      return { error: error.message || "Unable to update provider profile." };
    }
  }

  if (Object.keys(providerPayload).length) {
    const { error } = await supabase.from("provider_profiles").update(providerPayload).eq("id", providerId);
    if (error) {
      return { error: error.message || "Unable to update provider listing." };
    }
  }

  return { error: null };
}

export async function setProviderSuspended(providerId: string, suspended: boolean) {
  return updateProviderProfile(providerId, {
    status: suspended ? "suspended" : "active",
  });
}

export async function setProviderVisibility(providerId: string, active: boolean) {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("provider_profiles")
    .update({ is_visible: active })
    .eq("id", providerId);

  if (error) {
    return { error: error.message || "Unable to update provider visibility." };
  }

  return { error: null };
}

export async function requestProviderVerificationDocuments(
  providerId: string,
  requestedDocuments: string[],
  note: string,
) {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const timestamp = new Date().toISOString();
  const cleanedDocuments = requestedDocuments
    .map((value) => value.trim())
    .filter(Boolean);

  const { error: verificationError } = await supabase
    .from("provider_verifications")
    .upsert(
      {
        provider_id: providerId,
        requested_documents: cleanedDocuments,
        admin_note: note.trim(),
        last_reviewed_at: timestamp,
      },
      { onConflict: "provider_id" }
    );

  if (verificationError) {
    return { error: verificationError.message || "Unable to request provider documents." };
  }

  const { error: profileError } = await supabase
    .from("provider_profiles")
    .update({ approval_status: "document_review" })
    .eq("id", providerId);

  if (profileError) {
    return { error: profileError.message || "Unable to update provider approval status." };
  }

  const { error: accountError } = await supabase
    .from("profiles")
    .update({ status: "pending" })
    .eq("id", providerId);

  if (accountError) {
    return { error: accountError.message || "Unable to update provider account status." };
  }

  return { error: null };
}

export async function approveProviderVerification(providerId: string, note: string) {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const timestamp = new Date().toISOString();

  const { error: verificationError } = await supabase
    .from("provider_verifications")
    .upsert(
      {
        provider_id: providerId,
        identity_verified: true,
        kyc_verified: true,
        requested_documents: [],
        admin_note: note.trim(),
        last_reviewed_at: timestamp,
      },
      { onConflict: "provider_id" }
    );

  if (verificationError) {
    return { error: verificationError.message || "Unable to approve provider verification." };
  }

  const { error: profileError } = await supabase
    .from("provider_profiles")
    .update({
      approval_status: "approved",
      is_visible: true,
    })
    .eq("id", providerId);

  if (profileError) {
    return { error: profileError.message || "Unable to update provider approval." };
  }

  const { error: accountError } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", providerId);

  if (accountError) {
    return { error: accountError.message || "Unable to activate provider account." };
  }

  return { error: null };
}
