import { approvalItems, complaints, dashboardMetrics } from "../data/mock-data";
import { isSupabaseConfigured, supabase } from "./supabase";

type LiveMetricCard = {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  accent: string;
  icon: (typeof dashboardMetrics)[number]["icon"];
};

type LiveApprovalItem = {
  title: string;
  pending: number;
  accent: string;
  note: string;
};

type DashboardSnapshot = {
  metrics: LiveMetricCard[];
  approvals: LiveApprovalItem[];
  complaintsOpen: number;
  collectionsBreakdown: {
    cash: {
      total: number;
      balancePayableToCompany: number;
      paidToCompany: number;
      refunds: number;
    };
    others: {
      total: number;
      commission: number;
      paidToProviders: number;
      payableToProviders: number;
      refunds: number;
    };
  };
};

type PaymentAggregateRow = {
  amount?: number | null;
  payment_method?: string | null;
  payment_option?: string | null;
  status?: string | null;
  provider_net_amount?: number | null;
  company_commission_amount?: number | null;
  company_payment_status?: string | null;
};

async function countRows(table: string, filters?: Array<[string, string | boolean]>) {
  if (!supabase) {
    return null;
  }

  let query = supabase.from(table).select("*", { count: "exact", head: true });

  for (const [column, value] of filters ?? []) {
    query = query.eq(column, value);
  }

  const { count, error } = await query;

  if (error) {
    return null;
  }

  return count ?? 0;
}

async function sumPaymentAmounts() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("payments")
    .select("amount")
    .limit(5000);

  if (error || !data) {
    return null;
  }

  return data.reduce((sum, row) => sum + (typeof row.amount === "number" ? row.amount : 0), 0);
}

function normalizePaymentMethod(row: PaymentAggregateRow) {
  return (row.payment_option?.trim() || row.payment_method?.trim() || "cash").toLowerCase();
}

function isCashPayment(row: PaymentAggregateRow) {
  return normalizePaymentMethod(row) === "cash";
}

function isRefundedPayment(row: PaymentAggregateRow) {
  return (row.status ?? "").trim().toLowerCase() === "refunded";
}

function isProviderMarkedPaid(row: PaymentAggregateRow) {
  return (row.company_payment_status ?? "").trim().toLowerCase() === "paid";
}

async function getCollectionsBreakdown() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("payments")
    .select("amount, payment_method, payment_option, status, provider_net_amount, company_commission_amount, company_payment_status")
    .limit(5000);

  if (error || !data) {
    return null;
  }

  const rows = data as PaymentAggregateRow[];

  return rows.reduce(
    (totals, row) => {
      const amount = typeof row.amount === "number" ? row.amount : 0;
      const providerNet = typeof row.provider_net_amount === "number" ? row.provider_net_amount : 0;
      const commission = typeof row.company_commission_amount === "number" ? row.company_commission_amount : 0;
      const refunded = isRefundedPayment(row);

      if (isCashPayment(row)) {
        totals.cash.total += amount;
        if (refunded) {
          totals.cash.refunds += amount;
        } else if (isProviderMarkedPaid(row)) {
          totals.cash.paidToCompany += commission;
        } else {
          totals.cash.balancePayableToCompany += commission;
        }
        return totals;
      }

      totals.others.total += amount;
      totals.others.commission += commission;
      if (refunded) {
        totals.others.refunds += amount;
      } else if (isProviderMarkedPaid(row)) {
        totals.others.paidToProviders += providerNet;
      } else {
        totals.others.payableToProviders += providerNet;
      }

      return totals;
    },
    {
      cash: {
        total: 0,
        balancePayableToCompany: 0,
        paidToCompany: 0,
        refunds: 0,
      },
      others: {
        total: 0,
        commission: 0,
        paidToProviders: 0,
        payableToProviders: 0,
        refunds: 0,
      },
    },
  );
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-MY", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);
}

function fallbackComplaintCount() {
  return complaints.filter((item) => item.status.toLowerCase() === "open").length;
}

function metricNumberFallback(value: string) {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      metrics: dashboardMetrics,
      approvals: approvalItems,
      complaintsOpen: fallbackComplaintCount(),
      collectionsBreakdown: {
        cash: {
          total: 0,
          balancePayableToCompany: 0,
          paidToCompany: 0,
          refunds: 0,
        },
        others: {
          total: 0,
          commission: 0,
          paidToProviders: 0,
          payableToProviders: 0,
          refunds: 0,
        },
      },
    };
  }

  const [
    totalUsers,
    providerCount,
    activeTasks,
    paymentTotal,
    collectionsBreakdown,
    pendingApprovals,
    liveComplaintsOpen,
  ] = await Promise.all([
    countRows("profiles"),
    countRows("profiles", [["role", "provider"]]),
    countRows("bookings", [["booking_status", "pending"]]),
    sumPaymentAmounts(),
    getCollectionsBreakdown(),
    countRows("provider_profiles", [["approval_status", "pending"]]),
    countRows("complaints", [["status", "open"]]),
  ]);

  const metrics: LiveMetricCard[] = dashboardMetrics.map((metric) => {
    switch (metric.title) {
      case "Total Users":
        return {
          ...metric,
          value: formatCompactNumber(totalUsers ?? metricNumberFallback(metric.value)),
        };
      case "Service Providers":
        return {
          ...metric,
          value: formatCompactNumber(providerCount ?? metricNumberFallback(metric.value)),
        };
      case "Active Tasks":
        return {
          ...metric,
          value: formatCompactNumber(activeTasks ?? metricNumberFallback(metric.value)),
        };
      case "Total Payments":
        return {
          ...metric,
          value: paymentTotal == null ? metric.value : formatCurrency(paymentTotal),
        };
      case "Pending Approvals":
        return {
          ...metric,
          value: formatCompactNumber(pendingApprovals ?? metricNumberFallback(metric.value)),
        };
      case "Open Complaints":
        return {
          ...metric,
          value: formatCompactNumber(
            liveComplaintsOpen ??
              fallbackComplaintCount() ??
              metricNumberFallback(metric.value)
          ),
        };
      default:
        return metric;
    }
  });

  const approvals: LiveApprovalItem[] = approvalItems.map((item) => {
    if (item.title === "Service Providers") {
      return {
        ...item,
        pending: pendingApprovals ?? item.pending,
      };
    }

    return item;
  });

  return {
    metrics,
    approvals,
    complaintsOpen: liveComplaintsOpen ?? fallbackComplaintCount(),
    collectionsBreakdown: collectionsBreakdown ?? {
      cash: {
        total: 0,
        balancePayableToCompany: 0,
        paidToCompany: 0,
        refunds: 0,
      },
      others: {
        total: 0,
        commission: 0,
        paidToProviders: 0,
        payableToProviders: 0,
        refunds: 0,
      },
    },
  };
}
