import { payments as mockPayments } from "../data/mock-data";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { PaymentProofAsset, PaymentRow } from "../types";

type BookingRelation = {
  total_amount?: number | null;
};

type LivePaymentRow = {
  id: string;
  booking_id?: string | null;
  status?: string | null;
  amount?: number | null;
  payment_method?: string | null;
  payment_option?: string | null;
  created_at?: string | null;
  company_payment_status?: string | null;
  company_paid_at?: string | null;
  company_commission_amount?: number | null;
  provider_net_amount?: number | null;
  customer_payment_proof_data_url?: string | null;
  customer_payment_proof_file_name?: string | null;
  customer_payment_proof_mime_type?: string | null;
  provider_company_payment_proof_data_url?: string | null;
  provider_company_payment_proof_file_name?: string | null;
  provider_company_payment_proof_mime_type?: string | null;
  customer_id?: string | null;
  provider_id?: string | null;
  bookings?: BookingRelation | BookingRelation[] | null;
};

type ProfileNameRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type PaymentApprovalResponse = {
  success?: boolean;
  payment?: {
    id?: string | null;
    company_payment_status?: string | null;
    company_paid_at?: string | null;
  } | null;
  error?: string;
};

type PaymentSettlementAction = "mark_paid" | "mark_rejected";

type PaymentAggregateBucket = {
  id: string;
  rawIds: string[];
  unpaidRawIds: string[];
  bookingIds: string[];
  customers: Set<string>;
  provider: string;
  totalAmount: number;
  totalProviderNet: number;
  totalCommission: number;
  methods: Set<string>;
  statuses: Set<string>;
  companyStatuses: Set<string>;
  latestCreatedAt: string | null;
  latestCompanyPaidAt: string | null;
  customerPaymentProof: PaymentProofAsset | null;
  providerCompanyPaymentProof: PaymentProofAsset | null;
};

type StorageAssetSpec = {
  bucket: string;
  path: string;
};

const adminStorageResolveApiUrl =
  import.meta.env.VITE_ADMIN_STORAGE_RESOLVE_URL?.trim() ||
  "/api/admin/storage/resolve";

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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Recently";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not paid yet";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not paid yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatStatus(value: string | null | undefined, fallback = "Pending") {
  if (!value?.trim()) {
    return fallback;
  }

  if (value.trim().toLowerCase() === "in_progress") {
    return "In Progress";
  }

  return toTitleCase(value.trim());
}

function formatEntityId(value: string | null | undefined, prefix = "#") {
  if (!value?.trim()) {
    return `${prefix}-`;
  }

  return value.startsWith(prefix) ? value : `${prefix}${value.slice(0, 8).toUpperCase()}`;
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

  return new Map((data as ProfileNameRow[]).map((row) => [row.id, buildName(row)]));
}

function buildProofAsset(
  label: string,
  url: string | null | undefined,
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
): PaymentProofAsset | null {
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

function buildResolvedProofAsset(
  label: string,
  url: string | null | undefined,
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
  resolved: Map<string, string>,
) {
  return buildProofAsset(
    label,
    applyResolvedAssetUrl(url, "payment-proofs", resolved) ?? url,
    fileName,
    mimeType,
  );
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

function summarizeStatuses(values: Set<string>, fallback: string) {
  const items = [...values].filter(Boolean);
  if (items.length === 0) {
    return fallback;
  }

  const normalized = items.map((item) => item.trim().toLowerCase());
  if (normalized.every((item) => item === normalized[0])) {
    return formatStatus(items[0], fallback);
  }

  if (normalized.every((item) => item === "paid")) {
    return "Paid";
  }

  return "Mixed";
}

function summarizeCommissionStatus(unpaidCount: number, totalCount: number) {
  if (totalCount === 0 || unpaidCount === 0) {
    return "Paid";
  }

  if (unpaidCount === totalCount) {
    return "Unpaid";
  }

  return "Payment Process";
}

async function fetchLivePayments() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      booking_id,
      status,
      amount,
      payment_method,
      payment_option,
      created_at,
      company_payment_status,
      company_paid_at,
      company_commission_amount,
      provider_net_amount,
      customer_payment_proof_data_url,
      customer_payment_proof_file_name,
      customer_payment_proof_mime_type,
      provider_company_payment_proof_data_url,
      provider_company_payment_proof_file_name,
      provider_company_payment_proof_mime_type,
      customer_id,
      provider_id,
      bookings (
        total_amount
      )
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data?.length) {
    return null;
  }

  return data as LivePaymentRow[];
}

