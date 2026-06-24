import {
  BadgeCheck,
  Ban,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Edit3,
  FileClock,
  FileText,
  KeyRound,
  Mail,
  MapPin,
  MonitorSmartphone,
  Phone,
  ScanFace,
  Shield,
  ShieldCheck,
  Star,
  Trash2,
  UserCircle2,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  InfoRow,
  MetricTile,
  MiniStatus,
  PillBadge,
  ReviewStars,
  SurfaceCard,
  TableShell,
  TimelineItem,
  VerificationDot,
} from "../components/user-detail-ui";
import { userDetailRecords } from "../data/user-detail-mocks";
import {
  deleteUserRecord,
  getUserProfileWithFallback,
  setUserSuspended,
  updateUserProfile,
} from "../lib/admin-users";
import type { DashboardBooking, PaymentRow, UserDetailRecord } from "../types";

const tabs = [
  "Overview",
  "Tasks",
  "Payments",
  "Reviews",
  "Reports",
  "Documents & Verification",
  "Service Areas",
  "Activity Log",
] as const;

type TabKey = (typeof tabs)[number];

const metricIcons = [
  <CalendarDays className="size-5" />,
  <CheckCircle2 className="size-5" />,
  <Ban className="size-5" />,
  <Wallet className="size-5" />,
  <CreditCard className="size-5" />,
  <Star className="size-5" />,
  <FileText className="size-5" />,
];

const metricAccents: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  slate: "bg-slate-100 text-slate-600",
  green: "bg-green-50 text-green-600",
};

function isVerifiedLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("verified") && !normalized.includes("not yet");
}

function avatarGradient(name: string) {
  const palette = [
    "from-emerald-300 via-teal-200 to-white",
    "from-sky-300 via-cyan-100 to-white",
    "from-amber-300 via-orange-100 to-white",
    "from-rose-300 via-pink-100 to-white",
  ];
  const index = name.length % palette.length;
  return palette[index];
}

