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

export type ProviderReportRowItem = {
  id: string;
  title: string;
  reporter: string;
  status: string;
  priority: string;
  date: string;
};

export type ProviderTaskDetail = {
  bookingId: string;
  rawBookingId: string;
  service: string;
  customer: string;
  provider: string;
  status: string;
  bookingMode: string;
  amount: string;
  schedule: string;
  location: string;
  createdAt: string;
  scheduledStart: string;
  scheduledEnd: string;
  notes: Array<{ label: string; value: string }>;
  timeline: Array<{ id: string; title: string; note: string; time: string; status?: string }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    actor: string;
    actorRole: string;
    note: string;
    time: string;
  }>;
  payments: Array<{
    id: string;
    amount: string;
    method: string;
    status: string;
    providerNetAmount: string;
    companyCommissionAmount: string;
    companyStatus: string;
    createdAt: string;
  }>;
  reviews: Array<{
    id: string;
    reviewer: string;
    reviewFor: string;
    reviewerRole: string;
    rating: number;
    comment: string;
    reply?: string;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    sender: string;
    senderRole: string;
    message: string;
    createdAt: string;
  }>;
  images: Array<{
    id: string;
    label: string;
    url: string;
    fileName?: string;
    mimeType?: string;
  }>;
};

type ProviderProfileRow = {
  id: string;
  marketing_name?: string | null;
  profile_photo_url?: string | null;
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
        document_front_url?: string | null;
        document_back_url?: string | null;
        front_image_name?: string | null;
        back_image_name?: string | null;
        requested_documents?: string[] | null;
        admin_note?: string | null;
        last_reviewed_at?: string | null;
        identity_document_type?: string | null;
        identity_front_image_url?: string | null;
        identity_back_image_url?: string | null;
      }
    | Array<{
        phone_verified?: boolean | null;
        email_verified?: boolean | null;
        identity_verified?: boolean | null;
        kyc_verified?: boolean | null;
        background_check_verified?: boolean | null;
        document_type?: string | null;
        document_front_url?: string | null;
        document_back_url?: string | null;
        front_image_name?: string | null;
        back_image_name?: string | null;
        requested_documents?: string[] | null;
        admin_note?: string | null;
        last_reviewed_at?: string | null;
        identity_document_type?: string | null;
        identity_front_image_url?: string | null;
        identity_back_image_url?: string | null;
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
  document_front_url?: string | null;
  document_back_url?: string | null;
  front_image_name?: string | null;
  back_image_name?: string | null;
  requested_documents?: string[] | null;
  admin_note?: string | null;
  last_reviewed_at?: string | null;
  identity_document_type?: string | null;
  identity_front_image_url?: string | null;
  identity_back_image_url?: string | null;
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
  emergency_contact?: string | null;
  profile_image_name?: string | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
};

type ProviderRegistrationFallback = {
  profilePhotoUrl?: string;
  profilePhotoName?: string;
  serviceLocation?: string;
  serviceRadiusKm?: number;
  dateOfBirth?: string;
  sex?: string;
  residentialAddress?: string;
  emergencyContact?: string;
  currentLatitude?: number;
  currentLongitude?: number;
};

type ProviderUploadedDocumentRow = {
  id: string;
  provider_id: string;
  document_type?: string | null;
  label?: string | null;
  file_url?: string | null;
  notes?: string | null;
  status?: string | null;
  created_at?: string | null;
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
  quoted_amount?: number | null;
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
  booking_id?: string | null;
  status?: string | null;
  amount?: number | null;
  payment_method?: string | null;
  payment_option?: string | null;
  created_at?: string | null;
  company_commission_amount?: number | null;
  company_payment_status?: string | null;
  company_paid_at?: string | null;
  provider_net_amount?: number | null;
  customer_payment_proof_data_url?: string | null;
  customer_payment_proof_file_name?: string | null;
  customer_payment_proof_mime_type?: string | null;
  provider_company_payment_proof_data_url?: string | null;
  provider_company_payment_proof_file_name?: string | null;
  provider_company_payment_proof_mime_type?: string | null;
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

type LiveReportRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  created_at?: string | null;
  reporter_id?: string | null;
  reported_user_id?: string | null;
};

type LoginAuditRow = {
  id: string;
  created_at?: string | null;
};

type ProviderProfilePayload = {
  detail: ProviderDetailRecord | null;
};

type ProviderOverviewFallbackDocument = {
  id?: string;
  document_type?: string | null;
  label?: string | null;
  file_url?: string | null;
  notes?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type ProviderOverviewFallbackImage = {
  image_url?: string | null;
  title?: string | null;
  caption?: string | null;
};

type ProviderOverviewFallbackPayload = {
  ok?: boolean;
  provider?: {
    profile_photo_url?: string | null;
    emergency_contact?: string | null;
    verification_phone?: string | null;
  } | null;
  documents?: ProviderOverviewFallbackDocument[] | null;
  images?: ProviderOverviewFallbackImage[] | null;
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

const adminProviderVerificationApiUrl =
  import.meta.env.VITE_ADMIN_PROVIDER_VERIFICATION_URL?.trim() ||
  "/api/admin/providers/verification";
const adminStorageResolveApiUrl =
  import.meta.env.VITE_ADMIN_STORAGE_RESOLVE_URL?.trim() ||
  "/api/admin/storage/resolve";

function relationItem<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function getAdminAccessToken() {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

type StorageAssetSpec = {
  bucket: string;
  path: string;
};

function isAbsoluteAssetUrl(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return /^(https?:\/\/|data:|blob:)/i.test(trimmed);
}

function normalizeStoragePath(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed || isAbsoluteAssetUrl(trimmed)) {
    return "";
  }

  return trimmed.replace(/^\/+/, "");
}

async function resolveStorageAssets(specs: StorageAssetSpec[]) {
  if (!supabase || !specs.length) {
    return new Map<string, string>();
  }

  const accessToken = await getAdminAccessToken();

  if (!accessToken) {
    return new Map<string, string>();
  }

  try {
    const response = await fetch(adminStorageResolveApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ assets: specs }),
    });

    if (!response.ok) {
      return new Map<string, string>();
    }

    const payload = (await response.json().catch(() => ({}))) as {
      assets?: Array<{ bucket?: string; path?: string; url?: string }>;
    };

    return new Map(
      (payload.assets ?? [])
        .filter((item) => item.bucket?.trim() && item.path?.trim() && item.url?.trim())
        .map((item) => [`${item.bucket!.trim()}:${item.path!.trim()}`, item.url!.trim()] as const),
    );
  } catch {
    return new Map<string, string>();
  }
}

function applyResolvedAssetUrl(value: string | null | undefined, bucket: string, resolved: Map<string, string>) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return undefined;
  }

  if (isAbsoluteAssetUrl(trimmed)) {
    return trimmed;
  }

  const normalizedPath = normalizeStoragePath(trimmed);
  return resolved.get(`${bucket}:${normalizedPath}`) ?? trimmed;
}

