"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  LogOut,
  Mail,
  MapPin,
  MessageSquareText,
  PencilLine,
  Phone,
  Route,
  Save,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import {
  disablePushNotifications,
  getPushSetupState,
  requestNotificationPermission,
  saveFCMToken,
  type PushSetupState,
} from "@/lib/notifications";
import { AppButton, EmptyState as SharedEmptyState, LoadingState as SharedLoadingState, StatusBadge as SharedStatusBadge } from "@/app/_components/della-ui";
import { getSupabaseClient } from "@/lib/supabase";

type ProviderDashboardData = {
  providerId: string;
  fullName: string;
  email: string;
  phone: string;
  accountStatus: string;
  marketingName: string;
  serviceLocation: string;
  serviceRadiusKm: number;
  bio: string;
  approvalStatus: string;
  isVisible: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  kycVerified: boolean;
  backgroundCheckVerified: boolean;
  services: Array<{
    id: string;
    serviceType: string;
    yearsExperience: string;
    hourlyRate: number;
    dailyRate: number;
    specialties: string[];
  }>;
};

type ProviderBookingItem = {
  id: string;
  customerId: string;
  customerName: string;
  serviceLabel: string;
  serviceKey: string;
  location: string;
  bookingMode: "hourly" | "daily";
  bookingStatus:
    | "pending"
    | "accepted"
    | "on_the_way"
    | "arrived"
    | "completed"
    | "paid"
    | "review_requested"
    | "reviewed"
    | "declined"
    | "cancelled";
  statusLabel: string;
  bucket: "requests" | "active" | "completed" | "closed";
  schedule: string;
  customerNote: string;
  providerResponseNote: string;
  declineReason: string;
  quotedAmount: number;
  createdAt: string;
};

type ProviderNotificationItem = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