function normalizeEditableDate(value: string) {
  if (!value || value === "Not provided") {
    return "";
  }

  const trimmed = value.split(" (")[0]?.trim() ?? "";
  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type DateFilterKey = "all" | "date" | "week" | "month" | "year";
type SortKey = "recent" | "a-z";
type UserTaskStatusKey = "all" | "booked" | "pending" | "cancelled";

function parseDisplayDate(value: string) {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.replace("Recently", "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function matchesDateFilter(value: string, filter: DateFilterKey) {
  if (filter === "all") {
    return true;
  }

  const parsed = parseDisplayDate(value);
  if (!parsed) {
    return false;
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (filter === "date") {
    return parsed.toDateString() === now.toDateString();
  }

  if (filter === "week") {
    return diffDays <= 7;
  }

  if (filter === "month") {
    return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth();
  }

  return parsed.getFullYear() === now.getFullYear();
}

function sortByRecentOrAz<T extends { sortLabel: string; sortDate: string }>(rows: T[], sort: SortKey) {
  const next = [...rows];

  if (sort === "a-z") {
    return next.sort((left, right) => left.sortLabel.localeCompare(right.sortLabel));
  }

  return next.sort((left, right) => {
    const leftDate = parseDisplayDate(left.sortDate)?.getTime() ?? 0;
    const rightDate = parseDisplayDate(right.sortDate)?.getTime() ?? 0;
    return rightDate - leftDate;
  });
}

function parseCurrencyValue(value: string) {
  const cleaned = value.replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrencyValue(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryStrip({
  items,
}: {
  items: Array<{ label: string; value: string; note?: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-[#E7ECE7] bg-slate-50/70 px-4 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
          <p className="mt-2 text-xl font-bold text-slate-950">{item.value}</p>
          {item.note ? <p className="mt-1 text-[12px] text-slate-500">{item.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function UserProfilePage() {
  const { userId = "" } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const [record, setRecord] = useState<UserDetailRecord | null>(userDetailRecords[userId] ?? null);
  const [relatedBookings, setRelatedBookings] = useState<DashboardBooking[]>([]);
  const [relatedPayments, setRelatedPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(record?.status ?? "Active");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [taskDateFilter, setTaskDateFilter] = useState<DateFilterKey>("all");
  const [taskSort, setTaskSort] = useState<SortKey>("recent");
  const [taskStatusFilter, setTaskStatusFilter] = useState<UserTaskStatusKey>("all");
  const [paymentDateFilter, setPaymentDateFilter] = useState<DateFilterKey>("all");
  const [paymentSort, setPaymentSort] = useState<SortKey>("recent");
  const [reviewDateFilter, setReviewDateFilter] = useState<DateFilterKey>("all");
  const [reviewSort, setReviewSort] = useState<SortKey>("recent");
  const [reportDateFilter, setReportDateFilter] = useState<DateFilterKey>("all");
  const [reportSort, setReportSort] = useState<SortKey>("recent");
  const [form, setForm] = useState({
    name: record?.name ?? "",
    email: record?.email ?? "",
    phone: record?.phone ?? "",
    dob: normalizeEditableDate(record?.dob ?? ""),
    gender: record?.gender === "Not provided" ? "" : (record?.gender ?? ""),
    city: record?.city === "Malaysia" ? "" : (record?.city ?? ""),
  });

  useEffect(() => {
    let active = true;

    setActiveTab("Overview");
    setMessage(null);
    setLoading(true);

    async function loadUser() {
      const fallbackRecord = userDetailRecords[userId] ?? null;

      if (active) {
        setRecord(fallbackRecord);
        setStatus(fallbackRecord?.status ?? "Active");
      }

      const payload = await getUserProfileWithFallback(userId);

      if (!active) {
        return;
      }

      setRecord(payload.detail);
      setRelatedBookings(payload.relatedBookings);
      setRelatedPayments(payload.relatedPayments);
      setStatus(payload.detail?.status ?? "Active");
      setForm({
        name: payload.detail?.name ?? "",
        email: payload.detail?.email ?? "",
        phone: payload.detail?.phone ?? "",
        dob: normalizeEditableDate(payload.detail?.dob ?? ""),
        gender: payload.detail?.gender === "Not provided" ? "" : (payload.detail?.gender ?? ""),
        city: payload.detail?.city === "Malaysia" ? "" : (payload.detail?.city ?? ""),
      });
      setLoading(false);
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [userId]);

  const defaultUserDetail = Object.values(userDetailRecords)[0]!;
  const safeDetail =
    record ?? userDetailRecords[userId] ?? defaultUserDetail;
  const recentReviews = safeDetail.recentReviews;
  const taskRows = useMemo(
    () =>
      relatedBookings.map((booking) => {
        const normalized = booking.status.trim().toLowerCase();
        const taskType =
          normalized.includes("cancel") || normalized === "declined"
            ? "cancelled"
            : ["pending", "accepted", "on the way", "arrived", "in progress"].includes(normalized)
              ? "pending"
              : "booked";
        return {
          ...booking,
          taskType: taskType as Exclude<UserTaskStatusKey, "all">,
          sortLabel: booking.provider,
          sortDate: booking.schedule,
        };
      }),
    [relatedBookings]
  );
  const filteredTaskRows = useMemo(() => {
    const statusFiltered = taskRows.filter((task) =>
      taskStatusFilter === "all" ? true : task.taskType === taskStatusFilter
    );
    const dateFiltered = statusFiltered.filter((task) => matchesDateFilter(task.schedule, taskDateFilter));
    return sortByRecentOrAz(dateFiltered, taskSort);
  }, [taskRows, taskStatusFilter, taskDateFilter, taskSort]);

  const paymentRows = useMemo(
    () =>
      relatedPayments.map((payment) => ({
        ...payment,
        numericAmount: parseCurrencyValue(payment.amount),
        sortLabel: payment.method,
        sortDate: payment.date,
      })),
    [relatedPayments]
  );
  const filteredPaymentRows = useMemo(() => {
    const dateFiltered = paymentRows.filter((payment) => matchesDateFilter(payment.date, paymentDateFilter));
    return sortByRecentOrAz(dateFiltered, paymentSort);
  }, [paymentRows, paymentDateFilter, paymentSort]);

  const totalPaidValue = filteredPaymentRows.reduce((sum, payment) => sum + payment.numericAmount, 0);
  const earningPoints = Math.floor(totalPaidValue);
  const walletBalanceValue = parseCurrencyValue(safeDetail.walletBalance);
  const balanceWithPointsValue = walletBalanceValue + earningPoints;

  const filteredReviewRows = useMemo(() => {
    const rows = recentReviews
      .filter((review) => matchesDateFilter(review.date, reviewDateFilter))
      .map((review) => ({
        ...review,
        sortLabel: review.provider,
        sortDate: review.date,
      }));
    return sortByRecentOrAz(rows, reviewSort);
  }, [recentReviews, reviewDateFilter, reviewSort]);

  const filteredReportRows = useMemo(() => {
    const rows = safeDetail.reports
      .filter((report) => matchesDateFilter(report.submitted, reportDateFilter))
      .map((report) => ({
        ...report,
        sortLabel: report.title,
        sortDate: report.submitted,
      }));
    return sortByRecentOrAz(rows, reportSort);
  }, [safeDetail.reports, reportDateFilter, reportSort]);

  const verificationDocuments = useMemo(
    () => [
      {
        id: "user-email",
        label: "Email Verification",
        status: isVerifiedLabel(safeDetail.emailVerifiedAt) ? "Verified" : "Pending",
        updated: safeDetail.emailVerifiedAt || "Not verified",
      },
      {
        id: "user-phone",
        label: "Phone Verification",
        status: isVerifiedLabel(safeDetail.phoneVerifiedAt) ? "Verified" : "Pending",
        updated: safeDetail.phoneVerifiedAt || "Not verified",
      },
      {
        id: "user-ic-front",
        label: "IC Front",
        status: safeDetail.documents[0]?.status ?? "Pending",
        updated: safeDetail.documents[0]?.updated ?? "Not uploaded",
      },
      {
        id: "user-ic-back",
        label: "IC Back",
        status: safeDetail.documents[1]?.status ?? "Pending",
        updated: safeDetail.documents[1]?.updated ?? "Not uploaded",
      },
      {
        id: "user-license",
        label: "Driving License",
        status: safeDetail.documents[2]?.status ?? "Pending",
        updated: safeDetail.documents[2]?.updated ?? "Not uploaded",
      },
      {
        id: "user-resume",
        label: "Resume",
        status: "Pending",
        updated: "Not uploaded",
      },
      {
        id: "user-certificates",
        label: "Certificates",
        status: "Pending",
        updated: "Not uploaded",
      },
    ],
    [safeDetail]
  );

  if (loading && !record) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      </div>
    );
  }

  if (!record) {
    return (
      <SurfaceCard title="User Details">
        <p className="text-sm text-slate-500">User record was not found.</p>
      </SurfaceCard>
    );
  }

  const detail = record;

  function flash(nextMessage: string) {
    setMessage(nextMessage);
  }

  async function handleSuspend() {
    if (!record || saving) {
      return;
    }

    const nextStatus = status === "Suspended" ? "Active" : "Suspended";
    setSaving(true);
    const result = await setUserSuspended(record.userId, nextStatus === "Suspended");
    setSaving(false);

    if (result.error) {
      flash(result.error);
      return;
    }

    setStatus(nextStatus);
    setRecord((current) => (current ? { ...current, status: nextStatus } : current));
    flash(nextStatus === "Suspended" ? "User suspended." : "User restored.");
  }

  async function handleSaveProfile() {
    if (!record || saving) {
      return;
    }

    setSaving(true);
    const result = await updateUserProfile(record.userId, {
      full_name: form.name,
      email: form.email,
      phone: form.phone,
      dob: form.dob,
      gender: form.gender,
      city: form.city,
    });
    setSaving(false);

    if (result.error) {
      flash(result.error);
      return;
    }

    setRecord((current) =>
      current
        ? {
            ...current,
            name: form.name,
            email: form.email,
            phone: form.phone,
            dob: form.dob ? form.dob : "Not provided",
            gender: form.gender || "Not provided",
            city: form.city || "Malaysia",
          }
        : current
    );
    setEditing(false);
    flash("User details updated.");
  }

  async function handleDeleteUser() {
    if (!record || saving) {
      return;
    }

    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) {
      return;
    }

    setSaving(true);
    const result = await deleteUserRecord(record.userId);
    setSaving(false);

    if (result.error) {
      flash(result.error);
      return;
    }

    flash(result.mode === "soft-deleted" ? "User marked as deleted." : "User deleted.");
    window.setTimeout(() => {
      navigate("/users");
    }, 500);
  }

  function renderOverview() {
    return (
      <>
        <section className="grid gap-4 xl:grid-cols-[1.02fr_1.28fr_1.02fr]">
          <div className="space-y-4">
            <SurfaceCard
              title="Personal Information"
              action={
                <button
                  type="button"
                  onClick={() => setEditing((current) => !current)}
                  className="rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                >
                  {editing ? "Cancel" : "Edit"}
                </button>
              }
            >
              <div className="space-y-4">
                <InfoRow
                  label="Full Name"
                  value={
                    editing ? (
                      <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                      />
                    ) : (
                      detail.name
                    )
                  }
                  icon={<UserCircle2 className="size-4" />}
                />
                <InfoRow
                  label="Email Address"
                  value={
                    editing ? (
                      <input
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                      />
                    ) : (
                      detail.email
                    )
                  }
                  icon={<Mail className="size-4" />}
                />
                <InfoRow
                  label="Phone Number"
                  value={
                    editing ? (
                      <input
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                      />
                    ) : (
                      detail.phone
                    )
                  }
                  icon={<Phone className="size-4" />}
                />
                <InfoRow
                  label="Date of Birth"
                  value={
                    editing ? (
                      <input
                        type="date"
                        value={form.dob}
                        onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                      />
                    ) : (
                      detail.dob
                    )
                  }
                  icon={<CalendarDays className="size-4" />}
                />
                <InfoRow
                  label="Gender"
                  value={
                    editing ? (
                      <input
                        value={form.gender}
                        onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                      />
                    ) : (
                      detail.gender
                    )
                  }
                  icon={<Shield className="size-4" />}
                />
                <InfoRow
                  label="City"
                  value={
                    editing ? (
                      <input
                        value={form.city}
                        onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                      />
                    ) : (
                      detail.city
                    )
                  }
                  icon={<MapPin className="size-4" />}
                />
                <InfoRow
                  label="Region / State"
                  value={detail.region || "Not provided"}
                  icon={<MapPin className="size-4" />}
                />
                <InfoRow
                  label="Country"
                  value={detail.country || "Malaysia"}
                  icon={<MapPin className="size-4" />}
                />
              </div>
              {editing ? (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : null}
            </SurfaceCard>

            <SurfaceCard
              title="Saved Addresses"
              action={<button className="text-xs font-semibold text-emerald-700">View all</button>}
            >
              <div className="space-y-4">
                {detail.addresses.map((address) => (
                  <div key={address.id} className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5 grid size-8 place-items-center rounded-full bg-slate-50 text-slate-500">
                        <MapPin className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{address.label}</p>
                        <p className="mt-1 text-[13px] text-slate-500">{address.line1}</p>
                        <p className="text-[13px] text-slate-500">{address.line2}</p>
                      </div>
                    </div>
                    {address.tag ? (
                      <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                        {address.tag}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard title="Verification & Security">
              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  ["Email Verified", detail.emailVerifiedAt],
                  ["Phone Verified", detail.phoneVerifiedAt],
                  ["KYC Verified", detail.kycVerifiedAt],
                ] as Array<[string, string]>).map(([label, date]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <VerificationDot status={isVerifiedLabel(date) ? "Verified" : "Pending"} />
                      {label}
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {isVerifiedLabel(date) ? `Verified on ${date}` : date}
                    </p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard
            title="Activity Timeline"
            action={<button className="rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">View all activity</button>}
            className="h-full"
          >
            <div className="space-y-5">
              {detail.timeline.map((item, index) => (
                <div key={item.id} className="relative">
                  {index < detail.timeline.length - 1 ? (
                    <div className="absolute left-4 top-10 h-[calc(100%+0.8rem)] w-px bg-slate-200" />
                  ) : null}
                  <TimelineItem
                    title={item.title}
                    note={item.note}
                    time={item.time}
                    tone={item.tone}
                    icon={
                      item.tone === "emerald" ? (
                        <CheckCircle2 className="size-4" />
                      ) : item.tone === "sky" ? (
                        <CalendarDays className="size-4" />
                      ) : item.tone === "violet" ? (
                        <CreditCard className="size-4" />
                      ) : (
                        <Star className="size-4" />
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </SurfaceCard>

          <div className="space-y-4">
            <SurfaceCard title="User Status">
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Account Status</span>
                  <MiniStatus status={status} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Account Type</span>
                  <span className="font-medium text-slate-900">{detail.accountType}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Member Since</span>
                  <span className="font-medium text-slate-900">{detail.joined}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Last Login</span>
                  <span className="font-medium text-slate-900">{detail.lastLogin}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Login Count</span>
                  <span className="font-medium text-slate-900">{detail.loginCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Failed Login Attempts</span>
                  <span className="font-medium text-slate-900">{detail.failedLogins}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Two Factor Auth</span>
                  <span className="font-medium text-slate-900">{detail.twoFactorAuth}</span>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard title="Recent Actions">
              <div className="space-y-3">
                {detail.recentActions.map((action) => (
                  <div key={action.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <FileClock className="size-4 text-slate-400" />
                      <span>{action.label}</span>
                    </div>
                    <span className="text-[12px] text-slate-400">{action.time}</span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <TableShell title="Recent Bookings" action={<button className="text-xs font-semibold text-emerald-700">View all bookings</button>}>
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Booking ID</th>
                  <th className="pb-3 font-semibold">Service</th>
                  <th className="pb-3 font-semibold">Provider</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {relatedBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-50 align-top">
                    <td className="py-3 font-semibold text-emerald-700">{booking.id}</td>
                    <td className="py-3 text-slate-700">{booking.service}</td>
                    <td className="py-3 text-slate-700">{booking.provider}</td>
                    <td className="py-3 text-slate-500">{booking.schedule}</td>
                    <td className="py-3 text-slate-700">{booking.amount}</td>
                    <td className="py-3"><MiniStatus status={booking.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>

          <TableShell title="Recent Payments" action={<button className="text-xs font-semibold text-emerald-700">View all payments</button>}>
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Payment ID</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {relatedPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-50 align-top">
                    <td className="py-3 font-semibold text-slate-700">{payment.id}</td>
                    <td className="py-3 text-slate-700">{payment.method}</td>
                    <td className="py-3 text-slate-700">{payment.amount}</td>
                    <td className="py-3"><MiniStatus status={payment.status} /></td>
                    <td className="py-3 text-slate-500">{payment.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>

          <TableShell title="Recent Reviews" action={<button className="text-xs font-semibold text-emerald-700">View all reviews</button>}>
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Provider</th>
                  <th className="pb-3 font-semibold">Rating</th>
                  <th className="pb-3 font-semibold">Review</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentReviews.map((review) => (
                  <tr key={review.id} className="border-b border-slate-50 align-top">
                    <td className="py-3 text-slate-700">{review.provider}</td>
                    <td className="py-3"><ReviewStars rating={review.rating} /></td>
                    <td className="py-3 text-slate-700">{review.review}</td>
                    <td className="py-3 text-slate-500">{review.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </section>
      </>
    );
  }

  function renderSimpleTable(
    title: string,
    headers: string[],
    rows: string[][]
  ) {
    return (
      <TableShell title={title}>
        <table className="min-w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              {headers.map((header) => (
                <th key={header} className="pb-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-slate-50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="py-3 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-[#E7ECE7] bg-white px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div
              className={`grid size-[104px] shrink-0 place-items-center rounded-[30px] bg-gradient-to-br ${avatarGradient(detail.name)} shadow-inner ring-8 ring-slate-50`}
            >
              <div className="grid size-[82px] place-items-center rounded-[26px] bg-white/70 backdrop-blur">
                <span className="font-display text-[2rem] font-extrabold text-slate-700">
                  {detail.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-[2rem] font-extrabold tracking-tight text-slate-950">
                  {detail.name}
                </h1>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">User ID: {detail.userId}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <PillBadge tone={isVerifiedLabel(detail.emailVerifiedAt) ? "emerald" : "slate"}>
                  <BadgeCheck className="size-3.5" /> {isVerifiedLabel(detail.emailVerifiedAt) ? "Email Verified" : "Email Pending"}
                </PillBadge>
                <PillBadge tone={isVerifiedLabel(detail.phoneVerifiedAt) ? "emerald" : "slate"}>
                  <Phone className="size-3.5" /> {isVerifiedLabel(detail.phoneVerifiedAt) ? "Phone Verified" : "Phone Pending"}
                </PillBadge>
                <PillBadge tone={isVerifiedLabel(detail.kycVerifiedAt) ? "emerald" : "slate"}>
                  <ScanFace className="size-3.5" /> {isVerifiedLabel(detail.kycVerifiedAt) ? "KYC Verified" : "KYC Pending"}
                </PillBadge>
                <PillBadge tone="blue">{detail.accountType}</PillBadge>
              </div>

              <div className="mt-5 grid gap-4 text-sm text-slate-500 sm:grid-cols-2 xl:grid-cols-5">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Registered</p>
                    <p className="mt-1 font-medium text-slate-900">{detail.registeredAt}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Last Login</p>
                    <p className="mt-1 font-medium text-slate-900">{detail.lastLogin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MonitorSmartphone className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Device</p>
                    <p className="mt-1 font-medium text-slate-900">{detail.device}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">IP Address</p>
                    <p className="mt-1 font-medium text-slate-900">{detail.ipAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Referrer</p>
                    <p className="mt-1 font-medium text-slate-900">{detail.referrer}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 xl:max-w-[580px] xl:justify-end">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700"
            >
              <Edit3 className="size-4" />
              Edit User
            </button>
            <button
              type="button"
              onClick={handleSuspend}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 px-5 py-3 text-sm font-semibold text-amber-700"
            >
              <Ban className="size-4" />
              {status === "Suspended" ? "Restore User" : "Suspend User"}
            </button>
            <button
              type="button"
              onClick={() => flash("Password reset link sent.")}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 px-5 py-3 text-sm font-semibold text-blue-700"
            >
              <KeyRound className="size-4" />
              Reset Password
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600"
            >
              <Trash2 className="size-4" />
              Delete User
            </button>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        {detail.metrics.map((metric, index) => (
          <MetricTile
            key={metric.id}
            icon={metricIcons[index] ?? <ShieldCheck className="size-5" />}
            label={metric.label}
            value={metric.value}
            note={metric.note}
            accent={(metricAccents[metric.tone as keyof typeof metricAccents] ?? metricAccents.slate) as string}
            action={metric.label === "Total Bookings" || metric.label === "Reports Submitted" ? `View ${metric.label.toLowerCase()}` : undefined}
          />
        ))}
      </section>

      <section className="rounded-[22px] border border-[#E7ECE7] bg-white px-4 py-2 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab
                  ? "border-b-2 border-emerald-500 text-emerald-700"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "Overview" ? renderOverview() : null}

      {activeTab === "Tasks" ? (
        <div className="space-y-4">
          <SurfaceCard title="Tasks">
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Status"
                value={taskStatusFilter}
                onChange={(value) => setTaskStatusFilter(value as UserTaskStatusKey)}
                options={[
                  { value: "all", label: "All" },
                  { value: "booked", label: "Booked" },
                  { value: "pending", label: "Pending" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
              <FilterSelect
                label="Filter"
                value={taskDateFilter}
                onChange={(value) => setTaskDateFilter(value as DateFilterKey)}
                options={[
                  { value: "all", label: "All time" },
                  { value: "date", label: "Today" },
                  { value: "week", label: "This week" },
                  { value: "month", label: "This month" },
                  { value: "year", label: "This year" },
                ]}
              />
              <FilterSelect
                label="Sort"
                value={taskSort}
                onChange={(value) => setTaskSort(value as SortKey)}
                options={[
                  { value: "recent", label: "Recent" },
                  { value: "a-z", label: "A-Z" },
                ]}
              />
            </div>
          </SurfaceCard>

          <SummaryStrip
            items={[
              { label: "All Task", value: String(taskRows.length) },
              { label: "Booked", value: String(taskRows.filter((task) => task.taskType === "booked").length) },
              { label: "Pending", value: String(taskRows.filter((task) => task.taskType === "pending").length) },
              { label: "Cancelled", value: String(taskRows.filter((task) => task.taskType === "cancelled").length) },
            ]}
          />

          <TableShell title="Task History">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Task ID</th>
                  <th className="pb-3 font-semibold">Service</th>
                  <th className="pb-3 font-semibold">Provider</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTaskRows.length ? (
                  filteredTaskRows.map((task) => (
                    <tr key={`${task.taskType}-${task.id}`} className="border-b border-slate-50">
                      <td className="py-3 font-semibold text-emerald-700">{task.id}</td>
                      <td className="py-3 text-slate-700">{task.service}</td>
                      <td className="py-3 text-slate-700">{task.provider}</td>
                      <td className="py-3 text-slate-500">{task.schedule}</td>
                      <td className="py-3 text-slate-700">{task.amount}</td>
                      <td className="py-3"><MiniStatus status={task.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                      No tasks found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </div>
      ) : null}

      {activeTab === "Payments" ? (
        <div className="space-y-4">
          <SurfaceCard title="Payments">
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Filter"
                value={paymentDateFilter}
                onChange={(value) => setPaymentDateFilter(value as DateFilterKey)}
                options={[
                  { value: "all", label: "All time" },
                  { value: "date", label: "Today" },
                  { value: "week", label: "This week" },
                  { value: "month", label: "This month" },
                  { value: "year", label: "This year" },
                ]}
              />
              <FilterSelect
                label="Sort"
                value={paymentSort}
                onChange={(value) => setPaymentSort(value as SortKey)}
                options={[
                  { value: "recent", label: "Recent" },
                  { value: "a-z", label: "A-Z" },
                ]}
              />
            </div>
          </SurfaceCard>

          <SummaryStrip
            items={[
              { label: "Total Paid", value: formatCurrencyValue(totalPaidValue) },
              { label: "Earning Points", value: earningPoints.toLocaleString("en-MY"), note: "Derived from payment history" },
              { label: "Wallet Balance", value: detail.walletBalance },
              { label: "Balance with Points", value: formatCurrencyValue(balanceWithPointsValue) },
            ]}
          />

          <TableShell title="Payment History">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Payment ID</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaymentRows.length ? (
                  filteredPaymentRows.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-50">
                      <td className="py-3 font-semibold text-slate-700">{payment.id}</td>
                      <td className="py-3 text-slate-700">{payment.method}</td>
                      <td className="py-3 text-slate-700">{payment.amount}</td>
                      <td className="py-3"><MiniStatus status={payment.status} /></td>
                      <td className="py-3 text-slate-500">{payment.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                      No payments found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </div>
      ) : null}

      {activeTab === "Reviews" ? (
        <div className="space-y-4">
          <SurfaceCard title="Reviews">
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Filter"
                value={reviewDateFilter}
                onChange={(value) => setReviewDateFilter(value as DateFilterKey)}
                options={[
                  { value: "all", label: "All time" },
                  { value: "date", label: "Today" },
                  { value: "week", label: "This week" },
                  { value: "month", label: "This month" },
                  { value: "year", label: "This year" },
                ]}
              />
              <FilterSelect
                label="Sort"
                value={reviewSort}
                onChange={(value) => setReviewSort(value as SortKey)}
                options={[
                  { value: "recent", label: "Recent" },
                  { value: "a-z", label: "A-Z" },
                ]}
              />
            </div>
          </SurfaceCard>

          <SummaryStrip items={[{ label: "Given Reviews", value: String(filteredReviewRows.length) }]} />

          <TableShell title="Given Reviews">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Provider</th>
                  <th className="pb-3 font-semibold">Rating</th>
                  <th className="pb-3 font-semibold">Review</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviewRows.length ? (
                  filteredReviewRows.map((review) => (
                    <tr key={review.id} className="border-b border-slate-50">
                      <td className="py-3 text-slate-700">{review.provider}</td>
                      <td className="py-3 text-slate-700">{review.rating}/5</td>
                      <td className="py-3 text-slate-700">{review.review}</td>
                      <td className="py-3 text-slate-500">{review.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                      No reviews found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </div>
      ) : null}

      {activeTab === "Activity Log" ? (
        <SurfaceCard title="Full Activity Log">
          <div className="space-y-5">
            {detail.timeline.map((item) => (
              <TimelineItem
                key={item.id}
                title={item.title}
                note={item.note}
                time={item.time}
                tone={item.tone}
                icon={<CheckCircle2 className="size-4" />}
              />
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === "Documents & Verification" ? (
        <SurfaceCard title="Documents & Verification">
          <div className="space-y-3">
            {verificationDocuments.map((document) => (
              <div key={document.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{document.label}</p>
                  <p className="mt-1 text-[13px] text-slate-500">Updated {document.updated}</p>
                </div>
                <MiniStatus status={document.status} />
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === "Reports" ? (
        <div className="space-y-4">
          <SurfaceCard title="Reports">
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Filter"
                value={reportDateFilter}
                onChange={(value) => setReportDateFilter(value as DateFilterKey)}
                options={[
                  { value: "all", label: "All time" },
                  { value: "date", label: "Today" },
                  { value: "week", label: "This week" },
                  { value: "month", label: "This month" },
                  { value: "year", label: "This year" },
                ]}
              />
              <FilterSelect
                label="Sort"
                value={reportSort}
                onChange={(value) => setReportSort(value as SortKey)}
                options={[
                  { value: "recent", label: "Recent" },
                  { value: "a-z", label: "A-Z" },
                ]}
              />
            </div>
          </SurfaceCard>

          <TableShell title="Recent Reports Given">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Report ID</th>
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportRows.length ? (
                  filteredReportRows.map((report) => (
                    <tr key={report.id} className="border-b border-slate-50">
                      <td className="py-3 font-semibold text-slate-700">{report.id}</td>
                      <td className="py-3 text-slate-700">{report.title}</td>
                      <td className="py-3 text-slate-500">{report.submitted}</td>
                      <td className="py-3"><MiniStatus status={report.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                      No reports submitted for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </div>
      ) : null}

      {activeTab === "Service Areas" ? (
        <SurfaceCard title="Service Areas">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Primary Area</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{detail.city || "Malaysia"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Radius</p>
              <p className="mt-2 text-base font-semibold text-slate-900">Not captured</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Current Live Location</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{detail.city || "Not captured"}</p>
            </div>
            {detail.addresses.map((address) => (
              <div key={address.id} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{address.label}</p>
                    <p className="mt-1 text-[13px] text-slate-500">{address.line1}</p>
                    <p className="text-[13px] text-slate-500">{address.line2}</p>
                  </div>
                  {address.tag ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      {address.tag}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
