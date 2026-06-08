import type { StatusTone } from "../types";

const toneClasses: Record<StatusTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
};

const statusToneMap: Record<string, StatusTone> = {
  active: "emerald",
  approved: "emerald",
  verified: "emerald",
  paid: "emerald",
  completed: "emerald",
  published: "emerald",
  accepted: "green",
  in_progress: "sky",
  "in progress": "sky",
  pending: "amber",
  "needs review": "amber",
  open: "rose",
  flagged: "rose",
  suspended: "rose",
  cancelled: "rose",
  refunded: "violet",
  escalated: "violet",
  paused: "slate",
  resolved: "slate",
  "document review": "slate",
  critical: "rose",
  high: "amber",
  medium: "sky",
};

export function statusToTone(status: string): StatusTone {
  return statusToneMap[status.trim().toLowerCase()] ?? "slate";
}

export function StatusBadge({ status }: { status: string }) {
  const tone = statusToTone(status);

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {status}
    </span>
  );
}