function VerificationPill({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold ${
        active
          ? "bg-[#EAF8EE] text-[#15803D]"
          : "bg-[#F3F4F6] text-[#6B7280]"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          active ? "bg-[#16A34A]" : "bg-[#9CA3AF]"
        }`}
      />
      {label}
    </span>
  );
}

export function ProviderDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<ProviderDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [bookings, setBookings] = useState<ProviderBookingItem[]>([]);
  const [notifications, setNotifications] = useState<ProviderNotificationItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [actionBookingId, setActionBookingId] = useState("");
  const [isSaving, startTransition] = useTransition();
  const [pushState, setPushState] = useState<PushSetupState>({
    permission: "default",
    hasSavedToken: false,
  });
  const [pushBusy, setPushBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    marketingName: "",
    serviceLocation: "",
    serviceRadiusKm: "0",
    bio: "",
  });

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();

    async function loadDashboard() {
      if (!client) {
        if (active) {
          setError("Supabase is not configured yet.");
          setLoading(false);
        }
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!active) {
        return;
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/provider/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const bookingsResponse = await fetch("/api/provider/bookings", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const notificationsResponse = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = (await response.json()) as ProviderDashboardData | { error?: string };
      const bookingsResult = (await bookingsResponse.json()) as
        | { bookings: ProviderBookingItem[] }
        | { error?: string };
      const notificationsResult = (await notificationsResponse.json()) as
        | { notifications: ProviderNotificationItem[] }
        | { error?: string };

      if (!active) {
        return;
      }

      if (!response.ok || !("providerId" in result)) {
        setError("error" in result && result.error ? result.error : "Unable to load provider dashboard.");
        setLoading(false);
        return;
      }

      setData(result);
      setForm({
        fullName: result.fullName,
        marketingName: result.marketingName,
        serviceLocation: result.serviceLocation,
        serviceRadiusKm: String(result.serviceRadiusKm),
        bio: result.bio,
      });
      if (bookingsResponse.ok && "bookings" in bookingsResult) {
        setBookings(bookingsResult.bookings);
      }
      if (notificationsResponse.ok && "notifications" in notificationsResult) {
        setNotifications(notificationsResult.notifications);
      }
      const nextPushState = await getPushSetupState();
      if (active) {
        setPushState(nextPushState);
      }
      setBookingsLoading(false);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  const serviceSummary = useMemo(() => {
    return data?.services.map((service) => ({
      ...service,
      label: service.serviceType
        .replaceAll("_", " ")
        .split(" ")
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" "),
    })) ?? [];
  }, [data]);

  const bookingGroups = useMemo(
    () => ({
      requests: bookings.filter((booking) => booking.bucket === "requests"),
      active: bookings.filter((booking) => booking.bucket === "active"),
      completed: bookings.filter((booking) => booking.bucket === "completed"),
      closed: bookings.filter((booking) => booking.bucket === "closed"),
    }),
    [bookings]
  );

  useEffect(() => {
    const client = getSupabaseClient();

    if (!client || !data?.providerId) {
      return;
    }

    let active = true;
    let sessionToken = "";

    const channel = client
      .channel(`provider-notifications-${data.providerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${data.providerId}`,
        },
        async () => {
          if (!active || !sessionToken) {
            return;
          }

          const [bookingsResponse, notificationsResponse] = await Promise.all([
            fetch("/api/provider/bookings", {
              headers: {
                Authorization: `Bearer ${sessionToken}`,
              },
            }),
            fetch("/api/notifications", {
              headers: {
                Authorization: `Bearer ${sessionToken}`,
              },
            }),
          ]);

          const bookingsResult = (await bookingsResponse.json()) as
            | { bookings: ProviderBookingItem[] }
            | { error?: string };
          const notificationsResult = (await notificationsResponse.json()) as
            | { notifications: ProviderNotificationItem[] }
            | { error?: string };

          if (active && bookingsResponse.ok && "bookings" in bookingsResult) {
            setBookings(bookingsResult.bookings);
          }

          if (active && notificationsResponse.ok && "notifications" in notificationsResult) {
            setNotifications(notificationsResult.notifications);
            const latest = notificationsResult.notifications[0];
            if (latest && !latest.isRead) {
              setNotice(latest.title);
            }
          }
        }
      )
      .subscribe();

    void client.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      sessionToken = data.session?.access_token ?? "";
    });

    return () => {
      active = false;
      client.removeChannel(channel);
    };
  }, [data?.providerId]);

  async function handleSignOut() {
    const client = getSupabaseClient();
    if (!client) {
      router.replace("/login");
      return;
    }

    await client.auth.signOut();
    router.replace("/login");
  }

  function handleSave() {
    const client = getSupabaseClient();

    startTransition(async () => {
      setError("");
      setNotice("");

      if (!client) {
        setError("Supabase is not configured yet.");
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/provider/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: form.fullName,
          marketingName: form.marketingName,
          serviceLocation: form.serviceLocation,
          serviceRadiusKm: Number(form.serviceRadiusKm),
          bio: form.bio,
        }),
      });

      const result = (await response.json()) as ProviderDashboardData | { error?: string };

      if (!response.ok || !("providerId" in result)) {
        setError("error" in result && result.error ? result.error : "Unable to update listing.");
        return;
      }

      setData(result);
      setEditing(false);
      setNotice("Provider listing updated.");
    });
  }

  function handleBookingAction(bookingId: string, status: ProviderBookingItem["bookingStatus"], note = "") {
    const client = getSupabaseClient();

    startTransition(async () => {
      setError("");
      setNotice("");
      setActionBookingId(bookingId);

      if (!client) {
        setError("Supabase is not configured yet.");
        setActionBookingId("");
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        router.replace("/login");
        setActionBookingId("");
        return;
      }

      const response = await fetch(`/api/provider/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status,
          note,
        }),
      });

      const result = (await response.json()) as { success?: true; error?: string };

      if (!response.ok || !result.success) {
        setError(result.error || "Unable to update booking.");
        setActionBookingId("");
        return;
      }

      const refreshResponse = await fetch("/api/provider/bookings", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const refreshResult = (await refreshResponse.json()) as
        | { bookings: ProviderBookingItem[] }
        | { error?: string };

      if (refreshResponse.ok && "bookings" in refreshResult) {
        setBookings(refreshResult.bookings);
      }

      setNotice("Booking updated.");
      setActionBookingId("");
    });
  }

  function handleEnablePush() {
    setPushBusy(true);
    setNotice("");

    startTransition(async () => {
      try {
        const token = await requestNotificationPermission();

        if (!token) {
          const state = await getPushSetupState();
          setPushState(state);
          setNotice(
            state.permission === "denied"
              ? "Push is blocked in this browser. Please allow notifications in browser settings."
              : "Push permission was not granted."
          );
          return;
        }

        const result = await saveFCMToken(token);

        if (!result.success) {
          setError(result.error || "Unable to save push token.");
          return;
        }

        setPushState({
          permission: "granted",
          hasSavedToken: true,
        });
        setNotice("Push notifications enabled on this device.");
      } finally {
        setPushBusy(false);
      }
    });
  }

  function handleDisablePush() {
    setPushBusy(true);
    setNotice("");

    startTransition(async () => {
      try {
        const result = await disablePushNotifications();

        if (!result.success) {
          setError(result.error || "Unable to disable push notifications.");
          return;
        }

        const state = await getPushSetupState();
        setPushState(state);
        setNotice("Push notifications disabled for this device.");
      } finally {
        setPushBusy(false);
      }
    });
  }

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-[#f6fff8] px-4 py-6">
        <div className="mx-auto max-w-[430px]">
          <SharedLoadingState
            title="Loading provider dashboard"
            description="We are preparing your live bookings, notifications, and profile details."
          />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-[100dvh] bg-[#f6fff8] px-4 py-6">
        <div className="mx-auto max-w-[430px] rounded-[28px] border border-[#dbe8df] bg-white p-5 shadow-[0_20px_60px_rgba(22,163,74,0.08)]">
          <h1 className="text-[28px] font-extrabold tracking-[-0.05em] text-[#16a34a]">
            Provider Dashboard
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#6b7280]">
            {error || "We couldn't load your provider account right now."}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[12px] bg-[#16a34a] px-4 text-[14px] font-extrabold text-white"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f6fff8] px-4 py-6">
      <div className="mx-auto max-w-[430px] space-y-4">
        <section className="rounded-[28px] border border-[#dbe8df] bg-white p-5 shadow-[0_20px_60px_rgba(22,163,74,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#16a34a]">
                Provider Dashboard
              </p>
              <h1 className="mt-2 text-[28px] font-extrabold tracking-[-0.05em] text-[#111827]">
                {data.marketingName || data.fullName}
              </h1>
              <p className="mt-1 text-[14px] text-[#4b5563]">{data.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe8df] text-[#16a34a]"
              aria-label="Sign out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <VerificationPill label={`Account ${data.accountStatus}`} active={true} />
            <VerificationPill label={data.emailVerified ? "Email Verified" : "Email Not Verified"} active={data.emailVerified} />
            <VerificationPill label={data.approvalStatus === "Approved" ? "Admin Approved" : "Pending Admin Review"} active={data.approvalStatus === "Approved"} />
            <VerificationPill label={data.isVisible ? "Listing Live" : "Listing Hidden"} active={data.isVisible} />
          </div>

          <div className="mt-4 rounded-[18px] border border-[#e4ece7] bg-[#fbfffc] p-4 text-[13px] leading-6 text-[#4b5563]">
            Your listing can stay live while verification is still in progress. The public verified badge only appears after the required checks are complete.
          </div>

          {error ? (
            <p className="mt-4 rounded-[14px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[13px] font-semibold text-[#dc2626]">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="mt-4 rounded-[14px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[13px] font-semibold text-[#15803d]">
              {notice}
            </p>
          ) : null}
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-extrabold text-[#111827]">Push Notifications</h2>
            <span
              className={`rounded-full px-3 py-1 text-[12px] font-bold ${
                pushState.permission === "granted" && pushState.hasSavedToken
                  ? "bg-[#eef9f1] text-[#16a34a]"
                  : "bg-[#eef2f7] text-[#64748b]"
              }`}
            >
              {pushState.permission === "unsupported"
                ? "Not supported"
                : pushState.permission === "denied"
                  ? "Blocked"
                  : pushState.permission === "granted" && pushState.hasSavedToken
                    ? "Enabled"
                    : pushState.permission === "granted"
                      ? "Ready to enable"
                      : "Permission needed"}
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-[#4b5563]">
            Get booking requests and status updates even when the app is closed.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pushBusy || pushState.permission === "unsupported"}
              onClick={handleEnablePush}
              className="inline-flex h-10 items-center justify-center rounded-[12px] bg-[#16a34a] px-4 text-[13px] font-extrabold text-white disabled:opacity-60"
            >
              {pushBusy ? "Updating..." : "Enable Push"}
            </button>
            <button
              type="button"
              disabled={
                pushBusy ||
                (pushState.permission !== "granted" || !pushState.hasSavedToken)
              }
              onClick={handleDisablePush}
              className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#dbe8df] bg-white px-4 text-[13px] font-extrabold text-[#111827] disabled:opacity-60"
            >
              Disable Push
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-extrabold text-[#111827]">Live Notifications</h2>
            <span className="rounded-full bg-[#eef9f1] px-3 py-1 text-[12px] font-bold text-[#16a34a]">
              {notifications.filter((item) => !item.isRead).length} unread
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 ? (
              <SharedEmptyState
                title="No notifications yet"
                description="New booking requests and task updates will appear here."
              />
            ) : (
              notifications.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[18px] border p-4 ${
                    item.isRead
                      ? "border-[#e4ece7] bg-[#fbfffc]"
                      : "border-[#bbf7d0] bg-[#f6fff8]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#eef9f1] text-[#16a34a]">
                      <Bell className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold text-[#111827]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-6 text-[#4b5563]">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-extrabold text-[#111827]">Booking Requests</h2>
            <span className="rounded-full bg-[#eef9f1] px-3 py-1 text-[12px] font-bold text-[#16a34a]">
              {bookingGroups.requests.length} pending
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {bookingsLoading ? (
              <div className="rounded-[18px] border border-[#e4ece7] bg-[#fbfffc] p-4 text-[13px] text-[#6b7280]">
                Loading bookings...
              </div>
            ) : bookingGroups.requests.length === 0 ? (
              <SharedEmptyState
                title="No pending booking requests"
                description="When a customer books you, the request will appear here for acceptance or decline."
              />
            ) : (
              bookingGroups.requests.map((booking) => (
                <ProviderBookingCard
                  key={booking.id}
                  booking={booking}
                  actionBookingId={actionBookingId}
                  onAccept={() => handleBookingAction(booking.id, "accepted", "Provider accepted booking")}
                  onDecline={() => handleBookingAction(booking.id, "declined", "Provider declined booking")}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-extrabold text-[#111827]">Active Tasks</h2>
            <span className="rounded-full bg-[#eef9f1] px-3 py-1 text-[12px] font-bold text-[#16a34a]">
              {bookingGroups.active.length} active
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {bookingGroups.active.length === 0 ? (
              <SharedEmptyState
                title="No active tasks right now"
                description="Accepted bookings will move here once you start handling them."
              />
            ) : (
              bookingGroups.active.map((booking) => (
                <ProviderBookingCard
                  key={booking.id}
                  booking={booking}
                  actionBookingId={actionBookingId}
                  onAdvance={() =>
                    handleBookingAction(
                      booking.id,
                      booking.bookingStatus === "accepted"
                        ? "on_the_way"
                        : booking.bookingStatus === "on_the_way"
                          ? "arrived"
                          : booking.bookingStatus === "arrived"
                            ? "completed"
                            : "accepted"
                    )
                  }
                  advanceLabel={
                    booking.bookingStatus === "accepted"
                      ? "Mark On the Way"
                      : booking.bookingStatus === "on_the_way"
                        ? "Mark Arrived"
                        : booking.bookingStatus === "arrived"
                          ? "Mark Completed"
                          : "Continue"
                  }
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-extrabold text-[#111827]">Completion & Payment</h2>
            <span className="rounded-full bg-[#eef9f1] px-3 py-1 text-[12px] font-bold text-[#16a34a]">
              {bookingGroups.completed.length} to close
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {bookingGroups.completed.length === 0 ? (
              <SharedEmptyState
                title="Nothing waiting for payment or review"
                description="Completed jobs will move here until payment and review are handled."
              />
            ) : (
              bookingGroups.completed.map((booking) => (
                <ProviderBookingCard
                  key={booking.id}
                  booking={booking}
                  actionBookingId={actionBookingId}
                  onAdvance={() =>
                    handleBookingAction(
                      booking.id,
                      booking.bookingStatus === "completed"
                        ? "paid"
                        : "review_requested"
                    )
                  }
                  advanceLabel={
                    booking.bookingStatus === "completed"
                      ? "Mark Payment Done"
                      : "Request Review"
                  }
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-extrabold text-[#111827]">Manage Listing</h2>
            <button
              type="button"
              onClick={() => setEditing((current) => !current)}
              className="inline-flex items-center gap-2 rounded-[12px] border border-[#dbe8df] px-3 py-2 text-[13px] font-bold text-[#16a34a]"
            >
              <PencilLine className="h-4 w-4" />
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Full Name" value={form.fullName} editing={editing} onChange={(value) => setForm((current) => ({ ...current, fullName: value }))} />
            <Field label="Marketing Name" value={form.marketingName} editing={editing} onChange={(value) => setForm((current) => ({ ...current, marketingName: value }))} />
            <Field label="Service Location" value={form.serviceLocation} editing={editing} onChange={(value) => setForm((current) => ({ ...current, serviceLocation: value }))} icon={<MapPin className="h-4 w-4 text-[#6b7280]" />} />
            <Field label="Service Radius (KM)" value={form.serviceRadiusKm} editing={editing} onChange={(value) => setForm((current) => ({ ...current, serviceRadiusKm: value }))} />
            <FieldArea label="Bio" value={form.bio} editing={editing} onChange={(value) => setForm((current) => ({ ...current, bio: value }))} />
          </div>

          {editing ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#16a34a] px-4 text-[14px] font-extrabold text-white disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Listing"}
            </button>
          ) : null}
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <h2 className="text-[18px] font-extrabold text-[#111827]">Verification Status</h2>
          <div className="mt-4 grid gap-3">
            <StatusRow icon={<Mail className="h-4.5 w-4.5 text-[#16a34a]" />} label="Email" value={data.emailVerified ? "Verified" : "Not verified"} />
            <StatusRow icon={<Phone className="h-4.5 w-4.5 text-[#16a34a]" />} label="Phone" value={data.phoneVerified ? "Verified" : "Pending"} />
            <StatusRow icon={<ShieldCheck className="h-4.5 w-4.5 text-[#16a34a]" />} label="Identity" value={data.identityVerified ? "Verified" : "Pending"} />
            <StatusRow icon={<BadgeCheck className="h-4.5 w-4.5 text-[#16a34a]" />} label="Admin Approval" value={data.approvalStatus} />
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <h2 className="text-[18px] font-extrabold text-[#111827]">Services</h2>
          <div className="mt-4 space-y-3">
            {serviceSummary.map((service) => (
              <div key={service.id} className="rounded-[18px] border border-[#e4ece7] bg-[#fbfffc] p-4">
                <p className="text-[15px] font-extrabold text-[#111827]">{service.label}</p>
                <p className="mt-1 text-[13px] text-[#4b5563]">
                  {service.yearsExperience || "Experience not set"} - RM{service.hourlyRate}/hr - RM{service.dailyRate}/day
                </p>
                <p className="mt-2 text-[12px] text-[#6b7280]">
                  {service.specialties.length > 0
                    ? service.specialties.join(", ")
                    : "No specialties added yet."}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProviderBookingCard({
  booking,
  actionBookingId,
  onAccept,
  onDecline,
  onAdvance,
  advanceLabel,
}: {
  booking: ProviderBookingItem;
  actionBookingId: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onAdvance?: () => void;
  advanceLabel?: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#e4ece7] bg-[#fbfffc] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-extrabold text-[#111827]">
            {booking.serviceLabel}
          </p>
          <p className="mt-1 text-[13px] text-[#4b5563]">
            {booking.customerName}
          </p>
        </div>
        <SharedStatusBadge label={booking.statusLabel} tone={providerStatusTone(booking.bookingStatus)} />
      </div>

      <div className="mt-3 space-y-2 text-[13px] text-[#4b5563]">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#16a34a]" />
          <span>{booking.schedule}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#16a34a]" />
          <span>{booking.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-[#16a34a]" />
          <span>RM{booking.quotedAmount.toFixed(2)}</span>
        </div>
        {booking.customerNote ? (
          <div className="flex items-start gap-2">
            <MessageSquareText className="mt-0.5 h-4 w-4 text-[#16a34a]" />
            <span>{booking.customerNote}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {onAccept ? (
          <AppButton
            disabled={actionBookingId === booking.id}
            onClick={onAccept}
            className="h-10"
          >
            Accept
          </AppButton>
        ) : null}
        {onDecline ? (
          <AppButton
            disabled={actionBookingId === booking.id}
            onClick={onDecline}
            tone="danger"
            className="h-10"
          >
            Decline
          </AppButton>
        ) : null}
        {onAdvance && advanceLabel ? (
          <AppButton
            disabled={actionBookingId === booking.id}
            onClick={onAdvance}
            tone="secondary"
            icon={<Route className="h-4 w-4 text-[#16a34a]" />}
            className="h-10"
          >
            {advanceLabel}
          </AppButton>
        ) : null}
      </div>
    </div>
  );
}

function providerStatusTone(status: ProviderBookingItem["bookingStatus"]) {
  switch (status) {
    case "accepted":
    case "paid":
    case "review_requested":
      return "accepted" as const;
    case "declined":
      return "declined" as const;
    case "completed":
      return "completed" as const;
    case "cancelled":
      return "cancelled" as const;
    default:
      return "pending" as const;
  }
}

function Field({
  label,
  value,
  editing,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-[#111827]">{label}</span>
      <div className="flex items-center rounded-[12px] border border-[#dfe8e2] px-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={!editing}
          className="h-11 w-full border-0 bg-transparent text-[14px] text-[#111827] outline-none disabled:text-[#6b7280]"
        />
        {icon ? <span className="ml-3">{icon}</span> : null}
      </div>
    </label>
  );
}

function FieldArea({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-[#111827]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!editing}
        className="min-h-[110px] w-full rounded-[12px] border border-[#dfe8e2] px-4 py-3 text-[14px] text-[#111827] outline-none shadow-[0_8px_20px_rgba(15,23,42,0.03)] disabled:text-[#6b7280]"
      />
    </label>
  );
}

function StatusRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#e4ece7] bg-[#fbfffc] px-4 py-3">
      <div className="flex items-center gap-3 text-[14px] text-[#111827]">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <span className="text-[13px] font-bold text-[#16a34a]">{value}</span>
    </div>
  );
}
