import { bookings, payments, users } from "../data/mock-data";
import { userDetailRecords } from "../data/user-detail-mocks";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { DashboardBooking, PaymentRow, UserDetailRecord, UserMetric, UserRow } from "../types";

type ProfileRelation =
  | {
      first_name?: string | null;
      last_name?: string | null;
      city?: string | null;
      region?: string | null;
      state?: string | null;
      country?: string | null;
      phone_number?: string | null;
      country_code?: string | null;
      verified?: boolean | null;
      completion?: number | null;
      marketing_name?: string | null;
      service_location?: string | null;
      approval_status?: string | null;
      date_of_birth?: string | null;
      sex?: string | null;
      residential_address?: string | null;
      provider_verifications?:
        | {
            phone_verified?: boolean | null;
            email_verified?: boolean | null;
            identity_verified?: boolean | null;
            kyc_verified?: boolean | null;
          }
        | Array<{
            phone_verified?: boolean | null;
            email_verified?: boolean | null;
            identity_verified?: boolean | null;
            kyc_verified?: boolean | null;
          }>
        | null;
    }
  | Array<{
      first_name?: string | null;
      last_name?: string | null;
      city?: string | null;
      region?: string | null;
      state?: string | null;
      country?: string | null;
      phone_number?: string | null;
      country_code?: string | null;
      verified?: boolean | null;
      completion?: number | null;
      marketing_name?: string | null;
      service_location?: string | null;
      approval_status?: string | null;
      date_of_birth?: string | null;
      sex?: string | null;
      residential_address?: string | null;
      provider_verifications?:
        | {
            phone_verified?: boolean | null;
            email_verified?: boolean | null;
            identity_verified?: boolean | null;
            kyc_verified?: boolean | null;
          }
        | Array<{
            phone_verified?: boolean | null;
            email_verified?: boolean | null;
            identity_verified?: boolean | null;
            kyc_verified?: boolean | null;
          }>
        | null;
    }>
  | null;

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  phone?: string | null;
  created_at?: string | null;
  customer_profiles?: ProfileRelation;
  provider_profiles?: ProfileRelation;
};

type UserProfilePayload = {
  detail: UserDetailRecord | null;
  relatedBookings: DashboardBooking[];
  relatedPayments: PaymentRow[];
};

type UserCategory = "customers" | "providers" | "internal";

type UserProfileUpdateInput = {
  full_name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  city?: string;
  status?: string;
};

type ProfileNameRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type LiveBookingRow = {
  id: string;
  booking_status?: string | null;
  scheduled_date?: string | null;
  scheduled_start_time?: string | null;
  total_amount?: number | null;
  customer_id?: string | null;
  provider_id?: string | null;
  provider_profiles?: ProfileRelation;
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
  payment_option?: string | null;
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
  provider_profiles?: ProfileRelation;
};

type LoginAuditRow = {
  id: string;
  app_surface?: string | null;
  created_at?: string | null;
};

type UserReportRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type ProfileNameMap = Map<string, string>;

type CustomerProfileRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  region?: string | null;
  state?: string | null;
  country?: string | null;
  date_of_birth?: string | null;
  phone_number?: string | null;
  country_code?: string | null;
  verified?: boolean | null;
  completion?: number | null;
};

type ProviderVerificationRow = {
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
  identity_verified?: boolean | null;
  kyc_verified?: boolean | null;
};

type ProviderProfileRow = {
  id: string;
  marketing_name?: string | null;
  service_location?: string | null;
  approval_status?: string | null;
  date_of_birth?: string | null;
  sex?: string | null;
  residential_address?: string | null;
  provider_verifications?: ProviderVerificationRow | ProviderVerificationRow[] | null;
};

function relationNode(value?: ProfileRelation) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function relationItem<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
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
      row.full_name?.trim() ||
        row.email?.split("@")[0]?.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) ||
        "User",
    ])
  );
}

async function fetchRelatedProfileNamesForUser(userId: string, role: string) {
  if (!supabase) {
    return new Map<string, string>();
  }

  const column = isProviderRole(role) ? "provider_id" : "customer_id";

  const [bookingsResult, paymentsResult, reviewsResult] = await Promise.all([
    supabase.from("bookings").select("customer_id, provider_id").eq(column, userId).limit(24),
    supabase.from("payments").select("customer_id, provider_id").eq(column, userId).limit(24),
    supabase.from("reviews").select("customer_id, provider_id").eq(column, userId).limit(24),
  ]);

  return fetchProfileNameMap([
    userId,
    ...((bookingsResult.data ?? []).flatMap((row) => [row.customer_id, row.provider_id])),
    ...((paymentsResult.data ?? []).flatMap((row) => [row.customer_id, row.provider_id])),
    ...((reviewsResult.data ?? []).flatMap((row) => [row.customer_id, row.provider_id])),
  ]);
}

function toTitleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function normalizeRole(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
}

function isProviderRole(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return normalized === "provider" || normalized === "service_provider";
}

function isInternalRole(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return ["admin", "super_admin", "manager", "customer_care", "customer_service"].includes(normalized);
}

function isCustomerRole(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return normalized === "customer" || (!isProviderRole(normalized) && !isInternalRole(normalized));
}

function matchesUserCategory(role: string | null | undefined, category: UserCategory) {
  if (category === "providers") {
    return isProviderRole(role);
  }

  if (category === "internal") {
    return isInternalRole(role);
  }

  return isCustomerRole(role);
}

function formatStatus(value: string | null | undefined, role?: string | null) {
  if (value?.trim()) {
    return toTitleCase(value);
  }

  return isProviderRole(role) ? "Verified" : "Active";
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

function verificationLabel(verified: boolean, fallback = "Not yet verified") {
  return verified ? "Verified" : fallback;
}

function splitPhoneNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      countryCode: undefined,
      phoneNumber: undefined,
    };
  }

  if (!trimmed.startsWith("+")) {
    return {
      countryCode: undefined,
      phoneNumber: trimmed,
    };
  }

  const [countryCode, ...rest] = trimmed.split(/\s+/);
  const phoneNumber = rest.join(" ").trim();

  return {
    countryCode: countryCode || undefined,
    phoneNumber: phoneNumber || undefined,
  };
}

function buildCustomerAddress(customerProfile: ProfileRelation | undefined, fallbackCity: string) {
  const node = relationNode(customerProfile);
  if (!node) {
    return [];
  }

  const line1 = [node.city?.trim(), node.region?.trim() || node.state?.trim()]
    .filter(Boolean)
    .join(", ");
  const line2 = node.country?.trim() || fallbackCity;

  if (!line1 && !line2) {
    return [];
  }

  return [
    {
      id: "live-address-1",
      label: "Primary Address",
      line1: line1 || fallbackCity,
      line2: line2 || "Malaysia",
      tag: "Primary",
    },
  ];
}