export async function listPaymentsWithFallback(): Promise<PaymentRow[]> {
  const livePayments = await fetchLivePayments();

  if (!livePayments?.length) {
    return mockPayments
      .filter((row) => (row.method ?? "").trim().toLowerCase() === "cash")
      .map((row) => ({
        id: row.id,
        rawId: row.rawId,
        rawBookingId: row.bookingId,
        rawIds: row.rawId ? [row.rawId] : [],
        unpaidRawIds:
          row.rawId && (row.commissionStatus ?? "").trim().toLowerCase() !== "paid" ? [row.rawId] : [],
        bookingId: row.bookingId ?? "-",
        customer: row.customer,
        provider: row.provider,
        amount: row.amount,
        method: row.method,
        status: row.status,
        date: row.date,
        paymentCount: 1,
        providerNetAmount: row.providerNetAmount ?? row.amount,
        companyCommissionAmount: row.companyCommissionAmount ?? "RM0.00",
        commissionStatus: row.commissionStatus ?? "Unpaid",
        companyPaidAt: row.companyPaidAt ?? "Not paid yet",
        customerPaymentProof: row.customerPaymentProof ?? null,
        providerCompanyPaymentProof: row.providerCompanyPaymentProof ?? null,
      }))
      .sort((left, right) => {
        const leftDate = new Date(left.date ?? 0).getTime();
        const rightDate = new Date(right.date ?? 0).getTime();
        return rightDate - leftDate;
      });
  }

  const profileNames = await fetchProfileNameMap([
    ...livePayments.map((row) => row.customer_id),
    ...livePayments.map((row) => row.provider_id),
  ]);
  const paymentProofAssets = await resolveStorageAssets(
    livePayments.flatMap((row) => {
      const assets: StorageAssetSpec[] = [];

      for (const value of [
        row.customer_payment_proof_data_url,
        row.provider_company_payment_proof_data_url,
      ]) {
        const path = normalizeStoragePath(value);
        if (!path) {
          continue;
        }

        assets.push({ bucket: "payment-proofs", path });
      }

      return assets;
    }),
  );

  return livePayments
    .filter((row) => {
      const method = (row.payment_option?.trim() || row.payment_method?.trim() || "cash").toLowerCase();
      return method === "cash";
    })
    .sort((left, right) => new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime())
    .map((row) => {
      const booking = relationItem(row.bookings);
      const paymentAmount = row.amount ?? booking?.total_amount ?? 0;
      const customerProof = buildResolvedProofAsset(
        "Customer payment proof",
        row.customer_payment_proof_data_url,
        row.customer_payment_proof_file_name,
        row.customer_payment_proof_mime_type,
        paymentProofAssets,
      );
      const providerProof = buildResolvedProofAsset(
        "Provider company payment proof",
        row.provider_company_payment_proof_data_url,
        row.provider_company_payment_proof_file_name,
        row.provider_company_payment_proof_mime_type,
        paymentProofAssets,
      );

      return {
        id: row.provider_id?.trim() || profileNames.get(row.provider_id ?? "") || formatEntityId(row.id, "PV"),
        rawId: row.id,
        rawBookingId: row.booking_id?.trim() || undefined,
        rawIds: [row.id],
        unpaidRawIds:
          (row.company_payment_status ?? "").trim().toLowerCase() === "paid" ? [] : [row.id],
        bookingId: formatEntityId(row.booking_id),
        customer: profileNames.get(row.customer_id ?? "") || "Customer",
        provider: profileNames.get(row.provider_id ?? "") || "Provider",
        amount: formatCurrency(paymentAmount),
        method: row.payment_option?.trim() || row.payment_method?.trim() || "Cash",
        status: formatStatus(row.status ?? "paid", "Paid"),
        date: formatDate(row.created_at),
        paymentCount: 1,
        providerNetAmount: formatCurrency(row.provider_net_amount ?? 0),
        companyCommissionAmount: formatCurrency(row.company_commission_amount ?? 0),
        commissionStatus: formatStatus(row.company_payment_status ?? "unpaid", "Unpaid"),
        companyPaidAt: formatDateTime(row.company_paid_at),
        customerPaymentProof: customerProof,
        providerCompanyPaymentProof: providerProof,
      } satisfies PaymentRow;
    });
}

async function updateCompanyPaymentStatus(params: {
  accessToken: string;
  paymentId: string;
  action: PaymentSettlementAction;
}) {
  const response = await fetch("/api/admin/payments/settlement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      action: params.action,
      paymentId: params.paymentId,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as PaymentApprovalResponse;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Unable to approve provider commission payment.");
  }

  return payload.payment ?? null;
}

export async function approveCompanyPayment(params: {
  accessToken: string;
  paymentId: string;
}) {
  return updateCompanyPaymentStatus({
    accessToken: params.accessToken,
    paymentId: params.paymentId,
    action: "mark_paid",
  });
}

export async function rejectCompanyPayment(params: {
  accessToken: string;
  paymentId: string;
}) {
  return updateCompanyPaymentStatus({
    accessToken: params.accessToken,
    paymentId: params.paymentId,
    action: "mark_rejected",
  });
}

export async function approveCompanyPayments(params: {
  accessToken: string;
  paymentIds: string[];
}) {
  for (const paymentId of params.paymentIds) {
    await approveCompanyPayment({
      accessToken: params.accessToken,
      paymentId,
    });
  }
}

export async function rejectCompanyPayments(params: {
  accessToken: string;
  paymentIds: string[];
}) {
  for (const paymentId of params.paymentIds) {
    await rejectCompanyPayment({
      accessToken: params.accessToken,
      paymentId,
    });
  }
}

function parseMoney(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const numeric = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

export function buildPaymentStats(rows: PaymentRow[]) {
  const totalVolume = rows.reduce((sum, row) => sum + parseMoney(row.amount), 0);
  const totalProviderNet = rows.reduce((sum, row) => sum + parseMoney(row.providerNetAmount ?? row.amount), 0);
  const unpaidCommissionAmount = rows
    .filter((row) => (row.commissionStatus ?? "").trim().toLowerCase() !== "paid")
    .reduce((sum, row) => sum + parseMoney(row.companyCommissionAmount), 0);

  return [
    {
      label: "Total volume",
      value: formatCurrency(totalVolume),
      note: `${rows.length.toLocaleString("en-MY")} provider summaries`,
    },
    {
      label: "Provider net",
      value: formatCurrency(totalProviderNet),
      note: "Net payable across loaded records",
    },
    {
      label: "Unpaid commission",
      value: formatCurrency(unpaidCommissionAmount),
      note: "Company commission still marked unpaid",
    },
  ];
}
