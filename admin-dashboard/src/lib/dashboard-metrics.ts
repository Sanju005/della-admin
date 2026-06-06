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

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      metrics: dashboardMetrics,
      approvals: approvalItems,
      complaintsOpen: fallbackComplaintCount(),
    };
  }

  const [
    totalUsers,
    providerCount,
    activeTasks,
    paymentTotal,
    pendingApprovals,
    liveComplaintsOpen,
  ] = await Promise.all([
    countRows("profiles"),
    countRows("profiles", [["role", "provider"]]),
    countRows("bookings", [["booking_status", "pending"]]),
    sumPaymentAmounts(),
    countRows("provider_profiles", [["approval_status", "pending"]]),
    countRows("complaints", [["status", "open"]]),
  ]);

  const metrics: LiveMetricCard[] = dashboardMetrics.map((metric) => {
    switch (metric.title) {
      case "Total Users":
        return {
          ...metric,
          value: formatCompactNumber(totalUsers ?? Number(metric.value.replace(/[^\d]/g, "")) || 0),
        };
      case "Service Providers":
        return {
          ...metric,
          value: formatCompactNumber(providerCount ?? Number(metric.value.replace(/[^\d]/g, "")) || 0),
        };
      case "Active Tasks":
        return {
          ...metric,
          value: formatCompactNumber(activeTasks ?? Number(metric.value.replace(/[^\d]/g, "")) || 0),
        };
      case "Total Payments":
        return {
          ...metric,
          value: paymentTotal == null ? metric.value : formatCurrency(paymentTotal),
        };
      case "Pending Approvals":
        return {
          ...metric,
          value: formatCompactNumber(pendingApprovals ?? Number(metric.value.replace(/[^\d]/g, "")) || 0),
        };
      case "Open Complaints":
        return {
          ...metric,
          value: formatCompactNumber(
            liveComplaintsOpen ?? fallbackComplaintCount() ?? Number(metric.value.replace(/[^\d]/g, "")) || 0
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
  };
}
