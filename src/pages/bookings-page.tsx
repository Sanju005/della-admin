import { useEffect, useState } from "react";
import { ResourcePage } from "./resource-page";
import { buildBookingStats, listBookingsWithFallback } from "../lib/admin-bookings";
import type { DashboardBooking } from "../types";

export function BookingsPage() {
  const [rows, setRows] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading && rows.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <ResourcePage
      title="Tasks / Bookings"
      description="Real-time service operations, scheduling, and payment method visibility."
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
      stats={buildBookingStats(rows)}
    />
  );
}
