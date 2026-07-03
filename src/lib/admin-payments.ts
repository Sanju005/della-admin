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
    const grouped = new Map<string, PaymentAggregateBucket>();

    for (const row of mockPayments) {
      const providerKey = row.provider.trim().toLowerCase();
      const current = grouped.get(providerKey) ?? {
        id: providerKey,
        rawIds: row.rawId ? [row.rawId] : [],
        unpaidRawIds:
          row.rawId && (row.commissionStatus ?? "").trim().toLowerCase() !== "paid" ? [row.rawId] : [],
        bookingIds: row.bookingId ? [row.bookingId] : [],
        customers: new Set([row.customer]),
        provider: row.provider,
        totalAmount: parseMoney(row.amount),
        totalProviderNet: parseMoney(row.providerNetAmount ?? row.amount),
        totalCommission: parseMoney(row.companyCommissionAmount),
        methods: new Set([row.method]),
        statuses: new Set([row.status]),
        companyStatuses: new Set([row.commissionStatus ?? "Unpaid"]),
        latestCreatedAt: row.date ?? null,
        latestCompanyPaidAt: row.companyPaidAt ?? null,
        customerPaymentProof: row.customerPaymentProof ?? null,
        providerCompanyPaymentProof: row.providerCompanyPaymentProof ?? null,
      };

      if (grouped.has(providerKey)) {
        current.totalAmount += parseMoney(row.amount);
        current.totalProviderNet += parseMoney(row.providerNetAmount ?? row.amount);
        current.totalCommission += parseMoney(row.companyCommissionAmount);
        current.customers.add(row.customer);
        current.methods.add(row.method);
        current.statuses.add(row.status);
        current.companyStatuses.add(row.commissionStatus ?? "Unpaid");
        if (row.bookingId) {
          current.bookingIds.push(row.bookingId);
        }
        if (row.rawId) {
          current.rawIds.push(row.rawId);
          if ((row.commissionStatus ?? "").trim().toLowerCase() !== "paid") {
            current.unpaidRawIds.push(row.rawId);
          }
        }
        if (!current.customerPaymentProof && row.customerPaymentProof) {
          current.customerPaymentProof = row.customerPaymentProof;
        }
        if (!current.providerCompanyPaymentProof && row.providerCompanyPaymentProof) {
          current.providerCompanyPaymentProof = row.providerCompanyPaymentProof;
        }
      }

      grouped.set(providerKey, current);
    }

    return [...grouped.values()].map((bucket) => ({
      id: bucket.provider,
      rawId: bucket.rawIds[0],
      rawIds: bucket.rawIds,
      unpaidRawIds: bucket.unpaidRawIds,
      bookingId: bucket.bookingIds[0] ?? "-",
      customer: bucket.customers.size === 1 ? ([...bucket.customers][0] ?? "Customer") : `${bucket.customers.size} customers`,
      provider: bucket.provider,
      amount: formatCurrency(bucket.totalAmount),
      method: bucket.methods.size === 1 ? ([...bucket.methods][0] ?? "Cash") : "Mixed",
      status: summarizeStatuses(bucket.statuses, "Paid"),
      date: bucket.latestCreatedAt ?? "Recently",
      paymentCount: bucket.bookingIds.length || bucket.rawIds.length,
      providerNetAmount: formatCurrency(bucket.totalProviderNet),
      companyCommissionAmount: formatCurrency(bucket.totalCommission),
      commissionStatus: summarizeCommissionStatus(bucket.unpaidRawIds.length, bucket.rawIds.length),
      companyPaidAt: bucket.latestCompanyPaidAt ?? "Not paid yet",
      customerPaymentProof: bucket.customerPaymentProof,
      providerCompanyPaymentProof: bucket.providerCompanyPaymentProof,
    }));
  }

  const profileNames = await fetchProfileNameMap([
    ...livePayments.map((row) => row.customer_id),
    ...livePayments.map((row) => row.provider_id),
  ]);

  const grouped = new Map<string, PaymentAggregateBucket>();

  for (const row of livePayments) {
    const booking = relationItem(row.bookings);
    const paymentAmount = row.amount ?? booking?.total_amount ?? 0;
    const providerName = profileNames.get(row.provider_id ?? "") || "Provider";
    const providerKey = row.provider_id?.trim() || providerName.trim().toLowerCase();
    const current = grouped.get(providerKey) ?? {
      id: providerKey,
      rawIds: [],
      unpaidRawIds: [],
      bookingIds: [],
      customers: new Set<string>(),
      provider: providerName,
      totalAmount: 0,
      totalProviderNet: 0,
      totalCommission: 0,
      methods: new Set<string>(),
      statuses: new Set<string>(),
      companyStatuses: new Set<string>(),
      latestCreatedAt: null,
      latestCompanyPaidAt: null,
      customerPaymentProof: null,
      providerCompanyPaymentProof: null,
    };

    current.rawIds.push(row.id);
    if ((row.company_payment_status ?? "").trim().toLowerCase() !== "paid") {
      current.unpaidRawIds.push(row.id);
    }
    if (row.booking_id?.trim()) {
      current.bookingIds.push(formatEntityId(row.booking_id));
    }
    current.customers.add(profileNames.get(row.customer_id ?? "") || "Customer");
    current.totalAmount += paymentAmount;
    current.totalProviderNet += row.provider_net_amount ?? 0;
    current.totalCommission += row.company_commission_amount ?? 0;
    current.methods.add(row.payment_option?.trim() || row.payment_method?.trim() || "Cash");
    current.statuses.add(row.status?.trim() || "paid");
    current.companyStatuses.add(row.company_payment_status?.trim() || "unpaid");
    if (!current.latestCreatedAt || new Date(row.created_at ?? 0).getTime() > new Date(current.latestCreatedAt).getTime()) {
      current.latestCreatedAt = row.created_at ?? null;
    }
    if (row.company_paid_at && (!current.latestCompanyPaidAt || new Date(row.company_paid_at).getTime() > new Date(current.latestCompanyPaidAt).getTime())) {
      current.latestCompanyPaidAt = row.company_paid_at;
    }

    const customerProof = buildProofAsset(
      "Customer payment proof",
      row.customer_payment_proof_data_url,
      row.customer_payment_proof_file_name,
      row.customer_payment_proof_mime_type,
    );
    const providerProof = buildProofAsset(
      "Provider company payment proof",
      row.provider_company_payment_proof_data_url,
      row.provider_company_payment_proof_file_name,
      row.provider_company_payment_proof_mime_type,
    );

    if (!current.customerPaymentProof && customerProof) {
      current.customerPaymentProof = customerProof;
    }
    if (!current.providerCompanyPaymentProof && providerProof) {
      current.providerCompanyPaymentProof = providerProof;
    }

    grouped.set(providerKey, current);
  }

  return [...grouped.values()]
    .sort((left, right) => new Date(right.latestCreatedAt ?? 0).getTime() - new Date(left.latestCreatedAt ?? 0).getTime())
    .map((bucket) => {
      const paymentCount = bucket.rawIds.length;

      return {
        id: bucket.provider,
        rawId: bucket.rawIds[0],
        rawIds: bucket.rawIds,
        unpaidRawIds: bucket.unpaidRawIds,
        bookingId: bucket.bookingIds[0] ?? "-",
        customer: bucket.customers.size === 1 ? ([...bucket.customers][0] ?? "Customer") : `${bucket.customers.size} customers`,
        provider: bucket.provider,
        amount: formatCurrency(bucket.totalAmount),
        method: bucket.methods.size === 1 ? ([...bucket.methods][0] ?? "Cash") : "Mixed",
        status: summarizeStatuses(bucket.statuses, "Paid"),
        date: formatDate(bucket.latestCreatedAt),
        paymentCount,
        providerNetAmount: formatCurrency(bucket.totalProviderNet),
        companyCommissionAmount: formatCurrency(bucket.totalCommission),
        commissionStatus: summarizeCommissionStatus(bucket.unpaidRawIds.length, paymentCount),
        companyPaidAt: formatDateTime(bucket.latestCompanyPaidAt),
        customerPaymentProof: bucket.customerPaymentProof,
        providerCompanyPaymentProof: bucket.providerCompanyPaymentProof,
      } satisfies PaymentRow;
  });
}

export async function approveCompanyPayment(params: {
  accessToken: string;
  paymentId: string;
}) {
  const response = await fetch("/api/admin/payments/settlement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      action: "mark_paid",
      paymentId: params.paymentId,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as PaymentApprovalResponse;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Unable to approve provider commission payment.");
  }

  return payload.payment ?? null;
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
