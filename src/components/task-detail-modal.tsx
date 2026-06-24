import { X } from "lucide-react";
import type { ProviderTaskDetail } from "../lib/admin-providers";
import { TaskDetailPanel } from "./task-detail-panel";

export function TaskDetailModal({
  open,
  detail,
  loading,
  error,
  title,
  onClose,
}: {
  open: boolean;
  detail: ProviderTaskDetail | null;
  loading?: boolean;
  error?: string | null;
  title?: string;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] border border-white/70 bg-[#f8fafc] p-4 shadow-[0_30px_100px_rgba(15,23,42,0.3)] md:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Task Detail</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{title ?? "Booking Detail"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <X className="size-4" />
            Close
          </button>
        </div>

        <TaskDetailPanel detail={detail} loading={loading} title={title ?? "Booking Detail"} />
        {!loading && error ? (
          <div className="mt-4 rounded-[28px] border border-rose-100 bg-white/90 p-5 text-sm text-rose-600 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