function buildStorageResolveSpecs(
  profilePhotoUrl: string | null | undefined,
  verification: ProviderVerificationRow | null,
  serviceImageFiles: string[],
  certificateImageFiles: string[],
  uploadedDocuments: ProviderUploadedDocumentRow[],
) {
  const specs = new Map<string, StorageAssetSpec>();

  function add(bucket: string, pathValue: string | null | undefined) {
    const path = normalizeStoragePath(pathValue);
    if (!bucket || !path) {
      return;
    }

    specs.set(`${bucket}:${path}`, { bucket, path });
  }

  add("profile-images", profilePhotoUrl);
  add("identity-documents", verification?.identity_front_image_url ?? verification?.document_front_url);
  add("identity-documents", verification?.identity_back_image_url ?? verification?.document_back_url);

  for (const value of serviceImageFiles) {
    add("provider-work-images", value);
  }

  for (const value of certificateImageFiles) {
    add("certificates", value);
  }

  for (const document of uploadedDocuments) {
    const type = document.document_type?.trim().toLowerCase() ?? "";
    const fileUrl = document.file_url?.trim() ?? "";

    if (!fileUrl) {
      continue;
    }

    if (type === "certificate" || type.startsWith("service_certificate_")) {
      add("certificates", fileUrl);
      continue;
    }

    add("identity-documents", fileUrl);
  }

  return [...specs.values()];
}

