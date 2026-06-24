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
    return mockPayments;
  }

  const profileNames = await fetchProfileNameMap([
    ...livePayments.map((row) => row.customer_id),
    ...livePayments.map((row) => row.provider_id),
  ]);

  return livePayments.map((row) => {
    const booking = relationItem(row.bookings);
    const paymentAmount = row.amount ?? booking?.total_amount ?? 0;

    return {
      id: formatEntityId(row.id),
      bookingId: formatEntityId(row.booking_id),
      customer: profileNames.get(row.customer_id ?? "") || "Customer",
      provider: profileNames.get(row.provider_id ?? "") || "Provider",
      amount: formatCurrency(paymentAmount),
      method: row.payment_option?.trim() || row.payment_method?.trim() || "Cash",
      status: formatStatus(row.status),
      date: formatDate(row.created_at),
      providerNetAmount: formatCurrency(row.provider_net_amount ?? 0),
      companyCommissionAmount: formatCurrency(row.company_commission_amount ?? 0),
      commissionStatus: formatStatus(row.company_payment_status, "Unpaid"),
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
    } satisfies PaymentRow;
  });
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
      note: `${rows.length.toLocaleString("en-MY")} payment records`,
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
