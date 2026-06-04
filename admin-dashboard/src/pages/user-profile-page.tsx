import { ArrowLeft, Ban, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StatusBadge } from "../components/status-badge";
import { bookings, payments, users } from "../data/mock-data";
import type { DashboardBooking, PaymentRow } from "../types";

function isUserRelatedBooking(userName: string, role: string, booking: DashboardBooking) {
  const normalizedName = userName.trim().toLowerCase();
  return role === "provider"
    ? booking.provider.trim().toLowerCase() === normalizedName
    : booking.customer.trim().toLowerCase() === normalizedName;
}

function isUserRelatedPayment(userName: string, role: string, payment: PaymentRow) {
  const normalizedName = userName.trim().toLowerCase();
  return role === "provider"
    ? payment.provider.trim().toLowerCase() === normalizedName
    : payment.customer.trim().toLowerCase() === normalizedName;
}

export function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const user = users.find((entry) => entry.id === userId);
  const [draft, setDraft] = useState(() => ({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "",
    city: user?.city ?? "",
    status: user?.status ?? "",
  }));
  const [message, setMessage] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const relatedBookings = useMemo(() => {
    if (!user) {
      return [];
    }

    return bookings.filter((booking) => isUserRelatedBooking(user.name, user.role, booking));
  }, [user]);

  const relatedPayments = useMemo(() => {
    if (!user) {
      return [];
    }

    return payments.filter((payment) => isUserRelatedPayment(user.name, user.role, payment));
  }, [user]);

  if (!user || deleted) {
    return (
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          User profile
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-slate-950">User not found</h1>
        <p className="mt-3 text-sm text-slate-500">
          This user profile is not available anymore.
        </p>
        <Link
          to="/users"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        >
          <ArrowLeft className="size-4" />
          Back to users
        </Link>
      </section>
    );
  }

  const totalSpent = relatedPayments.reduce((sum, payment) => {
    const numericValue = Number(payment.amount.replace(/[^0-9.]/g, ""));
    return sum + (Number.isFinite(numericValue) ? numericValue : 0);
  }, 0);

  function handleSave() {
    setMessage("User details updated.");
  }

  function handleBanToggle() {
    setDraft((current) => ({
      ...current,
      status: current.status === "Banned" ? "Active" : "Banned",
    }));
    setMessage(draft.status === "Banned" ? "User restored." : "User banned.");
  }

  function handleDelete() {
    setDeleted(true);
    setMessage(null);
    navigate("/users", { replace: true });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              to="/users"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
            >
              <ArrowLeft className="size-4" />
              Back to users
            </Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              User ID
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-slate-950">
              {user.id}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-slate-700">{draft.name}</p>
              <StatusBadge status={draft.status} />
            </div>
            <p className="mt-2 text-sm text-slate-500">{draft.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            >
              <Pencil className="size-4" />
              Save edits
            </button>
            <button
              type="button"
              onClick={handleBanToggle}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800"
            >
              <Ban className="size-4" />
              {draft.status === "Banned" ? "Unban user" : "Ban user"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700"
            >
              <Trash2 className="size-4" />
              Delete user
            </button>
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Total bookings
          </p>
          <p className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-950">
            {relatedBookings.length}
          </p>
        </article>
        <article className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Total payments
          </p>
          <p className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-950">
            {relatedPayments.length}
          </p>
        </article>
        <article className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Payment value
          </p>
          <p className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-950">
            RM{totalSpent.toFixed(2)}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
        <article className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <h2 className="font-display text-2xl font-bold text-slate-950">Personal info</h2>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <input
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Role</span>
              <input
                value={draft.role}
                onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
              <input
                value={draft.city}
                onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Status</span>
              <input
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </label>
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="font-display text-2xl font-bold text-slate-950">Bookings</h2>
            <div className="mt-5 space-y-3">
              {relatedBookings.length ? (
                relatedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{booking.service}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {booking.id} • {booking.schedule}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Provider: {booking.provider} • Customer: {booking.customer} • Amount:{" "}
                      {booking.amount}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No bookings found for this user yet.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="font-display text-2xl font-bold text-slate-950">Payments</h2>
            <div className="mt-5 space-y-3">
              {relatedPayments.length ? (
                relatedPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {payment.id} • {payment.amount}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {payment.date} • {payment.method}
                        </p>
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Customer: {payment.customer} • Provider: {payment.provider}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No payments found for this user yet.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