async function postProviderVerificationAction(payload: Record<string, unknown>) {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const accessToken = await getAdminAccessToken();

  if (!accessToken) {
    return { error: "Admin session expired. Please sign in again." };
  }

  try {
    const response = await fetch(adminProviderVerificationApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = (await response.json().catch(() => ({}))) as {
      error?: string;
      warning?: string | null;
      success?: boolean;
    };

    if (!response.ok) {
      return {
        error: responsePayload.error || "Unable to update provider verification.",
      };
    }

    return {
      error: null,
      warning: responsePayload.warning ?? null,
    };
  } catch {
    return {
      error: "Unable to reach the admin verification service.",
    };
  }
}

async function getAdminAccessHeaders() {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
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

function formatRadius(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return "Not set";
  }

  return `${value.toFixed(0)} km`;
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

function formatCoordinatesFromNumbers(latitude?: number | null, longitude?: number | null) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return "Not captured";
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getNestedValue(source: unknown, path: string[]) {
  let current = source;

  for (const segment of path) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function pickNestedText(source: unknown, paths: string[][]) {
  for (const path of paths) {
    const value = normalizeText(getNestedValue(source, path));
    if (value) {
      return value;
    }
  }

  return "";
}

function pickNestedNumber(source: unknown, paths: string[][]) {
  for (const path of paths) {
    const value = normalizeNumber(getNestedValue(source, path));
    if (typeof value === "number") {
      return value;
    }
  }

  return null;
}

async function fetchProviderRegistrationFallback(providerId: string): Promise<ProviderRegistrationFallback | null> {
  try {
    const response = await fetch(`/api/provider/register/${providerId}`);

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: unknown };
    const data = payload?.data;

    if (!data || typeof data !== "object") {
      return null;
    }

    const profilePhotoUrl = pickNestedText(data, [
      ["basicProfile", "profileImageUrl"],
      ["basicProfile", "profilePhotoUrl"],
      ["basicProfile", "profile_photo_url"],
      ["basicProfile", "photoUrl"],
    ]);
    const profilePhotoName = pickNestedText(data, [
      ["basicProfile", "profileImageName"],
      ["basicProfile", "profilePhotoName"],
      ["basicProfile", "profile_image_name"],
      ["basicProfile", "photoName"],
    ]);
    const emergencyContact = pickNestedText(data, [
      ["basicProfile", "emergencyContact"],
      ["basicProfile", "emergency_contact"],
      ["account", "emergencyContact"],
      ["account", "emergency_contact"],
      ["verification", "emergencyContact"],
      ["verification", "emergency_contact"],
    ]);

    return {
      profilePhotoUrl: profilePhotoUrl || undefined,
      profilePhotoName: profilePhotoName || undefined,
      serviceLocation:
        pickNestedText(data, [
          ["providerLocation", "areaLabel"],
          ["basicProfile", "serviceLocation"],
        ]) || undefined,
      serviceRadiusKm:
        pickNestedNumber(data, [
          ["providerLocation", "radius"],
          ["basicProfile", "serviceRadius"],
        ]) ?? undefined,
      dateOfBirth: pickNestedText(data, [["basicProfile", "dateOfBirth"]]) || undefined,
      sex: pickNestedText(data, [["basicProfile", "sex"]]) || undefined,
      residentialAddress: pickNestedText(data, [["basicProfile", "residentialAddress"]]) || undefined,
      emergencyContact: emergencyContact || undefined,
      currentLatitude: pickNestedNumber(data, [["providerLocation", "latitude"]]) ?? undefined,
      currentLongitude: pickNestedNumber(data, [["providerLocation", "longitude"]]) ?? undefined,
    };
  } catch {
    return null;
  }
}

async function fetchProviderOverviewFallback(providerId: string): Promise<ProviderOverviewFallbackPayload | null> {
  try {
    const response = await fetch(`/api/providers/${providerId}/overview`);

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as ProviderOverviewFallbackPayload | null;
    return payload?.ok ? payload : null;
  } catch {
    return null;
  }
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

  if (normalized === "review_requested") {
    return "Review Requested";
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

function formatDocumentReviewStatus(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return fallback;
  }

  if (["verified", "approved"].includes(normalized)) {
    return "Verified";
  }

  if (["rejected", "needs_resubmission", "needs_review"].includes(normalized)) {
    return "Rejected";
  }

  if (["pending", "uploaded", "submitted", "in_review"].includes(normalized)) {
    return "Pending";
  }

  return toTitleCase(normalized);
}

async function tryFetchProviderUploadedDocuments(providerId: string) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("provider_documents")
    .select("id, provider_id, document_type, label, file_url, notes, status, created_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as ProviderUploadedDocumentRow[];
}

function findUploadedDocument(
  rows: ProviderUploadedDocumentRow[],
  matchers: string[],
) {
  const normalizedMatchers = matchers.map((value) => value.trim().toLowerCase());

  return rows.find((row) => {
    const type = row.document_type?.trim().toLowerCase() ?? "";
    const label = row.label?.trim().toLowerCase() ?? "";
    return normalizedMatchers.some((matcher) => type === matcher || label.includes(matcher));
  }) ?? null;
}

function collectUploadedDocuments(
  rows: ProviderUploadedDocumentRow[],
  matcher: (row: ProviderUploadedDocumentRow) => boolean,
) {
  return rows.filter(matcher);
}

function mergeUploadedDocuments(
  primary: ProviderUploadedDocumentRow[],
  fallback: ProviderUploadedDocumentRow[],
) {
  const merged = [...primary];
  const seen = new Set(
    primary.map((row) =>
      [
        row.document_type?.trim().toLowerCase() ?? "",
        row.file_url?.trim().toLowerCase() ?? "",
        row.label?.trim().toLowerCase() ?? "",
      ].join("|"),
    ),
  );

  for (const row of fallback) {
    const key = [
      row.document_type?.trim().toLowerCase() ?? "",
      row.file_url?.trim().toLowerCase() ?? "",
      row.label?.trim().toLowerCase() ?? "",
    ].join("|");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(row);
  }

  return merged;
}

function buildProofAsset(
  label: string,
  url: string | null | undefined,
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
) {
  const trimmedUrl = url?.trim();

  if (!trimmedUrl) {
    return null;
  }

  return {
    label,
    url: trimmedUrl,
    fileName: fileName?.trim() || undefined,
    mimeType: mimeType?.trim() || undefined,
  };
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

  const { data: accountRows, error: accountError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (accountError || !accountRows?.length) {
    return null;
  }

  const accounts = (accountRows as ProviderAccountRow[]).filter((account) => {
    const normalizedRole = account.role?.trim().toLowerCase() ?? "";
    return normalizedRole === "provider" || normalizedRole === "service_provider";
  });

  if (!accounts.length) {
    return null;
  }

  const ids = accounts.map((account) => account.id);

  const [{ data: providerProfileRows }, { data: serviceRows }, { data: verificationRows }, { data: metadataRows }] = await Promise.all([
    supabase
      .from("provider_profiles")
      .select("id, marketing_name, profile_photo_url, service_location, service_radius_km, date_of_birth, sex, residential_address, bio, average_rating, total_reviews, approval_status, is_visible")
      .in("id", ids),
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
      .select("provider_id, phone_verified, email_verified, identity_verified, kyc_verified, background_check_verified, document_type, document_front_url, document_back_url, front_image_name, back_image_name, requested_documents, admin_note, last_reviewed_at, identity_document_type, identity_front_image_url, identity_back_image_url")
      .in("provider_id", ids),
    supabase
      .from("provider_admin_metadata")
      .select("provider_id, availability_days, availability_time_preset, availability_start_time, availability_end_time, service_image_captions, certificate_image_captions, service_image_files, certificate_image_files, emergency_contact, profile_image_name, current_latitude, current_longitude")
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
  const providerProfileById = new Map(
    ((providerProfileRows as ProviderProfileRow[] | null | undefined) ?? []).map((row) => [row.id, row])
  );

  return accounts.map((account) => {
    const profile = providerProfileById.get(account.id);

    return {
      id: account.id,
      marketing_name: profile?.marketing_name ?? account.full_name ?? null,
      profile_photo_url: profile?.profile_photo_url ?? null,
      service_location: profile?.service_location ?? null,
      service_radius_km: profile?.service_radius_km ?? null,
      date_of_birth: profile?.date_of_birth ?? null,
      sex: profile?.sex ?? null,
      residential_address: profile?.residential_address ?? null,
      bio: profile?.bio ?? null,
      average_rating: profile?.average_rating ?? null,
      total_reviews: profile?.total_reviews ?? null,
      approval_status: profile?.approval_status ?? account.status ?? null,
      is_visible: profile?.is_visible ?? null,
      provider_services: servicesByProvider.get(account.id) ?? null,
      provider_verifications: verificationByProvider.get(account.id) ?? null,
      provider_admin_metadata: metadataByProvider.get(account.id) ?? null,
    };
  });
}

async function fetchProviderProfileById(providerId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const account = await fetchProviderAccountById(providerId);
  const normalizedRole = account?.role?.trim().toLowerCase() ?? "";

  if (!account || (normalizedRole !== "provider" && normalizedRole !== "service_provider")) {
    return null;
  }

  const [{ data: providerProfile }, { data: serviceRows }, { data: verificationRow }, { data: metadataRow }] = await Promise.all([
    supabase
      .from("provider_profiles")
      .select("id, marketing_name, profile_photo_url, service_location, service_radius_km, date_of_birth, sex, residential_address, bio, average_rating, total_reviews, approval_status, is_visible")
      .eq("id", providerId)
      .maybeSingle(),
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
      .select("provider_id, phone_verified, email_verified, identity_verified, kyc_verified, background_check_verified, document_type, document_front_url, document_back_url, front_image_name, back_image_name, requested_documents, admin_note, last_reviewed_at, identity_document_type, identity_front_image_url, identity_back_image_url")
      .eq("provider_id", providerId)
      .maybeSingle(),
    supabase
      .from("provider_admin_metadata")
      .select("provider_id, availability_days, availability_time_preset, availability_start_time, availability_end_time, service_image_captions, certificate_image_captions, service_image_files, certificate_image_files, emergency_contact, profile_image_name, current_latitude, current_longitude")
      .eq("provider_id", providerId)
      .maybeSingle(),
  ]);

  return {
    id: providerId,
    marketing_name: (providerProfile as ProviderProfileRow | null | undefined)?.marketing_name ?? account.full_name ?? null,
    profile_photo_url: (providerProfile as ProviderProfileRow | null | undefined)?.profile_photo_url ?? null,
    service_location: (providerProfile as ProviderProfileRow | null | undefined)?.service_location ?? null,
    service_radius_km: (providerProfile as ProviderProfileRow | null | undefined)?.service_radius_km ?? null,
    date_of_birth: (providerProfile as ProviderProfileRow | null | undefined)?.date_of_birth ?? null,
    sex: (providerProfile as ProviderProfileRow | null | undefined)?.sex ?? null,
    residential_address: (providerProfile as ProviderProfileRow | null | undefined)?.residential_address ?? null,
    bio: (providerProfile as ProviderProfileRow | null | undefined)?.bio ?? null,
    average_rating: (providerProfile as ProviderProfileRow | null | undefined)?.average_rating ?? null,
    total_reviews: (providerProfile as ProviderProfileRow | null | undefined)?.total_reviews ?? null,
    approval_status: (providerProfile as ProviderProfileRow | null | undefined)?.approval_status ?? account.status ?? null,
    is_visible: (providerProfile as ProviderProfileRow | null | undefined)?.is_visible ?? null,
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
      quoted_amount,
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
    .select("id, booking_id, status, amount, payment_method, payment_option, created_at, company_commission_amount, company_payment_status, company_paid_at, provider_net_amount, customer_payment_proof_data_url, customer_payment_proof_file_name, customer_payment_proof_mime_type, provider_company_payment_proof_data_url, provider_company_payment_proof_file_name, provider_company_payment_proof_mime_type, provider_id")
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

async function tryFetchProviderReports(providerId: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_reports")
    .select("id, title, status, priority, category, created_at, reporter_id, reported_user_id")
    .eq("reported_user_id", providerId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    return null;
  }

  return data as LiveReportRow[];
}

async function tryFetchProviderLastLogin(providerId: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("login_audit_events")
    .select("id, created_at")
    .eq("user_id", providerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as LoginAuditRow;
}

function buildTaskRows(liveRows: LiveBookingRow[], customerNames: Map<string, string>): {
  completedTaskRows: ProviderTaskRow[];
  upcomingTaskRows: ProviderUpcomingTaskRow[];
  cancelledTaskRows: ProviderCancelledTaskRow[];
} {
  const completedTaskRows = liveRows
    .filter((row) =>
      ["completed", "paid", "review_requested", "reviewed"].includes((row.booking_status ?? "").toLowerCase())
    )
    .slice(0, 5)
    .map((row) => {
      const service = relationItem(row.provider_services);
      return {
        id: row.id.startsWith("#") ? row.id : `#${row.id.slice(0, 8).toUpperCase()}`,
        rawId: row.id,
        service: humanizeService(service?.service_type),
        customer: customerNames.get(row.customer_id ?? "") || "Customer",
        date: formatDate(row.scheduled_date),
        amount: formatCurrency(row.quoted_amount ?? 0),
        status: mapTaskStatus(row.booking_status),
      };
    });

  const upcomingTaskRows = liveRows
    .filter(
      (row) =>
        !["completed", "paid", "review_requested", "reviewed", "cancelled", "canceled", "declined"].includes(
          (row.booking_status ?? "").toLowerCase()
        )
    )
    .slice(0, 5)
    .map((row) => {
      const service = relationItem(row.provider_services);
      return {
        id: row.id.startsWith("#") ? row.id : `#${row.id.slice(0, 8).toUpperCase()}`,
        rawId: row.id,
        service: humanizeService(service?.service_type),
        customer: customerNames.get(row.customer_id ?? "") || "Customer",
        schedule: formatSchedule(row.scheduled_date, row.scheduled_start_time),
        amount: formatCurrency(row.quoted_amount ?? 0),
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
        rawId: row.id,
        service: humanizeService(service?.service_type),
        customer: customerNames.get(row.customer_id ?? "") || "Customer",
        schedule: formatSchedule(row.scheduled_date, row.scheduled_start_time),
        amount: formatCurrency(row.quoted_amount ?? 0),
        status: mapTaskStatus(row.booking_status),
        reason: row.decline_reason?.trim() || "No reason recorded",
      };
    });

  return { completedTaskRows, upcomingTaskRows, cancelledTaskRows };
}

function isCompletedLikeBookingStatus(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return ["completed", "paid", "review_requested", "reviewed"].includes(normalized);
}

function buildPayoutRows(livePayments: LivePaymentRow[]): ProviderPayoutRow[] {
  return livePayments.slice(0, 5).map((row) => ({
    id: row.id.startsWith("#") ? row.id : `#${row.id.slice(0, 8).toUpperCase()}`,
    bookingId: row.booking_id?.trim()
      ? row.booking_id.startsWith("#")
        ? row.booking_id
        : `#${row.booking_id.slice(0, 8).toUpperCase()}`
      : undefined,
    type: row.payment_option?.trim() || row.payment_method?.trim() || "Payment",
    amount: formatCurrency(row.provider_net_amount ?? 0),
    grossAmount: formatCurrency(row.amount ?? 0),
    providerNetAmount: formatCurrency(row.provider_net_amount ?? 0),
    companyCommissionAmount: formatCurrency(row.company_commission_amount ?? 0),
    commissionStatus: formatStatus(row.company_payment_status ?? "unpaid"),
    companyPaidAt: formatDateTime(row.company_paid_at),
    customerPaymentProof: buildProofAsset(
      "Customer payment proof",
      row.customer_payment_proof_data_url,
      row.customer_payment_proof_file_name,
      row.customer_payment_proof_mime_type,
    ),
    providerCompanyPaymentProof: buildProofAsset(
      "Provider company payment proof",
      row.provider_company_payment_proof_data_url,
      row.provider_company_payment_proof_file_name,
      row.provider_company_payment_proof_mime_type,
    ),
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

function buildReportRows(liveReports: LiveReportRow[], profileNames: Map<string, string>): ProviderReportRowItem[] {
  return liveReports.map((row) => ({
    id: row.id.startsWith("#") ? row.id : `#${row.id.slice(0, 8).toUpperCase()}`,
    title: row.title?.trim() || "General report",
    reporter: profileNames.get(row.reporter_id ?? "") || "Reporter",
    status: formatStatus(row.status),
    priority: toTitleCase(row.priority?.trim() || row.category?.trim() || "submitted"),
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
  const completedTasks =
    taskRows?.filter((row) => isCompletedLikeBookingStatus(row.booking_status)).length ?? 0;
  const upcomingTasks =
    taskRows?.filter(
      (row) =>
        !["completed", "paid", "review_requested", "reviewed", "cancelled", "canceled", "declined"].includes(
          (row.booking_status ?? "").toLowerCase()
        )
    ).length ?? 0;
  const totalEarnings = paymentRows?.reduce((sum, row) => sum + (row.provider_net_amount ?? 0), 0) ?? 0;
  const withdrawn = paymentRows?.reduce((sum, row) => {
    const isPaid = (row.company_payment_status ?? "").trim().toLowerCase() === "paid";
    return isPaid ? sum + (row.provider_net_amount ?? 0) : sum;
  }, 0) ?? 0;
  const completionRate = totalTasks > 0 ? `${((completedTasks / totalTasks) * 100).toFixed(1)}%` : "0.0%";

  return [
    { id: "lpm-1", label: "Total Tasks", value: String(totalTasks), note: "View all tasks", tone: "emerald" },
    { id: "lpm-2", label: "Completed Tasks", value: String(completedTasks), note: completionRate, tone: "emerald" },
    { id: "lpm-3", label: "Upcoming Tasks", value: String(upcomingTasks), note: "Next 7 days", tone: "violet" },
    fallbackMetrics[3] ?? { id: "lpm-4", label: "Active Time", value: "0h 0m", note: "Total logged hours", tone: "sky" },
    { id: "lpm-5", label: "Service Areas", value: String(serviceAreaCount || 1), note: "Areas covered", tone: "amber" },
    { id: "lpm-6", label: "Total Earnings", value: formatCurrency(totalEarnings), note: "All time", tone: "emerald" },
    { id: "lpm-7", label: "Withdrawn", value: formatCurrency(withdrawn), note: "Company-paid payouts", tone: "violet" },
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
  registrationFallback?: ProviderRegistrationFallback | null,
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
    profilePhotoUrl: liveProfile.profile_photo_url?.trim() || registrationFallback?.profilePhotoUrl || undefined,
    profilePhotoName: metadata?.profile_image_name?.trim() || registrationFallback?.profilePhotoName || undefined,
    status: formatStatus(liveAccount?.status ?? (liveProfile.is_visible === false ? "paused" : "active")),
    visibilityStatus: liveProfile.is_visible === false ? "Hidden" : "Visible",
    roleBadge: "Provider",
    joinedAt,
    lastLogin: "Recently active",
    serviceType: humanizeService(firstService?.service_type),
    serviceArea: liveProfile.service_location?.trim() || registrationFallback?.serviceLocation || "Malaysia",
    serviceRadiusKm: formatRadius(liveProfile.service_radius_km ?? registrationFallback?.serviceRadiusKm),
    yearsExperience: firstService?.years_experience?.trim() || "Not set",
    hourlyRate: formatRate(firstService?.hourly_rate, " / hr"),
    dailyRate: formatRate(firstService?.daily_rate, " / day"),
    currentCoordinates:
      formatCoordinates(metadata) !== "Not captured"
        ? formatCoordinates(metadata)
        : formatCoordinatesFromNumbers(registrationFallback?.currentLatitude, registrationFallback?.currentLongitude),
    rating: typeof liveProfile.average_rating === "number" ? liveProfile.average_rating.toFixed(1) : "0.0",
    ratingNote: `(${liveProfile.total_reviews ?? 0} reviews)`,
    phone: liveAccount?.phone?.trim() || "Not provided",
    dob: formatDateOfBirth(liveProfile.date_of_birth || registrationFallback?.dateOfBirth),
    gender: liveProfile.sex?.trim() || registrationFallback?.sex || "Not provided",
    language: "Not provided",
    nationalId: verification?.document_type?.trim() || "Document pending",
    emergencyContact: metadata?.emergency_contact?.trim() || registrationFallback?.emergencyContact || "Not provided",
    address: liveProfile.residential_address?.trim() || registrationFallback?.residentialAddress || "Not provided",
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
          label:
            verification?.identity_document_type?.trim() ||
            verification?.document_type?.trim() ||
            "Identity Document",
          status: formatDocumentStatus(
            Boolean(verification?.identity_verified),
            Boolean(verification?.requested_documents?.includes(providerDocumentRequestOptions[0])),
          ),
          fileName: verification?.front_image_name?.trim() || undefined,
          fileUrl:
            verification?.identity_front_image_url?.trim() ||
            verification?.document_front_url?.trim() ||
            undefined,
          updated: verification?.last_reviewed_at ? formatDate(verification.last_reviewed_at) : undefined,
        },
        {
          id: "live-doc-back",
          label: "Back of Document",
        status: verification?.back_image_name?.trim()
            ? formatDocumentStatus(Boolean(verification?.identity_verified), false)
            : "Pending",
          fileName: verification?.back_image_name?.trim() || undefined,
          fileUrl:
            verification?.identity_back_image_url?.trim() ||
            verification?.document_back_url?.trim() ||
            undefined,
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
    return [];
  }

  const liveAccounts = await Promise.all(liveProfiles.map((profile) => fetchProviderAccountById(profile.id)));
  return liveProfiles.map((profile, index) => mapProviderRow(profile, liveAccounts[index] ?? null));
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
    return { detail: null };
  }

  const liveAccount = await fetchProviderAccountById(providerId);
  const registrationFallback = await fetchProviderRegistrationFallback(providerId);
  const overviewFallback = await fetchProviderOverviewFallback(providerId);
  const firstService = relationItem(liveProfile.provider_services);
  const verification = relationItem(liveProfile.provider_verifications);
  const metadata = liveProfile.provider_admin_metadata ?? null;
  const serviceKey = firstService?.service_type?.trim().toLowerCase() || "";
  const generatedDetail = buildGeneratedProviderDetail(
    providerId,
    liveProfile,
    liveAccount,
    firstService,
    registrationFallback,
  );
  const baseDetail = generatedDetail;
  const serviceAreas = [{
    id: "live-sa-1",
    label: liveProfile.service_location?.trim() || registrationFallback?.serviceLocation || "Malaysia",
    tag: "Primary",
  }];

  const liveTasks = await tryFetchProviderTasks(providerId);
  const livePayments = await tryFetchProviderPayments(providerId);
  const liveReviews = await tryFetchProviderReviews(providerId);
  const liveLastLogin = await tryFetchProviderLastLogin(providerId);
  const uploadedDocuments = await tryFetchProviderUploadedDocuments(providerId);
  const overviewDocuments = (overviewFallback?.documents ?? []).map((document) => ({
    id: document.id?.trim() || crypto.randomUUID(),
    provider_id: providerId,
    document_type: document.document_type?.trim() || null,
    label: document.label?.trim() || null,
    file_url: document.file_url?.trim() || null,
    notes: document.notes?.trim() || null,
    status: document.status?.trim() || null,
    created_at: document.created_at?.trim() || null,
  }));
  const mergedUploadedDocuments = mergeUploadedDocuments(uploadedDocuments, overviewDocuments);
  const overviewServiceImageFiles = (overviewFallback?.images ?? [])
    .map((image) => image.image_url?.trim() || "")
    .filter(Boolean);
  const overviewServiceImageCaptions = (overviewFallback?.images ?? [])
    .map((image) => image.caption?.trim() || image.title?.trim() || "")
    .filter(Boolean);
  const customerNames = await fetchProfileNameMap([
    ...(liveTasks?.map((row) => row.customer_id) ?? []),
    ...(liveReviews?.map((row) => row.customer_id) ?? []),
  ]);
  const taskRows = liveTasks?.length ? buildTaskRows(liveTasks, customerNames) : null;
  const payoutRows = livePayments?.length ? buildPayoutRows(livePayments) : baseDetail.payoutRows;
  const reviewRows = liveReviews?.length ? buildReviewRows(liveReviews, customerNames) : [];
  const metrics = buildMetrics(
    baseDetail.metrics,
    liveTasks,
    livePayments,
    serviceAreas.length,
    liveProfile.average_rating,
    liveProfile.total_reviews
  );

  const status = formatStatus(liveAccount?.status ?? (liveProfile.is_visible === false ? "paused" : "active"));
  const identityFrontDocument = findUploadedDocument(mergedUploadedDocuments, ["ic_front", "identity_front", "passport_front"]);
  const identityBackDocument = findUploadedDocument(mergedUploadedDocuments, ["ic_back", "identity_back", "passport_back"]);
  const drivingLicenseDocument = findUploadedDocument(mergedUploadedDocuments, ["driving_license"]);
  const certificateDocuments = collectUploadedDocuments(
    mergedUploadedDocuments,
    (row) => {
      const type = row.document_type?.trim().toLowerCase() ?? "";
      return type === "certificate" || type.startsWith("service_certificate_");
    },
  );
  const liveCertificateFiles = certificateDocuments
    .map((row) => row.file_url?.trim())
    .filter((value): value is string => Boolean(value));
  const liveServiceFiles =
    serviceKey && metadata?.service_image_files?.[serviceKey]?.length
      ? metadata.service_image_files[serviceKey]?.filter(Boolean) ?? []
      : [];
  const metadataCertificateFiles =
    serviceKey && metadata?.certificate_image_files?.[serviceKey]?.length
      ? metadata.certificate_image_files[serviceKey]?.filter(Boolean) ?? []
      : [];
  const resolvedAssets = await resolveStorageAssets(
    buildStorageResolveSpecs(
      liveProfile.profile_photo_url || overviewFallback?.provider?.profile_photo_url,
      verification,
      liveServiceFiles.length ? liveServiceFiles : overviewServiceImageFiles,
      metadataCertificateFiles.length ? metadataCertificateFiles : liveCertificateFiles,
      mergedUploadedDocuments,
    ),
  );
  const resolvedProfilePhotoUrl = applyResolvedAssetUrl(
    liveProfile.profile_photo_url?.trim() ||
      overviewFallback?.provider?.profile_photo_url?.trim() ||
      registrationFallback?.profilePhotoUrl,
    "profile-images",
    resolvedAssets,
  );
  const resolvedIdentityFrontUrl = applyResolvedAssetUrl(
    identityFrontDocument?.file_url?.trim() ||
      verification?.identity_front_image_url?.trim() ||
      verification?.document_front_url?.trim(),
    "identity-documents",
    resolvedAssets,
  );
  const resolvedIdentityBackUrl = applyResolvedAssetUrl(
    identityBackDocument?.file_url?.trim() ||
      verification?.identity_back_image_url?.trim() ||
      verification?.document_back_url?.trim(),
    "identity-documents",
    resolvedAssets,
  );
  const resolvedDrivingLicenseUrl = applyResolvedAssetUrl(
    drivingLicenseDocument?.file_url?.trim(),
    "identity-documents",
    resolvedAssets,
  );
  const resolvedServiceImageFiles = liveServiceFiles.map((value) =>
    applyResolvedAssetUrl(value, "provider-work-images", resolvedAssets) ?? value,
  );
  const resolvedOverviewServiceImageFiles = overviewServiceImageFiles.map((value) =>
    applyResolvedAssetUrl(value, "provider-work-images", resolvedAssets) ?? value,
  );
  const resolvedCertificateImageFiles = (
    metadataCertificateFiles.length ? metadataCertificateFiles : liveCertificateFiles
  ).map((value) => applyResolvedAssetUrl(value, "certificates", resolvedAssets) ?? value);

  const detail: ProviderDetailRecord = {
    ...baseDetail,
    providerId,
    name: liveProfile.marketing_name?.trim() || liveAccount?.full_name?.trim() || baseDetail.name,
    email: liveAccount?.email?.trim() || baseDetail.email,
    profilePhotoUrl: resolvedProfilePhotoUrl || baseDetail.profilePhotoUrl,
    profilePhotoName: metadata?.profile_image_name?.trim() || registrationFallback?.profilePhotoName || baseDetail.profilePhotoName,
    status,
    visibilityStatus: liveProfile.is_visible === false ? "Hidden" : "Visible",
    joinedAt: formatDateTime(liveAccount?.created_at) || baseDetail.joinedAt,
    lastLogin: liveLastLogin?.created_at ? formatDateTime(liveLastLogin.created_at) : baseDetail.lastLogin,
    serviceType: humanizeService(firstService?.service_type),
    serviceArea: liveProfile.service_location?.trim() || registrationFallback?.serviceLocation || baseDetail.serviceArea,
    serviceRadiusKm: formatRadius(liveProfile.service_radius_km ?? registrationFallback?.serviceRadiusKm),
    yearsExperience: firstService?.years_experience?.trim() || baseDetail.yearsExperience,
    hourlyRate: formatRate(firstService?.hourly_rate, " / hr"),
    dailyRate: formatRate(firstService?.daily_rate, " / day"),
    currentCoordinates:
      formatCoordinates(metadata) !== "Not captured"
        ? formatCoordinates(metadata)
        : formatCoordinatesFromNumbers(registrationFallback?.currentLatitude, registrationFallback?.currentLongitude),
    rating: typeof liveProfile.average_rating === "number" ? liveProfile.average_rating.toFixed(1) : baseDetail.rating,
    ratingNote: `(${liveProfile.total_reviews ?? (Number(baseDetail.totalReviews) || 0)} reviews)`,
    phone: liveAccount?.phone?.trim() || baseDetail.phone,
    dob: formatDateOfBirth(liveProfile.date_of_birth || registrationFallback?.dateOfBirth) || baseDetail.dob,
    gender: liveProfile.sex?.trim() || registrationFallback?.sex || baseDetail.gender,
    emergencyContact:
      metadata?.emergency_contact?.trim() ||
      overviewFallback?.provider?.emergency_contact?.trim() ||
      overviewFallback?.provider?.verification_phone?.trim() ||
      registrationFallback?.emergencyContact ||
      baseDetail.emergencyContact,
    address: liveProfile.residential_address?.trim() || registrationFallback?.residentialAddress || baseDetail.address,
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
            (liveTasks.filter((row) => ["cancelled", "canceled", "declined"].includes((row.booking_status ?? "").toLowerCase())).length /
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
        ? formatCurrency(livePayments.reduce((sum, row) => sum + (row.provider_net_amount ?? 0), 0))
        : liveTasks?.length
          ? formatCurrency(
              liveTasks.reduce(
                (sum, row) => sum + (isCompletedLikeBookingStatus(row.booking_status) ? (row.quoted_amount ?? 0) : 0),
                0
              )
            )
        : baseDetail.totalEarnings,
    withdrawn:
      livePayments?.length
        ? formatCurrency(
            livePayments.reduce((sum, row) => {
              const isPaid = (row.company_payment_status ?? "").trim().toLowerCase() === "paid";
              return isPaid ? sum + (row.provider_net_amount ?? 0) : sum;
            }, 0)
          )
        : baseDetail.withdrawn,
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
        : overviewServiceImageCaptions.length
          ? overviewServiceImageCaptions
          : baseDetail.serviceImageCaptions ?? [],
    serviceImageFiles:
      resolvedServiceImageFiles.length
        ? resolvedServiceImageFiles
        : resolvedOverviewServiceImageFiles.length
          ? resolvedOverviewServiceImageFiles
          : baseDetail.serviceImageFiles ?? [],
    certificateImageCaptions:
      serviceKey && metadata?.certificate_image_captions?.[serviceKey]?.length
        ? metadata.certificate_image_captions[serviceKey]?.filter(Boolean) ?? []
        : baseDetail.certificateImageCaptions ?? [],
    certificateImageFiles:
      resolvedCertificateImageFiles.length
        ? resolvedCertificateImageFiles
        : liveCertificateFiles.length
          ? liveCertificateFiles.map((value) => applyResolvedAssetUrl(value, "certificates", resolvedAssets) ?? value)
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
          label:
            verification?.identity_document_type?.trim() ||
            verification?.document_type?.trim() ||
            "Identity Verification",
          status:
            formatDocumentReviewStatus(
              identityFrontDocument?.status,
              formatDocumentStatus(
                Boolean(verification?.identity_verified),
              Boolean(verification?.requested_documents?.length),
            ),
          ),
          fileName:
            identityFrontDocument?.label?.trim() ||
            verification?.front_image_name?.trim() ||
            undefined,
          fileUrl: resolvedIdentityFrontUrl,
          note: identityFrontDocument?.notes?.trim() || undefined,
          updated: identityFrontDocument?.created_at
            ? formatDate(identityFrontDocument.created_at)
            : verification?.last_reviewed_at
              ? formatDate(verification.last_reviewed_at)
            : undefined,
      },
      {
          id: "live-doc-4",
          label: "Back of Document",
          status:
            formatDocumentReviewStatus(
              identityBackDocument?.status,
              verification?.back_image_name?.trim() ||
              identityBackDocument?.file_url?.trim() ||
              verification?.identity_back_image_url?.trim() ||
              verification?.document_back_url?.trim()
                ? formatDocumentStatus(Boolean(verification?.identity_verified), false)
                : "Pending",
            ),
          fileName:
            identityBackDocument?.label?.trim() ||
            verification?.back_image_name?.trim() ||
            undefined,
          fileUrl: resolvedIdentityBackUrl,
          note: identityBackDocument?.notes?.trim() || undefined,
          updated: identityBackDocument?.created_at
            ? formatDate(identityBackDocument.created_at)
            : verification?.last_reviewed_at
              ? formatDate(verification.last_reviewed_at)
            : undefined,
      },
      ...(drivingLicenseDocument
        ? [{
            id: "live-doc-5",
            label: "Driving License",
            status: formatDocumentReviewStatus(drivingLicenseDocument.status, "Pending"),
            fileName: drivingLicenseDocument.label?.trim() || "Driving License",
            fileUrl: resolvedDrivingLicenseUrl,
            note: drivingLicenseDocument.notes?.trim() || undefined,
            updated: drivingLicenseDocument.created_at ? formatDate(drivingLicenseDocument.created_at) : undefined,
          }]
        : []),
      ...certificateDocuments.map((document, index) => ({
        id: `live-doc-certificate-${index + 1}`,
        label: document.label?.trim() || `Certificate ${index + 1}`,
        status: formatDocumentReviewStatus(document.status, "Uploaded"),
        fileName: document.label?.trim() || `Certificate ${index + 1}`,
        fileUrl: applyResolvedAssetUrl(document.file_url?.trim(), "certificates", resolvedAssets),
        note: document.notes?.trim() || undefined,
        updated: document.created_at ? formatDate(document.created_at) : undefined,
      })),
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

export async function getProviderReportsWithFallback(providerId: string): Promise<ProviderReportRowItem[]> {
  const liveReports = await tryFetchProviderReports(providerId);

  if (!liveReports?.length) {
    return [];
  }

  const profileNames = await fetchProfileNameMap(liveReports.map((row) => row.reporter_id));
  return buildReportRows(liveReports, profileNames);
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

function timelineHasStatus(
  timeline: ProviderTaskDetail["timeline"],
  matcher: (item: ProviderTaskDetail["timeline"][number]) => boolean,
) {
  return timeline.some(matcher);
}

async function tryFetchTaskDetailDirect(rawBookingId: string): Promise<ProviderTaskDetail | null> {
  if (!supabase) {
    return null;
  }

  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      id,
      customer_id,
      provider_id,
      booking_status,
      booking_mode,
      service_label,
      location_text,
      scheduled_date,
      scheduled_start_time,
      scheduled_end_time,
      customer_note,
      provider_response_note,
      decline_reason,
      quoted_amount,
      created_at,
      accepted_at,
      on_the_way_at,
      arrived_at,
      completed_at,
      paid_at,
      review_requested_at,
      reviewed_at,
      cancelled_at
    `)
    .eq("id", rawBookingId)
    .maybeSingle();

  if (bookingError || !bookingData) {
    return null;
  }

  const booking = bookingData as Record<string, unknown>;

  const [paymentsResult, reviewsResult, messagesResult, historyResult] = await Promise.allSettled([
    supabase
      .from("payments")
      .select(`
        id,
        booking_id,
        amount,
        payment_method,
        payment_option,
        status,
        provider_net_amount,
        company_commission_amount,
        company_payment_status,
        created_at,
        customer_payment_proof_data_url,
        customer_payment_proof_file_name,
        customer_payment_proof_mime_type,
        provider_company_payment_proof_data_url,
        provider_company_payment_proof_file_name,
        provider_company_payment_proof_mime_type
      `)
      .eq("booking_id", rawBookingId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("*")
      .eq("provider_id", normalizeOptionalText(booking.provider_id))
      .eq("customer_id", normalizeOptionalText(booking.customer_id))
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("booking_messages")
      .select("id, sender_id, sender_role, message_text, created_at")
      .eq("booking_id", rawBookingId)
      .order("created_at", { ascending: true }),
    supabase
      .from("booking_status_history")
      .select("id, old_status, new_status, changed_by, changed_by_role, note, created_at")
      .eq("booking_id", rawBookingId)
      .order("created_at", { ascending: true }),
  ]);

  const paymentsRows =
    paymentsResult.status === "fulfilled" && !paymentsResult.value.error ? (paymentsResult.value.data ?? []) : [];
  const reviewRows =
    reviewsResult.status === "fulfilled" && !reviewsResult.value.error ? (reviewsResult.value.data ?? []) : [];
  const messageRows =
    messagesResult.status === "fulfilled" && !messagesResult.value.error ? (messagesResult.value.data ?? []) : [];
  const historyRows =
    historyResult.status === "fulfilled" && !historyResult.value.error ? (historyResult.value.data ?? []) : [];

  const profileNames = await fetchProfileNameMap([
    normalizeOptionalText(booking.customer_id),
    normalizeOptionalText(booking.provider_id),
    ...messageRows.map((row) => normalizeOptionalText((row as Record<string, unknown>).sender_id)),
    ...historyRows.map((row) => normalizeOptionalText((row as Record<string, unknown>).changed_by)),
    ...reviewRows.map((row) => normalizeOptionalText((row as Record<string, unknown>).reviewer_id)),
  ]);

  const messages = messageRows.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: String(item.id ?? ""),
      sender: profileNames.get(normalizeOptionalText(item.sender_id)) || toTitleCase(normalizeOptionalText(item.sender_role) || "user"),
      senderRole: toTitleCase(normalizeOptionalText(item.sender_role) || "user"),
      message: normalizeOptionalText(item.message_text),
      createdAt: formatDateTime(normalizeOptionalText(item.created_at) || null),
    };
  });

  const timeline: ProviderTaskDetail["timeline"] = [
    {
      id: "created",
      title: "Booking created",
      note: "Customer created the booking request.",
      time: formatDateTime(normalizeOptionalText(booking.created_at) || null),
      status: "Created",
    },
    ...(normalizeOptionalText(booking.accepted_at)
      ? [{ id: "accepted_at", title: "Accepted", note: normalizeOptionalText(booking.provider_response_note) || "Provider accepted the task.", time: formatDateTime(normalizeOptionalText(booking.accepted_at)), status: "Accepted" }]
      : []),
    ...(normalizeOptionalText(booking.on_the_way_at)
      ? [{ id: "on_the_way_at", title: "On the way", note: "Provider started travelling to the task location.", time: formatDateTime(normalizeOptionalText(booking.on_the_way_at)), status: "On The Way" }]
      : []),
    ...(normalizeOptionalText(booking.arrived_at)
      ? [{ id: "arrived_at", title: "Arrived", note: "Provider arrived on site.", time: formatDateTime(normalizeOptionalText(booking.arrived_at)), status: "Arrived" }]
      : []),
    ...(normalizeOptionalText(booking.completed_at)
      ? [{ id: "completed_at", title: "Completed", note: "Provider marked the task as completed.", time: formatDateTime(normalizeOptionalText(booking.completed_at)), status: "Completed" }]
      : []),
    ...(normalizeOptionalText(booking.paid_at)
      ? [{ id: "paid_at", title: "Payment done", note: "Payment was marked paid.", time: formatDateTime(normalizeOptionalText(booking.paid_at)), status: "Paid" }]
      : []),
    ...(normalizeOptionalText(booking.review_requested_at)
      ? [{ id: "review_requested_at", title: "Review requested", note: "Provider requested customer review.", time: formatDateTime(normalizeOptionalText(booking.review_requested_at)), status: "Review Requested" }]
      : []),
    ...(normalizeOptionalText(booking.reviewed_at)
      ? [{ id: "reviewed_at", title: "Reviewed", note: "Review flow was completed.", time: formatDateTime(normalizeOptionalText(booking.reviewed_at)), status: "Reviewed" }]
      : []),
    ...(normalizeOptionalText(booking.cancelled_at)
      ? [{ id: "cancelled_at", title: "Cancelled", note: normalizeOptionalText(booking.decline_reason) || "Booking was cancelled.", time: formatDateTime(normalizeOptionalText(booking.cancelled_at)), status: "Cancelled" }]
      : []),
  ];

  const statusHistory = historyRows.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: String(item.id ?? ""),
      fromStatus: toTitleCase(normalizeOptionalText(item.old_status) || "Pending"),
      toStatus: toTitleCase(normalizeOptionalText(item.new_status) || "Pending"),
      actor: profileNames.get(normalizeOptionalText(item.changed_by)) || toTitleCase(normalizeOptionalText(item.changed_by_role) || "admin"),
      actorRole: toTitleCase(normalizeOptionalText(item.changed_by_role) || "admin"),
      note: normalizeOptionalText(item.note) || `${toTitleCase(normalizeOptionalText(item.changed_by_role) || "admin")} updated the task status.`,
      time: formatDateTime(normalizeOptionalText(item.created_at) || null),
    };
  });

  const images = paymentsRows.flatMap((row) => {
    const item = row as Record<string, unknown>;
    const results: ProviderTaskDetail["images"] = [];

    const customerUrl = normalizeOptionalText(item.customer_payment_proof_data_url);
    if (customerUrl) {
      results.push({
        id: `${String(item.id)}-customer-proof`,
        label: "Customer payment proof",
        url: customerUrl,
        fileName: normalizeOptionalText(item.customer_payment_proof_file_name) || undefined,
        mimeType: normalizeOptionalText(item.customer_payment_proof_mime_type) || undefined,
      });
    }

    const providerUrl = normalizeOptionalText(item.provider_company_payment_proof_data_url);
    if (providerUrl) {
      results.push({
        id: `${String(item.id)}-provider-proof`,
        label: "Provider company payment proof",
        url: providerUrl,
        fileName: normalizeOptionalText(item.provider_company_payment_proof_file_name) || undefined,
        mimeType: normalizeOptionalText(item.provider_company_payment_proof_mime_type) || undefined,
      });
    }

    return results;
  });

  const reviews = reviewRows
    .filter((row) => {
      const item = row as Record<string, unknown>;
      const bookingMatch = normalizeOptionalText(item.booking_id) === rawBookingId;
      if (bookingMatch) {
        return true;
      }

      return normalizeOptionalText(item.provider_id) === normalizeOptionalText(booking.provider_id) &&
        normalizeOptionalText(item.customer_id) === normalizeOptionalText(booking.customer_id);
    })
    .map((row) => {
      const item = row as Record<string, unknown>;
      const reviewerRole = pickFirstText(item, ["reviewer_role", "author_role", "created_by_role"]) ||
        (normalizeOptionalText(item.reviewer_id) === normalizeOptionalText(booking.provider_id) ? "Provider" : "Customer");
      const reviewerName = normalizeOptionalText(item.reviewer_id)
        ? profileNames.get(normalizeOptionalText(item.reviewer_id)) || reviewerRole
        : reviewerRole;
      const reviewFor = pickFirstText(item, ["reviewee_role", "target_role"]) ||
        (reviewerRole.toLowerCase() === "provider" ? "Customer" : "Provider");

      return {
        id: String(item.id ?? ""),
        reviewer: reviewerName,
        reviewFor: toTitleCase(reviewFor),
        reviewerRole: toTitleCase(reviewerRole),
        rating: Math.max(1, Math.min(5, Math.round(Number(item.rating ?? 0) || 0))),
        comment: normalizeOptionalText(item.comment) || "No review comment.",
        reply: pickFirstText(item, ["reply", "provider_reply", "customer_reply", "admin_reply"]) || undefined,
        createdAt: formatDateTime(normalizeOptionalText(item.created_at) || null),
      };
    });

  const hasPaymentStep = timelineHasStatus(
    timeline,
    (item) => item.title.toLowerCase().includes("payment") || item.title.toLowerCase().includes("paid")
  );
  const hasCompletedStep = timelineHasStatus(
    timeline,
    (item) => item.title.toLowerCase().includes("completed")
  );
  const hasReviewStep = timelineHasStatus(
    timeline,
    (item) => item.title.toLowerCase().includes("review")
  );

  const latestPaymentTime =
    paymentsRows.length > 0
      ? formatDateTime(normalizeOptionalText((paymentsRows[0] as Record<string, unknown>).created_at) || null)
      : null;
  const latestReviewTime =
    reviews.length > 0 ? reviews[0]?.createdAt ?? null : null;

  if (!hasCompletedStep) {
    const bookingStatus = normalizeOptionalText(booking.booking_status).toLowerCase();
    const shouldShowCompleted =
      bookingStatus === "completed" ||
      bookingStatus === "paid" ||
      paymentsRows.length > 0 ||
      reviews.length > 0;

    if (shouldShowCompleted) {
      timeline.push({
        id: "completed_fallback",
        title: "Completed",
        note: images.length
          ? "Task was completed and supporting images are attached below."
          : "Task was marked completed.",
        time:
          formatDateTime(normalizeOptionalText(booking.completed_at) || null) ||
          latestPaymentTime ||
          latestReviewTime ||
          "Recently active",
        status: "Completed",
      });
    }
  }

  if (!hasPaymentStep && paymentsRows.length > 0) {
    timeline.push({
      id: "payment_fallback",
      title: "Payment Done",
      note: "Payment records and proof images are attached below.",
      time: latestPaymentTime || "Recently active",
      status: "Paid",
    });
  }

  if (!hasReviewStep && reviews.length > 0) {
    timeline.push({
      id: "review_fallback",
      title: "Reviewed",
      note: "Customer and provider review activity is linked to this task.",
      time: latestReviewTime || "Recently active",
      status: "Reviewed",
    });
  }

  return {
    bookingId: rawBookingId.startsWith("#") ? rawBookingId : `#${rawBookingId.slice(0, 8).toUpperCase()}`,
    rawBookingId,
    service: normalizeOptionalText(booking.service_label) || "Service",
    customer: profileNames.get(normalizeOptionalText(booking.customer_id)) || "Customer",
    provider: profileNames.get(normalizeOptionalText(booking.provider_id)) || "Provider",
    status: toTitleCase(normalizeOptionalText(booking.booking_status) || "pending"),
    bookingMode: toTitleCase(normalizeOptionalText(booking.booking_mode) || "standard"),
    amount: formatCurrency(Number(booking.quoted_amount ?? 0)),
    schedule: formatSchedule(normalizeOptionalText(booking.scheduled_date), normalizeOptionalText(booking.scheduled_start_time)),
    location: normalizeOptionalText(booking.location_text) || "Location not captured",
    createdAt: formatDateTime(normalizeOptionalText(booking.created_at) || null),
    scheduledStart: formatDateTime(
      normalizeOptionalText(booking.scheduled_date) && normalizeOptionalText(booking.scheduled_start_time)
        ? `${normalizeOptionalText(booking.scheduled_date)}T${normalizeOptionalText(booking.scheduled_start_time)}`
        : null
    ),
    scheduledEnd: formatDateTime(
      normalizeOptionalText(booking.scheduled_date) && normalizeOptionalText(booking.scheduled_end_time)
        ? `${normalizeOptionalText(booking.scheduled_date)}T${normalizeOptionalText(booking.scheduled_end_time)}`
        : null
    ),
    notes: [
      { label: "Customer note", value: normalizeOptionalText(booking.customer_note) || "No customer note." },
      { label: "Provider response", value: normalizeOptionalText(booking.provider_response_note) || "No provider response note." },
      { label: "Decline / cancel note", value: normalizeOptionalText(booking.decline_reason) || "No decline or cancellation note." },
    ],
    timeline,
    statusHistory,
    payments: paymentsRows.map((row) => {
      const item = row as Record<string, unknown>;
      return {
        id: String(item.id ?? "").startsWith("#") ? String(item.id) : `#${String(item.id ?? "").slice(0, 8).toUpperCase()}`,
        amount: formatCurrency(Number(item.amount ?? 0)),
        method: normalizeOptionalText(item.payment_option) || normalizeOptionalText(item.payment_method) || "Payment",
        status: toTitleCase(normalizeOptionalText(item.status) || "pending"),
        providerNetAmount: formatCurrency(Number(item.provider_net_amount ?? 0)),
        companyCommissionAmount: formatCurrency(Number(item.company_commission_amount ?? 0)),
        companyStatus: toTitleCase(normalizeOptionalText(item.company_payment_status) || "unpaid"),
        createdAt: formatDateTime(normalizeOptionalText(item.created_at) || null),
      };
    }),
    reviews,
    messages,
    images,
  };
}

export async function getProviderTaskDetail(rawBookingId: string): Promise<ProviderTaskDetail | null> {
  if (!rawBookingId.trim()) {
    throw new Error("Booking ID is missing.");
  }

  const directDetail = await tryFetchTaskDetailDirect(rawBookingId);

  if (directDetail) {
    return directDetail;
  }

  const headers = await getAdminAccessHeaders();

  if (!headers) {
    throw new Error("Admin session expired. Please sign in again.");
  }

  try {
    const response = await fetch(`/api/admin/provider-bookings/${rawBookingId}`, {
      headers,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Unable to load booking detail.");
    }

    const payload = (await response.json()) as { detail?: ProviderTaskDetail | null };
    return payload.detail ?? null;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unable to load booking detail.");
  }
}

export async function updateProviderProfile(
  providerId: string,
  updates: {
    full_name?: string;
    email?: string;
    phone?: string;
    status?: string;
    marketing_name?: string;
    profile_photo_url?: string;
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
      profile_photo_url: updates.profile_photo_url,
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
  return postProviderVerificationAction({
    action: "set_visibility",
    providerId,
    active,
  });
}

export async function requestProviderVerificationDocuments(
  providerId: string,
  requestedDocuments: string[],
  note: string,
) {
  return postProviderVerificationAction({
    action: "request_documents",
    providerId,
    requestedDocuments: requestedDocuments
      .map((value) => value.trim())
      .filter(Boolean),
    note: note.trim(),
  });
}

export async function approveProviderVerification(providerId: string, note: string) {
  return postProviderVerificationAction({
    action: "approve",
    providerId,
    note: note.trim(),
  });
}