function buildGeneratedUserDetail(
  liveProfile: ProfileRow,
  role: string,
  city: string,
  fallbackMetrics: UserMetric[],
): UserDetailRecord {
  const customerProfile = relationNode(liveProfile.customer_profiles);
  const providerProfile = relationNode(liveProfile.provider_profiles);
  const verification = relationItem(providerProfile?.provider_verifications);
  const createdDate = formatDate(liveProfile.created_at);
  const createdDateTime = formatDateTime(liveProfile.created_at);
  const accountType = role === "provider" ? "Service Provider" : toTitleCase(role);
  const customerRegion = customerProfile?.region?.trim() || customerProfile?.state?.trim() || "Not provided";
  const customerCountry = customerProfile?.country?.trim() || "Malaysia";
  const customerVerified = Boolean(customerProfile?.verified) || liveProfile.status?.trim().toLowerCase() === "active";
  const customerPhone = customerProfile?.phone_number?.trim()
    ? `${customerProfile.country_code?.trim() || "+60"} ${customerProfile.phone_number.trim()}`.trim()
    : liveProfile.phone?.trim() || "Not provided";
  const customerCompletion = typeof customerProfile?.completion === "number"
    ? `${Math.max(0, Math.min(100, customerProfile.completion)).toFixed(1)}%`
    : "0.0%";

  return {
    userId: liveProfile.id,
    name: extractName(liveProfile),
    email: liveProfile.email?.trim() || "No email",
    role,
    status: formatStatus(liveProfile.status, role),
    phone: role === "provider" ? liveProfile.phone?.trim() || "Not provided" : customerPhone,
    dob:
      role === "provider"
        ? formatDateOfBirth(providerProfile?.date_of_birth)
        : formatDateOfBirth(customerProfile?.date_of_birth),
    gender: role === "provider" ? providerProfile?.sex?.trim() || "Not provided" : "Not provided",
    city,
    region: role === "provider" ? "Not provided" : customerRegion,
    country: role === "provider" ? "Malaysia" : customerCountry,
    joined: createdDate,
    lastLogin: "Recently active",
    registeredAt: createdDateTime,
    device: "Unknown device",
    ipAddress: "Unavailable",
    referrer: "Unavailable",
    accountType,
    loginCount: "Unavailable",
    failedLogins: "Unavailable",
    twoFactorAuth: "Unknown",
    walletBalance: "RM0.00",
    totalSpent: "RM0.00",
    reviewsGiven: "0",
    reportsSubmitted: "0",
    completionRate: role === "provider" ? "0.0%" : customerCompletion,
    cancellationRate: "0.0%",
    averageRating: "0.0",
    emailVerifiedAt:
      role === "provider"
        ? verificationLabel(Boolean(verification?.email_verified))
        : verificationLabel(customerVerified),
    phoneVerifiedAt:
      role === "provider"
        ? verificationLabel(Boolean(verification?.phone_verified))
        : verificationLabel(Boolean(customerProfile?.phone_number?.trim())),
    kycVerifiedAt:
      role === "provider"
        ? verificationLabel(
            Boolean(verification?.kyc_verified || verification?.identity_verified),
            "Pending review",
          )
        : verificationLabel(customerVerified, "Pending review"),
    addresses: role === "provider"
      ? providerProfile?.residential_address?.trim()
        ? [
            {
              id: "live-address-1",
              label: "Residential Address",
              line1: providerProfile.residential_address.trim(),
              line2: city,
              tag: "Primary",
            },
          ]
        : []
      : buildCustomerAddress(liveProfile.customer_profiles, city),
    timeline: [
      {
        id: "live-timeline-1",
        title: "Account Registered",
        note: `${accountType} account created`,
        time: createdDateTime,
        tone: "emerald",
      },
    ],
    recentActions: [],
    documents:
      role === "provider"
        ? [
            {
              id: "live-doc-1",
              label: "Email Verification",
              status: Boolean(verification?.email_verified) ? "Verified" : "Pending",
              updated: Boolean(verification?.email_verified) ? createdDate : "Pending",
            },
            {
              id: "live-doc-2",
              label: "Phone Verification",
              status: Boolean(verification?.phone_verified) ? "Verified" : "Pending",
              updated: Boolean(verification?.phone_verified) ? createdDate : "Pending",
            },
            {
              id: "live-doc-3",
              label: "KYC Verification",
              status: Boolean(verification?.kyc_verified || verification?.identity_verified) ? "Verified" : "Pending",
              updated:
                Boolean(verification?.kyc_verified || verification?.identity_verified) ? createdDate : "Pending",
            },
          ]
        : [
            {
              id: "live-doc-customer-1",
              label: "Account Verification",
              status: customerVerified ? "Verified" : "Pending",
              updated: customerVerified ? createdDate : "Pending",
            },
          ],
    reports: [],
    recentReviews: [],
    metrics: fallbackMetrics,
  };
}

