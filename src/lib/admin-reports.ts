import { complaints } from "../data/mock-data";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { ComplaintRow } from "../types";

type ReportRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  created_at?: string | null;
  reporter_id?: string | null;
  reported_user_id?: string | null;
};

type ProfileNameRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
};

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

function toTitleCase(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Submitted";
  }

  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

async function fetchNameMap(ids: Array<string | null | undefined>) {
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
      row.full_name?.trim() || row.email?.trim() || "Unknown user",
    ]),
  );
}

export async function listReportsWithFallback() {
  if (!isSupabaseConfigured || !supabase) {
    return complaints;
  }

  const { data, error } = await supabase
    .from("user_reports")
    .select("id, title, status, priority, category, created_at, reporter_id, reported_user_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data?.length) {
    return complaints;
  }

  const rows = data as ReportRow[];
  const nameMap = await fetchNameMap([
    ...rows.map((row) => row.reporter_id),
    ...rows.map((row) => row.reported_user_id),
  ]);

  return rows.map((row) => ({
    id: row.id,
    ticket: `#${row.id.slice(0, 8).toUpperCase()}`,
    subject: row.title?.trim() || "General report",
    customer: nameMap.get(row.reporter_id ?? "") || "Reporter",
    owner: row.reported_user_id ? `Against ${nameMap.get(row.reported_user_id) || "User"}` : "General issue",
    status: toTitleCase(row.status),
    priority: toTitleCase(row.priority ?? row.category),
    updated: formatDate(row.created_at),
  })) satisfies ComplaintRow[];
}

export function buildReportStats(rows: ComplaintRow[]) {
  const openCount = rows.filter((row) => ["open", "submitted", "in progress"].includes(row.status.toLowerCase())).length;
  const escalatedCount = rows.filter((row) => row.status.toLowerCase() === "escalated").length;
  const resolvedCount = rows.filter((row) => row.status.toLowerCase() === "resolved").length;

  return [
    {
      label: "Open Reports",
      value: openCount.toLocaleString("en-MY"),
      note: `${rows.length.toLocaleString("en-MY")} total records`,
    },
    {
      label: "Escalated",
      value: escalatedCount.toLocaleString("en-MY"),
      note: "High-risk issues needing admin action",
    },
    {
      label: "Resolved",
      value: resolvedCount.toLocaleString("en-MY"),
      note: "Closed cases in the current dataset",
    },
  ];
}
