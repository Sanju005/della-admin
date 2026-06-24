import { useEffect, useRef, useState } from "react";
import { DataTable } from "../components/data-table";
import { TaskDetailPanel } from "../components/task-detail-panel";
import { TaskDetailModal } from "../components/task-detail-modal";
import { getProviderTaskDetail, type ProviderTaskDetail } from "../lib/admin-providers";
import { buildBookingStats, listBookingsWithFallback } from "../lib/admin-bookings";
import type { DashboardBooking } from "../types";

export function BookingsPage() {
  const [rows, setRows] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<ProviderTaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setLoading(true);
      const nextRows = await listBookingsWithFallback();

      if (!active) {
        return;
      }

      setRows(nextRows);
      setLoading(false);
    }

    void loadBookings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!detailLoading && !selectedTaskDetail) {
      return;
    }

    const timeout = window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [detailLoading, selectedTaskDetail]);

  async function handleRowClick(row: DashboardBooking) {
    const rawId = row.rawId?.trim();

    if (!rawId) {
      return;
    }

    setSelectedRowId(row.id);
    setDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await getProviderTaskDetail(rawId);
      setSelectedTaskDetail(detail);
      if (!detail) {
        setDetailError("No booking detail was returned for this task.");
      }
    } catch (error) {
      setSelectedTaskDetail(null);
      setDetailError(error instanceof Error ? error.message : "Unable to load booking detail.");
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading && rows.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {buildBookingStats(rows).map((stat) => (
          <article
            key={stat.label}
            className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {stat.label}
            </p>
            <p className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-950">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-slate-500">{stat.note}</p>
          </article>
        ))}
      </section>

      <DataTable
        title="Tasks / Bookings"
        description="Real-time service operations, scheduling, and payment method visibility. Click any row to open the full task detail."
        rows={rows}
        columns={[
          { key: "bookingId", label: "Booking ID" },
          { key: "service", label: "Service" },
          { key: "provider", label: "Provider" },
          { key: "customer", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "amount", label: "Amount" },
          { key: "paymentMethod", label: "Payment Method" },
          { key: "schedule", label: "Date & Time" },
        ]}
        statusKey="status"
        searchPlaceholder="Search bookings, customers, providers, or payment method..."
        selectedRowId={selectedRowId}
        onRowClick={(row) => void handleRowClick(row)}
      />

      <div ref={detailRef}>
        <TaskDetailPanel detail={selectedTaskDetail} loading={detailLoading} title="Booking Detail" />
        {!detailLoading && detailError ? (
          <div className="mt-4 rounded-[28px] border border-rose-100 bg-white/90 p-5 text-sm text-rose-600 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            {detailError}
          </div>
        ) : null}
      </div>

      <TaskDetailModal
        open={Boolean(selectedRowId && (detailLoading || selectedTaskDetail || detailError))}
        detail={selectedTaskDetail}
        loading={detailLoading}
        error={detailError}
        title="Booking Detail"
        onClose={() => {
          setSelectedRowId(null);
          setSelectedTaskDetail(null);
          setDetailError(null);
          setDetailLoading(false);
        }}
      />
    </div>
  );
}