function formatSchedule(dateValue?: string | null, timeValue?: string | null) {
  if (!dateValue) {
    return "Upcoming booking";
  }

  const date = new Date(`${dateValue}T${timeValue ?? "09:00:00"}`);
  if (Number.isNaN(date.getTime())) {
    return "Upcoming booking";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function extractName(profile: ProfileRow) {
  const customerProfile = relationNode(profile.customer_profiles);
  const providerProfile = relationNode(profile.provider_profiles);

  if (profile.full_name?.trim()) {
    return profile.full_name.trim();
  }

  const customerName = [customerProfile?.first_name?.trim(), customerProfile?.last_name?.trim()]
    .filter(Boolean)
    .join(" ");
  if (customerName) {
    return customerName;
  }

  if (providerProfile?.marketing_name?.trim()) {
    return providerProfile.marketing_name.trim();
  }

  if (profile.email?.trim()) {
    return (profile.email.split("@")[0] ?? "")
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return `User ${profile.id.slice(0, 8)}`;
}

function extractCity(profile: ProfileRow) {
  const customerProfile = relationNode(profile.customer_profiles);
  const providerProfile = relationNode(profile.provider_profiles);

  const customerCity = [customerProfile?.city, customerProfile?.state, customerProfile?.country]
    .filter(Boolean)
    .join(", ");

  if (customerCity) {
    return customerCity;
  }

  if (providerProfile?.service_location?.trim()) {
    return providerProfile.service_location.trim();
  }

  return "Malaysia";
}

function findMockDetailByUser(profile: Pick<ProfileRow, "id" | "email" | "full_name">) {
  const direct = userDetailRecords[profile.id];
  if (direct) {
    return direct;
  }

  const email = profile.email?.trim().toLowerCase();
  const fullName = profile.full_name?.trim().toLowerCase();

  return Object.values(userDetailRecords).find((record) => {
    if (email && record.email.trim().toLowerCase() === email) {
      return true;
    }

    if (fullName && record.name.trim().toLowerCase() === fullName) {
      return true;
    }

    return false;
  });
}

function findMockUserByProfile(profile: Pick<ProfileRow, "id" | "email" | "full_name">) {
  const email = profile.email?.trim().toLowerCase();
  const fullName = profile.full_name?.trim().toLowerCase();

  return users.find((row) => {
    if (row.id === profile.id) {
      return true;
    }

    if (email && row.email.trim().toLowerCase() === email) {
      return true;
    }

    if (fullName && row.name.trim().toLowerCase() === fullName) {
      return true;
    }

    return false;
  });
}

function getMockBookings(name: string, role: string) {
  const normalizedName = name.trim().toLowerCase();

  return bookings.filter((booking) =>
    role === "provider"
      ? booking.provider.trim().toLowerCase() === normalizedName
      : booking.customer.trim().toLowerCase() === normalizedName
  );
}

function getMockPayments(name: string, role: string) {
  const normalizedName = name.trim().toLowerCase();

  return payments.filter((payment) =>
    role === "provider"
      ? payment.provider.trim().toLowerCase() === normalizedName
      : payment.customer.trim().toLowerCase() === normalizedName
  );
}

function humanizeServiceType(serviceType?: string | null) {
  if (!serviceType?.trim()) {
    return "Service";
  }

  return toTitleCase(serviceType);
}

function mapBookingStatus(status?: string | null) {
  if (!status?.trim()) {
    return "Pending";
  }

  const normalized = status.trim().toLowerCase();

  if (normalized === "in_progress") {
    return "In Progress";
  }

  return toTitleCase(normalized);
}

async function tryFetchLiveBookings(userId: string, role: string, profileNames: ProfileNameMap) {
  if (!supabase) {
    return null;
  }

  const column = role === "provider" ? "provider_id" : "customer_id";

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
    .eq(column, userId)
    .order("scheduled_date", { ascending: false })
    .limit(12);

  if (error || !data) {
    return null;
  }

  return (data as LiveBookingRow[]).map((row) => {
    const providerProfile = relationNode(row.provider_profiles);
    const providerService = relationItem(row.provider_services);
    const customerName = profileNames.get(row.customer_id ?? "");
    const providerName = providerProfile?.marketing_name?.trim() || profileNames.get(row.provider_id ?? "");

    return {
      id: row.id.startsWith("#") ? row.id : `#${row.id.slice(0, 8).toUpperCase()}`,
      service: humanizeServiceType(providerService?.service_type),
      provider: providerName || "DELLA Provider",
      customer: customerName || "Customer",
      status: mapBookingStatus(row.booking_status),
      amount: formatCurrency(row.total_amount ?? 0),
      schedule: formatSchedule(row.scheduled_date, row.scheduled_start_time),
    } satisfies DashboardBooking;
  });
}

async function tryFetchLivePayments(userId: string, role: string, profileNames: ProfileNameMap) {
  if (!supabase) {
    return null;
  }

  const column = isProviderRole(role) ? "provider_id" : "customer_id";

  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      status,
      amount,
      payment_method,
      payment_option,
      created_at,
      customer_id,
      provider_id
    `)
    .eq(column, userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data) {
    return null;
  }

  return (data as LivePaymentRow[]).map((row) => {
    const customerName = profileNames.get(row.customer_id ?? "");
    const providerName = profileNames.get(row.provider_id ?? "");

    return {
      id: row.id.startsWith("#") ? row.id : `#${row.id.slice(0, 8).toUpperCase()}`,
      customer: customerName || "Customer",
      provider: providerName || "Provider",
      amount: formatCurrency(row.amount ?? 0),
      method: row.payment_option?.trim() || row.payment_method?.trim() || "Online",
      status: mapBookingStatus(row.status),
      date: formatDate(row.created_at),
    };
  });
}

async function tryFetchLiveReviews(userId: string, role: string, profileNames: ProfileNameMap) {
  if (!supabase) {
    return null;
  }

  const column = isProviderRole(role) ? "provider_id" : "customer_id";

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      customer_id,
      provider_id,
      provider_profiles (
        marketing_name
      )
    `)
    .eq(column, userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data) {
    return null;
  }

  return (data as LiveReviewRow[]).map((row) => {
    const providerProfile = relationNode(row.provider_profiles);
    const reviewerName = profileNames.get(row.customer_id ?? "");

    return {
      id: row.id,
      provider:
        isProviderRole(role)
          ? reviewerName || "Customer Review"
          : providerProfile?.marketing_name?.trim() || profileNames.get(row.provider_id ?? "") || "DELLA Provider",
      rating: Math.max(1, Math.min(5, Math.round(row.rating ?? 5))),
      review: row.comment?.trim() || "Shared feedback",
      date: formatDate(row.created_at),
    };
  });
}

async function tryFetchLoginAudits(userId: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("login_audit_events")
    .select("id, app_surface, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data) {
    return null;
  }

  return data as LoginAuditRow[];
}

async function tryFetchLiveReports(userId: string, role: string) {
  if (!supabase) {
    return null;
  }

  const column = isProviderRole(role) ? "reported_user_id" : "reporter_id";

  const { data, error } = await supabase
    .from("user_reports")
    .select("id, title, status, created_at")
    .eq(column, userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data) {
    return null;
  }

  return data as UserReportRow[];
}

function buildMetrics(
  role: string,
  relatedBookings: DashboardBooking[],
  relatedPayments: PaymentRow[],
  fallbackMetrics: UserMetric[]
) {
  if (!relatedBookings.length && !relatedPayments.length) {
    return fallbackMetrics;
  }

  const completedCount = relatedBookings.filter((booking) =>
    ["completed", "confirmed"].includes(booking.status.trim().toLowerCase())
  ).length;
  const cancelledCount = relatedBookings.filter((booking) =>
    ["cancelled", "canceled"].includes(booking.status.trim().toLowerCase())
  ).length;
  const totalAmount = relatedPayments.reduce((sum, payment) => {
    const numeric = Number(payment.amount.replace(/[^0-9.]/g, ""));
    return Number.isNaN(numeric) ? sum : sum + numeric;
  }, 0);
  const totalBookings = relatedBookings.length;
  const completionRate = totalBookings > 0 ? `${((completedCount / totalBookings) * 100).toFixed(1)}%` : "0.0%";
  const cancellationRate = totalBookings > 0 ? `${((cancelledCount / totalBookings) * 100).toFixed(1)}%` : "0.0%";

  if (isProviderRole(role)) {
    return [
      { id: "live-1", label: "Total Jobs", value: String(totalBookings), note: "Provider bookings", tone: "emerald" },
      { id: "live-2", label: "Completed", value: String(completedCount), note: completionRate, tone: "emerald" },
      { id: "live-3", label: "Cancelled", value: String(cancelledCount), note: cancellationRate, tone: "rose" },
      { id: "live-4", label: "Lifetime Earnings", value: formatCurrency(totalAmount), note: "All time", tone: "violet" },
      fallbackMetrics[4] ?? { id: "live-5", label: "Wallet Balance", value: "RM0.00", note: "Available", tone: "amber" },
      fallbackMetrics[5] ?? { id: "live-6", label: "Reviews", value: "0", note: "Average: 0.0", tone: "sky" },
      fallbackMetrics[6] ?? { id: "live-7", label: "Reports", value: "0", note: "No issues", tone: "amber" },
    ] satisfies UserMetric[];
  }

  return [
    { id: "live-1", label: "Total Bookings", value: String(totalBookings), note: "View all bookings", tone: "emerald" },
    { id: "live-2", label: "Completed Bookings", value: String(completedCount), note: completionRate, tone: "emerald" },
    { id: "live-3", label: "Cancelled Bookings", value: String(cancelledCount), note: cancellationRate, tone: "rose" },
    { id: "live-4", label: "Total Spent", value: formatCurrency(totalAmount), note: "All time", tone: "violet" },
    fallbackMetrics[4] ?? { id: "live-5", label: "Wallet Balance", value: "RM0.00", note: "Available", tone: "amber" },
    fallbackMetrics[5] ?? { id: "live-6", label: "Reviews Given", value: "0", note: "Average: 0.0", tone: "sky" },
    fallbackMetrics[6] ?? { id: "live-7", label: "Reports Submitted", value: "0", note: "No reports", tone: "amber" },
  ] satisfies UserMetric[];
}

function mapProfileToUserRow(profile: ProfileRow): UserRow {
  const mockRow = findMockUserByProfile(profile);
  const role = profile.role?.trim() || mockRow?.role || "customer";

  return {
    id: profile.id,
    name: extractName(profile),
    email: profile.email?.trim() || mockRow?.email || "No email",
    role,
    status: formatStatus(profile.status, role),
    city: extractCity(profile) || mockRow?.city || "Malaysia",
    joined: formatDate(profile.created_at) || mockRow?.joined || "Recently",
  };
}

async function fetchProfiles() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data?.length) {
    return null;
  }

  const profiles = data as ProfileRow[];
  const ids = profiles.map((profile) => profile.id);

  const [{ data: customerProfiles }, { data: providerProfiles }] = await Promise.all([
    supabase
      .from("customer_profiles")
      .select("id, first_name, last_name, city, region, state, country, date_of_birth, phone_number, country_code, verified, completion")
      .in("id", ids),
    supabase
      .from("provider_profiles")
      .select(`
        id,
        marketing_name,
        service_location,
        approval_status,
        date_of_birth,
        sex,
        residential_address,
        provider_verifications (
          phone_verified,
          email_verified,
          identity_verified,
          kyc_verified
        )
      `)
      .in("id", ids),
  ]);

  const customerMap = new Map((customerProfiles as CustomerProfileRow[] | null | undefined)?.map((row) => [row.id, row]) ?? []);
  const providerMap = new Map((providerProfiles as ProviderProfileRow[] | null | undefined)?.map((row) => [row.id, row]) ?? []);

  return profiles.map((profile) => ({
    ...profile,
    customer_profiles: customerMap.get(profile.id) ?? null,
    provider_profiles: providerMap.get(profile.id) ?? null,
  }));
}

async function fetchProfileById(userId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status, phone, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const profile = data as ProfileRow;

  const [{ data: customerProfile }, { data: providerProfile }] = await Promise.all([
    supabase
      .from("customer_profiles")
      .select("id, first_name, last_name, city, region, state, country, date_of_birth, phone_number, country_code, verified, completion")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("provider_profiles")
      .select(`
        id,
        marketing_name,
        service_location,
        approval_status,
        date_of_birth,
        sex,
        residential_address,
        provider_verifications (
          phone_verified,
          email_verified,
          identity_verified,
          kyc_verified
        )
      `)
      .eq("id", userId)
      .maybeSingle(),
  ]);

  return {
    ...profile,
    customer_profiles: customerProfile ?? null,
    provider_profiles: providerProfile ?? null,
  };
}

async function listUsersByCategory(category: UserCategory) {
  const liveProfiles = await fetchProfiles();

  if (!liveProfiles?.length) {
    return users.filter((row) => matchesUserCategory(row.role, category));
  }

  const liveRows = liveProfiles
    .map(mapProfileToUserRow)
    .filter((row) => matchesUserCategory(row.role, category));
  const seen = new Set(
    liveRows.flatMap((row) => [row.id.trim().toLowerCase(), row.email.trim().toLowerCase()])
  );

  const mockRemainder = users.filter(
    (row) =>
      matchesUserCategory(row.role, category) &&
      !seen.has(row.id.trim().toLowerCase()) &&
      !seen.has(row.email.trim().toLowerCase())
  );

  return [...liveRows, ...mockRemainder];
}

export async function listUsersWithFallback() {
  return listUsersByCategory("customers");
}

export async function listInternalUsersWithFallback() {
  return listUsersByCategory("internal");
}

export function buildUserStats(rows: UserRow[]) {
  const activeCount = rows.filter((row) => ["active", "verified"].includes(row.status.toLowerCase())).length;
  const customerCount = rows.filter((row) => isCustomerRole(row.role)).length;
  const pendingCount = rows.filter((row) => row.status.toLowerCase() === "pending").length;

  return [
    {
      label: "Active users",
      value: activeCount.toLocaleString("en-MY"),
      note: `${rows.length.toLocaleString("en-MY")} total accounts`,
    },
    {
      label: "Customers",
      value: customerCount.toLocaleString("en-MY"),
      note: "Registered marketplace customers",
    },
    {
      label: "Pending",
      value: pendingCount.toLocaleString("en-MY"),
      note: "Customer accounts awaiting activation or review",
    },
  ];
}

export function buildInternalUserStats(rows: UserRow[]) {
  const activeCount = rows.filter((row) => ["active", "verified"].includes(row.status.toLowerCase())).length;
  const adminCount = rows.filter((row) => ["admin", "super_admin"].includes(normalizeRole(row.role))).length;
  const supportCount = rows.filter((row) => ["manager", "customer_care", "customer_service"].includes(normalizeRole(row.role))).length;

  return [
    {
      label: "Active Staff",
      value: activeCount.toLocaleString("en-MY"),
      note: `${rows.length.toLocaleString("en-MY")} total internal accounts`,
    },
    {
      label: "Admins",
      value: adminCount.toLocaleString("en-MY"),
      note: "Admin and super admin access",
    },
    {
      label: "Managers / Support",
      value: supportCount.toLocaleString("en-MY"),
      note: "Managers and customer service staff",
    },
  ];
}

export async function getUserProfileWithFallback(userId: string): Promise<UserProfilePayload> {
  const mockDetail = findMockDetailByUser({ id: userId, email: null, full_name: null }) ?? userDetailRecords[userId] ?? null;

  const liveProfile = await fetchProfileById(userId);

  if (!liveProfile) {
    if (!mockDetail) {
      return {
        detail: null,
        relatedBookings: [],
        relatedPayments: [],
      };
    }

    return {
      detail: mockDetail,
      relatedBookings: getMockBookings(mockDetail.name, mockDetail.role),
      relatedPayments: getMockPayments(mockDetail.name, mockDetail.role),
    };
  }

  const name = extractName(liveProfile);
  const email = liveProfile.email?.trim() || mockDetail?.email || "No email";
  const role = liveProfile.role?.trim() || mockDetail?.role || "customer";
  const status = formatStatus(liveProfile.status, role);
  const city = extractCity(liveProfile) || mockDetail?.city || "Malaysia";
  const profileNames = await fetchRelatedProfileNamesForUser(userId, role);
  const liveBookings = await tryFetchLiveBookings(userId, role, profileNames);
  const livePayments = await tryFetchLivePayments(userId, role, profileNames);
  const liveReviews = await tryFetchLiveReviews(userId, role, profileNames);
  const liveLoginAudits = await tryFetchLoginAudits(userId);
  const liveReports = await tryFetchLiveReports(userId, role);
  const roleTemplate =
    Object.values(userDetailRecords).find((record) => record.role === role)?.metrics ??
    Object.values(userDetailRecords)[0]?.metrics ??
    [];
  const generatedDetail = buildGeneratedUserDetail(liveProfile, role, city, roleTemplate);
  const baseDetail = generatedDetail;
  const relatedBookings = liveBookings?.length
    ? liveBookings
    : mockDetail
      ? getMockBookings(name, role)
      : [];
  const relatedPayments = livePayments?.length
    ? livePayments
    : mockDetail
      ? getMockPayments(name, role)
      : [];
  const metrics = buildMetrics(role, relatedBookings, relatedPayments, baseDetail.metrics);
  const providerProfile = relationNode(liveProfile.provider_profiles);
  const verification = relationItem(providerProfile?.provider_verifications);
  const accountType = role === "provider" ? "Service Provider" : toTitleCase(role);

  return {
    detail: {
      ...baseDetail,
      userId: liveProfile.id,
      name,
      email,
      role,
      status,
      phone: generatedDetail.phone,
      dob: generatedDetail.dob,
      gender: generatedDetail.gender,
      city,
      joined: formatDate(liveProfile.created_at),
      registeredAt: formatDateTime(liveProfile.created_at),
      lastLogin: generatedDetail.lastLogin,
      device: generatedDetail.device,
      ipAddress: generatedDetail.ipAddress,
      referrer: generatedDetail.referrer,
      failedLogins: generatedDetail.failedLogins,
      twoFactorAuth: generatedDetail.twoFactorAuth,
      accountType,
      emailVerifiedAt:
        role === "provider"
          ? verificationLabel(Boolean(verification?.email_verified), generatedDetail.emailVerifiedAt)
          : generatedDetail.emailVerifiedAt,
      phoneVerifiedAt:
        role === "provider"
          ? verificationLabel(Boolean(verification?.phone_verified), generatedDetail.phoneVerifiedAt)
          : generatedDetail.phoneVerifiedAt,
      kycVerifiedAt:
        role === "provider"
          ? verificationLabel(
              Boolean(verification?.kyc_verified || verification?.identity_verified),
              generatedDetail.kycVerifiedAt,
            )
          : generatedDetail.kycVerifiedAt,
      addresses: generatedDetail.addresses,
      documents: generatedDetail.documents,
      timeline: generatedDetail.timeline,
      recentActions:
        liveLoginAudits?.length
          ? liveLoginAudits.map((entry) => ({
              id: entry.id,
              label: `Signed in via ${(entry.app_surface ?? "app").replaceAll("_", " ")}`,
              time: formatDateTime(entry.created_at),
            }))
          : generatedDetail.recentActions,
      loginCount: liveLoginAudits?.length ? `${liveLoginAudits.length} times` : generatedDetail.loginCount,
      reportsSubmitted:
        liveReports?.length && !isProviderRole(role) ? String(liveReports.length) : generatedDetail.reportsSubmitted,
      reports:
        liveReports?.length
          ? liveReports.map((report) => ({
              id: report.id,
              title: report.title?.trim() || "Report submitted",
              status: formatStatus(report.status),
              submitted: formatDate(report.created_at),
            }))
          : generatedDetail.reports,
      recentReviews: liveReviews?.length ? liveReviews : mockDetail?.recentReviews ?? generatedDetail.recentReviews,
      metrics: metrics.map((metric) =>
        metric.label === "Reports Submitted" && liveReports?.length && !isProviderRole(role)
          ? { ...metric, value: String(liveReports.length), note: "Live reports submitted" }
          : metric
      ),
    },
    relatedBookings,
    relatedPayments,
  };
}

export async function updateUserProfile(userId: string, updates: UserProfileUpdateInput) {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: profileError?.message || "User profile was not found." };
  }

  const normalizedPhone = updates.phone?.trim() ?? "";
  const normalizedDob = updates.dob?.trim() ?? "";
  const normalizedGender = updates.gender?.trim() ?? "";
  const normalizedCity = updates.city?.trim() ?? "";
  const normalizedName = updates.full_name?.trim() ?? "";
  const normalizedEmail = updates.email?.trim() ?? "";
  const normalizedStatus = updates.status?.trim() ?? "";
  const splitPhone = splitPhoneNumber(normalizedPhone);

  const profilePayload = Object.fromEntries(
    Object.entries({
      full_name: normalizedName || undefined,
      email: normalizedEmail || undefined,
      phone: normalizedPhone || undefined,
      status: normalizedStatus || undefined,
    }).filter(([, value]) => typeof value === "string" && value.trim() !== "")
  );

  if (Object.keys(profilePayload).length === 0 && !normalizedDob && !normalizedGender && !normalizedCity) {
    return { error: "Nothing to update." };
  }

  if (Object.keys(profilePayload).length > 0) {
    const { error } = await supabase.from("profiles").update(profilePayload).eq("id", userId);

    if (error) {
      return { error: error.message || "Unable to update user." };
    }
  }

  const role = profile.role?.trim().toLowerCase();

  if (role === "provider") {
    const providerPayload = Object.fromEntries(
      Object.entries({
        date_of_birth: normalizedDob || undefined,
        sex: normalizedGender || undefined,
        service_location: normalizedCity || undefined,
      }).filter(([, value]) => typeof value === "string" && value.trim() !== "")
    );

    if (Object.keys(providerPayload).length > 0) {
      const { error } = await supabase.from("provider_profiles").upsert({ id: userId, ...providerPayload });

      if (error) {
        return { error: error.message || "Unable to update provider profile." };
      }
    }
  } else {
    const [firstName = "", ...restName] = normalizedName.split(/\s+/).filter(Boolean);
    const lastName = restName.join(" ");
    const customerPayload = Object.fromEntries(
      Object.entries({
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        date_of_birth: normalizedDob || undefined,
        phone_number: splitPhone.phoneNumber,
        country_code: splitPhone.countryCode,
        city: normalizedCity || undefined,
      }).filter(([, value]) => typeof value === "string" && value.trim() !== "")
    );

    if (Object.keys(customerPayload).length > 0) {
      const { error } = await supabase.from("customer_profiles").upsert({ id: userId, ...customerPayload });

      if (error) {
        return { error: error.message || "Unable to update customer profile." };
      }
    }
  }

  return { error: null };
}

export async function setUserSuspended(userId: string, suspended: boolean) {
  return updateUserProfile(userId, {
    status: suspended ? "suspended" : "active",
  });
}

export async function deleteUserRecord(userId: string) {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const customerDelete = await supabase.from("customer_profiles").delete().eq("id", userId);
  const providerDelete = await supabase.from("provider_profiles").delete().eq("id", userId);
  const profileDelete = await supabase.from("profiles").delete().eq("id", userId);

  if (!profileDelete.error) {
    return { error: null, mode: "deleted" as const };
  }

  const softDelete = await supabase
    .from("profiles")
    .update({ status: "deleted" })
    .eq("id", userId);

  if (softDelete.error) {
    return {
      error:
        profileDelete.error.message ||
        customerDelete.error?.message ||
        providerDelete.error?.message ||
        "Unable to delete user.",
      mode: "failed" as const,
    };
  }

  return { error: null, mode: "soft-deleted" as const };
}
