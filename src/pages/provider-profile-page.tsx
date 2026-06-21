import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileBadge2,
  FileText,
  KeyRound,
  Languages,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  TimerReset,
  Trash2,
  UserCircle2,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InfoRow, MetricTile, MiniStatus, PillBadge, SurfaceCard, TableShell } from "../components/user-detail-ui";
import { providerDetailRecords } from "../data/provider-detail-mocks";
import {
  approveProviderVerification,
  getProviderReportsWithFallback,
  getProviderProfileWithFallback,
  type ProviderReportRowItem,
  providerDocumentRequestOptions,
  requestProviderVerificationDocuments,
  setProviderVisibility,
  updateProviderProfile,
} from "../lib/admin-providers";
import type { ProviderDetailRecord } from "../types";

const tabs = [
  "Overview",
  "Tasks",
  "Payments & Withdrawals",
  "Reviews",
  "Reports",
  "Documents & Verification",
  "Service Areas",
  "Activity Log",
] as const;

type TabKey = (typeof tabs)[number];

const metricIcons = [
  <BriefcaseBusiness className="size-5" />,
  <CheckCircle2 className="size-5" />,
  <CalendarCheck2 className="size-5" />,
  <Clock3 className="size-5" />,
  <MapPin className="size-5" />,
  <Wallet className="size-5" />,
  <FileText className="size-5" />,
  <Star className="size-5" />,
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

function avatarGradient(name: string) {
  const palette = [
    "from-[#dcecdf] via-[#f2f7f3] to-white",
    "from-[#d8e8f7] via-[#eef6ff] to-white",
    "from-[#efe7d8] via-[#faf5ea] to-white",
  ];
  return palette[name.length % palette.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function isRenderableImageUrl(value: string | undefined) {
  if (!value?.trim()) {
    return false;
  }

  return /^(https?:\/\/|data:image\/|blob:)/i.test(value.trim());
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

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function renderSimpleRows(title: string, headers: string[], rows: string[][]) {
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

type DateFilterKey = "all" | "date" | "week" | "month" | "year";
type SortKey = "recent" | "a-z";
type TaskStatusKey = "all" | "completed" | "pending" | "cancelled";

function parseDisplayDate(value: string) {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value
    .replace("Recently active", "")
    .replace("Recently", "")
    .trim();

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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

export function ProviderProfilePage() {
  const { providerId = "" } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const [message, setMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderDetailRecord | null>(
    providerDetailRecords[providerId] ?? providerDetailRecords["PRV-2034"] ?? null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [verificationNote, setVerificationNote] = useState(provider?.verificationNote ?? "");
  const [selectedDocumentRequests, setSelectedDocumentRequests] = useState<string[]>(
    provider?.requestedDocuments ?? []
  );
  const [providerReports, setProviderReports] = useState<ProviderReportRowItem[]>([]);
  const [taskDateFilter, setTaskDateFilter] = useState<DateFilterKey>("all");
  const [taskSort, setTaskSort] = useState<SortKey>("recent");
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatusKey>("all");
  const [paymentDateFilter, setPaymentDateFilter] = useState<DateFilterKey>("all");
  const [paymentSort, setPaymentSort] = useState<SortKey>("recent");
  const [reviewDateFilter, setReviewDateFilter] = useState<DateFilterKey>("all");
  const [reviewSort, setReviewSort] = useState<SortKey>("recent");
  const [reportDateFilter, setReportDateFilter] = useState<DateFilterKey>("all");
  const [reportSort, setReportSort] = useState<SortKey>("recent");
  const [form, setForm] = useState({
    name: provider?.name ?? "",
    email: provider?.email ?? "",
    phone: provider?.phone ?? "",
    dob: normalizeEditableDate(provider?.dob ?? ""),
    gender: provider?.gender === "Not provided" ? "" : (provider?.gender ?? ""),
    serviceArea: provider?.serviceArea ?? "",
    address: provider?.address === "Not provided" ? "" : (provider?.address ?? ""),
    about: provider?.about ?? "",
  });

  useEffect(() => {
    let active = true;

    setActiveTab("Overview");
    setMessage(null);
    setLoading(true);
    setProviderReports([]);

    async function loadProvider() {
      const fallback = providerDetailRecords[providerId] ?? providerDetailRecords["PRV-2034"] ?? null;

      if (active) {
        setProvider(fallback);
      }

      const [payload, reports] = await Promise.all([
        getProviderProfileWithFallback(providerId),
        getProviderReportsWithFallback(providerId),
      ]);

      if (!active) {
        return;
      }

      setProvider(payload.detail);
      setVerificationNote(payload.detail?.verificationNote ?? "");
      setSelectedDocumentRequests(payload.detail?.requestedDocuments ?? []);
      setForm({
        name: payload.detail?.name ?? "",
        email: payload.detail?.email ?? "",
        phone: payload.detail?.phone ?? "",
        dob: normalizeEditableDate(payload.detail?.dob ?? ""),
        gender: payload.detail?.gender === "Not provided" ? "" : (payload.detail?.gender ?? ""),
        serviceArea: payload.detail?.serviceArea ?? "",
        address: payload.detail?.address === "Not provided" ? "" : (payload.detail?.address ?? ""),
        about: payload.detail?.about ?? "",
      });
      setProviderReports(reports);
      setLoading(false);
    }

    void loadProvider();

    return () => {
      active = false;
    };
  }, [providerId]);

  function flash(nextMessage: string) {
    setMessage(nextMessage);
  }

  function toggleRequestedDocument(document: string) {
    setSelectedDocumentRequests((current) =>
      current.includes(document)
        ? current.filter((item) => item !== document)
        : [...current, document]
    );
  }

  if (loading && !provider) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      </div>
    );
  }

  if (!provider) {
    return (
      <SurfaceCard title="Provider Details">
        <p className="text-sm text-slate-500">Provider record was not found.</p>
      </SurfaceCard>
    );
  }

  const detail = provider;
  const providerHeroImage =
    [...(detail.serviceImageFiles ?? []), ...(detail.certificateImageFiles ?? [])].find((value) =>
      isRenderableImageUrl(value)
    ) ?? null;
  const allTaskRows = useMemo(
    () =>
      [
        ...detail.completedTaskRows.map((task) => ({
          id: task.id,
          service: task.service,
          customer: task.customer,
          date: task.date,
          amount: task.amount,
          status: task.status,
          reason: "-",
          sortLabel: task.customer,
          sortDate: task.date,
          type: "completed" as const,
        })),
        ...detail.upcomingTaskRows.map((task) => ({
          id: task.id,
          service: task.service,
          customer: task.customer,
          date: task.schedule,
          amount: task.amount,
          status: task.status,
          reason: "-",
          sortLabel: task.customer,
          sortDate: task.schedule,
          type: "pending" as const,
        })),
        ...(detail.cancelledTaskRows ?? []).map((task) => ({
          id: task.id,
          service: task.service,
          customer: task.customer,
          date: task.schedule,
          amount: task.amount,
          status: task.status,
          reason: task.reason,
          sortLabel: task.customer,
          sortDate: task.schedule,
          type: "cancelled" as const,
        })),
      ],
    [detail.completedTaskRows, detail.upcomingTaskRows, detail.cancelledTaskRows]
  );

  const filteredTaskRows = useMemo(() => {
    const statusFiltered = allTaskRows.filter((task) =>
      taskStatusFilter === "all" ? true : task.type === taskStatusFilter
    );
    const dateFiltered = statusFiltered.filter((task) => matchesDateFilter(task.sortDate, taskDateFilter));
    return sortByRecentOrAz(dateFiltered, taskSort);
  }, [allTaskRows, taskDateFilter, taskSort, taskStatusFilter]);

  const paymentRows = useMemo(
    () =>
      detail.payoutRows.map((row) => ({
        ...row,
        numericAmount: parseCurrencyValue(row.amount),
        sortLabel: row.type,
        sortDate: row.date,
      })),
    [detail.payoutRows]
  );

  const filteredPaymentRows = useMemo(() => {
    const dateFiltered = paymentRows.filter((row) => matchesDateFilter(row.date, paymentDateFilter));
    return sortByRecentOrAz(dateFiltered, paymentSort);
  }, [paymentRows, paymentDateFilter, paymentSort]);

  const totalEarningsValue = filteredPaymentRows.reduce((sum, row) => sum + row.numericAmount, 0);
  const commissionValue = totalEarningsValue * 0.2;
  const afterCommissionValue = totalEarningsValue - commissionValue;

  const reviewRows = useMemo(
    () =>
      (detail.recentReviews ?? []).map((review) => ({
        ...review,
        sortLabel: review.provider,
        sortDate: review.date,
      })),
    [detail.recentReviews]
  );

  const filteredReviewRows = useMemo(() => {
    const dateFiltered = reviewRows.filter((review) => matchesDateFilter(review.date, reviewDateFilter));
    return sortByRecentOrAz(dateFiltered, reviewSort);
  }, [reviewRows, reviewDateFilter, reviewSort]);

  const fiveStarCount = filteredReviewRows.filter((review) => review.rating === 5).length;

  const filteredReportRows = useMemo(() => {
    const rows = providerReports
      .filter((report) => matchesDateFilter(report.date, reportDateFilter))
      .map((report) => ({
        ...report,
        sortLabel: report.title,
        sortDate: report.date,
      }));
    return sortByRecentOrAz(rows, reportSort);
  }, [providerReports, reportDateFilter, reportSort]);

  const verificationDocuments = useMemo(
    () => [
      { id: "verify-email", label: "Email Verification", status: detail.emailVerified ? "Verified" : "Pending", fileName: undefined },
      { id: "verify-phone", label: "Phone Verification", status: detail.phoneVerified ? "Verified" : "Pending", fileName: undefined },
      {
        id: "verify-ic-front",
        label: "IC Front",
        status: detail.documents.find((item) => item.label === "Identity Verification")?.status ?? "Pending",
        fileName: detail.documents.find((item) => item.label === "Identity Verification")?.fileName,
      },
      {
        id: "verify-ic-back",
        label: "IC Back",
        status: detail.documents.find((item) => item.label === "Back of Document")?.status ?? "Pending",
        fileName: detail.documents.find((item) => item.label === "Back of Document")?.fileName,
      },
      {
        id: "verify-license",
        label: "Driving License",
        status: detail.requestedDocuments.includes("IC / Passport / Driving License") ? "Requested" : "Pending",
        fileName: undefined,
      },
      {
        id: "verify-resume",
        label: "Resume",
        status: "Pending",
        fileName: undefined,
      },
      {
        id: "verify-certificates",
        label: "Certificates",
        status: (detail.certificateImageFiles ?? []).length ? "Uploaded" : "Pending",
        fileName: (detail.certificateImageFiles ?? []).join(", ") || undefined,
      },
    ],
    [detail]
  );

  async function handleSaveProfile() {
    if (saving) {
      return;
    }

    setSaving(true);
    const result = await updateProviderProfile(detail.providerId, {
      full_name: form.name,
      email: form.email,
      phone: form.phone,
      marketing_name: form.name,
      service_location: form.serviceArea,
      date_of_birth: form.dob,
      sex: form.gender,
      residential_address: form.address,
      bio: form.about,
    });
    setSaving(false);

    if (result.error) {
      flash(result.error);
      return;
    }

    setProvider((current) =>
      current
        ? {
            ...current,
            name: form.name,
            email: form.email,
            phone: form.phone,
            dob: form.dob || "Not provided",
            gender: form.gender || "Not provided",
            serviceArea: form.serviceArea,
            address: form.address || "Not provided",
            about: form.about,
          }
        : current
    );
    setEditing(false);
    flash("Provider details updated.");
  }

  async function refreshProvider() {
    const payload = await getProviderProfileWithFallback(detail.providerId);
    setProvider(payload.detail);
    setVerificationNote(payload.detail?.verificationNote ?? "");
    setSelectedDocumentRequests(payload.detail?.requestedDocuments ?? []);
  }

  async function handleDeactivate() {
    if (saving) {
      return;
    }

    const confirmed = window.confirm("Deactivate this provider?");
    if (!confirmed) {
      return;
    }

    setSaving(true);
    const result = await setProviderVisibility(detail.providerId, false);
    setSaving(false);

    if (result.error) {
      flash(result.error);
      return;
    }

    setProvider((current) => (current ? { ...current, status: "Paused" } : current));
    flash("Provider deactivated.");
    window.setTimeout(() => {
      navigate("/service-providers");
    }, 500);
  }

  async function handleRequestDocuments() {
    if (saving) {
      return;
    }

    if (selectedDocumentRequests.length === 0) {
      flash("Select at least one document to request.");
      return;
    }

    setSaving(true);
    const result = await requestProviderVerificationDocuments(
      detail.providerId,
      selectedDocumentRequests,
      verificationNote,
    );
    setSaving(false);

    if (result.error) {
      flash(result.error);
      return;
    }

    await refreshProvider();
    flash("Verification request sent. Admin panel marked this provider for document review.");
  }

  async function handleApproveVerification() {
    if (saving) {
      return;
    }

    setSaving(true);
    const result = await approveProviderVerification(detail.providerId, verificationNote);
    setSaving(false);

    if (result.error) {
      flash(result.error);
      return;
    }

    await refreshProvider();
    flash("Provider verification approved.");
  }

  function renderOverview() {
    return (
      <>
        <section className="mx-auto flex max-w-5xl flex-col gap-5">
          <SurfaceCard
            title="Personal Details"
            className="w-full px-5 py-5 sm:px-6"
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
            <div className="grid gap-x-8 gap-y-4 xl:grid-cols-2">
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
                icon={<ShieldCheck className="size-4" />}
              />
              <InfoRow label="Service Radius" value={detail.serviceRadiusKm || "Not set"} icon={<MapPin className="size-4" />} />
              <InfoRow label="Current Coordinates" value={detail.currentCoordinates || "Not captured"} icon={<MapPin className="size-4" />} />
              <InfoRow label="Experience" value={detail.yearsExperience || "Not set"} icon={<BriefcaseBusiness className="size-4" />} />
              <InfoRow label="Hourly Rate" value={detail.hourlyRate || "Not set"} icon={<Wallet className="size-4" />} />
              <InfoRow label="Daily Rate" value={detail.dailyRate || "Not set"} icon={<Wallet className="size-4" />} />
              <InfoRow label="Language" value={detail.language} icon={<Languages className="size-4" />} />
              <InfoRow label="NRIC / ID Number" value={detail.nationalId} icon={<FileBadge2 className="size-4" />} />
              <InfoRow label="Emergency Contact" value={detail.emergencyContact} icon={<Phone className="size-4" />} />
              <InfoRow
                label="Address"
                value={
                  editing ? (
                    <textarea
                      value={form.address}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                      className="min-h-[96px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                  ) : (
                    <span className="whitespace-pre-line">{detail.address}</span>
                  )
                }
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
            title="Service Areas"
            className="w-full max-w-4xl px-5 py-5 sm:px-6"
            action={
              <button className="rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Edit
              </button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {detail.serviceAreas.map((area) => (
                <div key={area.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <MapPin className="size-4 text-slate-400" />
                    <span>{area.label}</span>
                  </div>
                  {area.tag ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      {area.tag}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Quick Summary" className="w-full max-w-4xl px-5 py-5 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryMetric label="Average Rating" value={detail.averageRating} />
              <SummaryMetric label="Total Reviews" value={detail.totalReviews} />
              <SummaryMetric label="On-time Rate" value={detail.onTimeRate} />
              <SummaryMetric label="Repeat Customers" value={detail.repeatCustomers} />
              <SummaryMetric label="Visibility" value={detail.visibilityStatus || "Visible"} />
              <SummaryMetric label="Radius" value={detail.serviceRadiusKm || "Not set"} />
              <SummaryMetric label="Working Days" value={detail.workingDays} />
              <SummaryMetric label="Working Hours" value={detail.workingHours} />
            </div>
          </SurfaceCard>

          <SurfaceCard title="Provider Status" className="w-full max-w-4xl px-5 py-5 sm:px-6">
            <div className="grid gap-x-8 gap-y-4 text-sm md:grid-cols-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Account Status</span>
                <MiniStatus status={detail.status} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Approval Status</span>
                <MiniStatus status={detail.approvalStatus} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Marketplace Visibility</span>
                <span className="font-medium text-slate-900">{detail.visibilityStatus || "Visible"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Background Check</span>
                <MiniStatus status={detail.backgroundCheck} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">KYC Status</span>
                <MiniStatus status={detail.kycStatus} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Member Since</span>
                <span className="font-medium text-slate-900">{detail.memberSince}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Last Login</span>
                <span className="font-medium text-slate-900">{detail.lastLogin}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Device</span>
                <span className="font-medium text-slate-900">{detail.device}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Completed Jobs</span>
                <span className="font-medium text-slate-900">{detail.completedJobs}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Cancellation Rate</span>
                <span className="font-medium text-slate-900">{detail.cancellationRate}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Response Rate</span>
                <span className="font-medium text-slate-900">{detail.responseRate}</span>
              </div>
              <div className="border-t border-slate-100 pt-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Verification Review
                </p>
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    {providerDocumentRequestOptions.map((document) => (
                      <label key={document} className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedDocumentRequests.includes(document)}
                          onChange={() => toggleRequestedDocument(document)}
                          className="size-4 rounded border-slate-300 text-emerald-600"
                        />
                        <span>{document}</span>
                      </label>
                    ))}
                  </div>
                  <textarea
                    value={verificationNote}
                    onChange={(event) => setVerificationNote(event.target.value)}
                    placeholder="Add admin note for the provider"
                    className="min-h-[96px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleRequestDocuments}
                      disabled={saving}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Request IC / Documents"}
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveVerification}
                      disabled={saving}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Approve Verification"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="About Provider" className="w-full px-5 py-5 sm:px-6">
            {editing ? (
              <textarea
                value={form.about}
                onChange={(event) => setForm((current) => ({ ...current, about: event.target.value }))}
                className="min-h-[132px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
            ) : (
              <p className="text-sm leading-7 text-slate-600">{detail.about}</p>
            )}

            <div className="mt-8">
              <h4 className="text-base font-bold text-slate-950">Skills & Services</h4>
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600"
                  >
                    {skill.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-bold text-slate-950">Documents</h4>
                <button className="text-xs font-semibold text-emerald-700">View all</button>
              </div>
              <div className="mt-4 space-y-3">
                {detail.documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3 text-slate-700">
                      <FileText className="size-4 text-slate-400" />
                      <div>
                        <div>{document.label}</div>
                        {document.fileName ? (
                          <div className="text-xs text-slate-400">{document.fileName}</div>
                        ) : null}
                      </div>
                    </div>
                    <MiniStatus status={document.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-bold text-slate-950">Specialties</h4>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(detail.specialties ?? []).length ? (
                  (detail.specialties ?? []).map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700"
                    >
                      {specialty}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No specialties added yet.</p>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-bold text-slate-950">Service Image Captions</h4>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(detail.serviceImageCaptions ?? []).length ? (
                  (detail.serviceImageCaptions ?? []).map((caption) => (
                    <span
                      key={caption}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                    >
                      {caption}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No live service image captions saved yet.</p>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {(detail.serviceImageFiles ?? []).length ? (
                  (detail.serviceImageFiles ?? []).map((fileName) => (
                    <div key={fileName} className="text-xs font-medium text-slate-500">
                      {fileName}
                    </div>
                  ))
                ) : null}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-bold text-slate-950">Certificate Captions</h4>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(detail.certificateImageCaptions ?? []).length ? (
                  (detail.certificateImageCaptions ?? []).map((caption) => (
                    <span
                      key={caption}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                    >
                      {caption}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No live certificate captions saved yet.</p>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {(detail.certificateImageFiles ?? []).length ? (
                  (detail.certificateImageFiles ?? []).map((fileName) => (
                    <div key={fileName} className="text-xs font-medium text-slate-500">
                      {fileName}
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          </SurfaceCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <SurfaceCard title="Availability">
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryMetric label="Working Days" value={detail.workingDays} />
              <SummaryMetric label="Working Hours" value={detail.workingHours} />
              <SummaryMetric label="Availability Preset" value={detail.availabilityPreset || "Not set"} />
              <SummaryMetric label="Coordinates" value={detail.currentCoordinates || "Not captured"} />
            </div>
          </SurfaceCard>

          <SurfaceCard title="Recent Actions">
            <div className="space-y-3">
              {detail.recentActions.map((action) => (
                <div key={action.id} className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <TimerReset className="size-4 text-slate-400" />
                    <span>{action.label}</span>
                  </div>
                  <span className="text-[12px] text-slate-400">{action.time}</span>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Activity Log">
            <div className="space-y-4">
              {detail.activityLog.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-[13px] text-slate-500">{item.note}</p>
                  <p className="mt-2 text-[12px] text-slate-400">{item.time}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </section>

      </>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-[#E7ECE7] bg-white px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative shrink-0">
              <div
                className={`grid size-[88px] overflow-hidden rounded-[26px] bg-gradient-to-br ${avatarGradient(detail.name)} shadow-inner ring-4 ring-slate-50`}
              >
                {providerHeroImage ? (
                  <img
                    src={providerHeroImage}
                    alt={detail.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid place-items-center">
                    <div className="grid size-[68px] place-items-center rounded-[22px] bg-white/75 backdrop-blur">
                      <span className="font-display text-[1.7rem] font-extrabold text-slate-700">
                        {initials(detail.name)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <span className="absolute bottom-1.5 right-1.5 size-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[1.65rem] font-extrabold tracking-tight text-slate-950">
                  {detail.name}
                </h1>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {detail.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Provider ID: {detail.providerId}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <PillBadge tone={detail.emailVerified ? "emerald" : "slate"}>
                  <BadgeCheck className="size-3.5" /> {detail.emailVerified ? "Email Verified" : "Email Pending"}
                </PillBadge>
                <PillBadge tone={detail.phoneVerified ? "emerald" : "slate"}>
                  <Phone className="size-3.5" /> {detail.phoneVerified ? "Phone Verified" : "Phone Pending"}
                </PillBadge>
                <PillBadge tone={detail.identityVerified ? "emerald" : "slate"}>
                  <ShieldCheck className="size-3.5" /> {detail.identityVerified ? "KYC Verified" : "KYC Pending"}
                </PillBadge>
                <PillBadge tone="blue">{detail.roleBadge}</PillBadge>
              </div>

              <div className="mt-4 grid gap-x-5 gap-y-3 text-sm text-slate-500 sm:grid-cols-2 xl:grid-cols-5">
                <div className="flex items-start gap-2.5">
                  <CalendarDays className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Joined</p>
                    <p className="mt-0.5 font-medium text-slate-900">{detail.joinedAt}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock3 className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Last Login</p>
                    <p className="mt-0.5 font-medium text-slate-900">{detail.lastLogin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <BriefcaseBusiness className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Service Type</p>
                    <p className="mt-0.5 font-medium text-slate-900">{detail.serviceType}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Service Area</p>
                    <p className="mt-0.5 font-medium text-slate-900">{detail.serviceArea}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Star className="mt-0.5 size-4 text-amber-400" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Rating</p>
                    <p className="mt-0.5 font-medium text-slate-900">{detail.rating} {detail.ratingNote}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:shrink-0">
            <button
              type="button"
              onClick={() => flash("Password reset link sent.")}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700"
            >
              <KeyRound className="size-4" />
              Reset Password
            </button>
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600"
            >
              <Trash2 className="size-4" />
              Deactivate
            </button>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-8">
        {detail.metrics.map((metric, index) => (
          <MetricTile
            key={metric.id}
            icon={metricIcons[index] ?? <BriefcaseBusiness className="size-5" />}
            label={metric.label}
            value={metric.value}
            note={metric.note}
            accent={(metricAccents[metric.tone] ?? metricAccents.slate) as string}
            action={metric.label === "Total Tasks" ? "View all tasks" : undefined}
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
                onChange={(value) => setTaskStatusFilter(value as TaskStatusKey)}
                options={[
                  { value: "all", label: "All" },
                  { value: "completed", label: "Completed" },
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
              { label: "All Tasks", value: String(allTaskRows.length) },
              { label: "Completed", value: String(allTaskRows.filter((row) => row.type === "completed").length) },
              { label: "Pending", value: String(allTaskRows.filter((row) => row.type === "pending").length) },
              { label: "Cancelled", value: String(allTaskRows.filter((row) => row.type === "cancelled").length) },
            ]}
          />

          <TableShell title="Task History">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Task ID</th>
                  <th className="pb-3 font-semibold">Service</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Cancel Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredTaskRows.length ? (
                  filteredTaskRows.map((task) => (
                    <tr key={`${task.type}-${task.id}`} className="border-b border-slate-50">
                      <td className="py-3 font-semibold text-emerald-700">{task.id}</td>
                      <td className="py-3 text-slate-700">{task.service}</td>
                      <td className="py-3 text-slate-700">{task.customer}</td>
                      <td className="py-3 text-slate-500">{task.date}</td>
                      <td className="py-3 text-slate-700">{task.amount}</td>
                      <td className="py-3"><MiniStatus status={task.status} /></td>
                      <td className="py-3 text-slate-600">{task.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-sm text-slate-500">
                      No tasks found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </div>
      ) : null}
      {activeTab === "Payments & Withdrawals" ? (
        <div className="space-y-4">
          <SurfaceCard title="Payments & Withdrawals">
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
              { label: "Total Earning", value: formatCurrencyValue(totalEarningsValue) },
              { label: "Commission Deductions", value: formatCurrencyValue(commissionValue), note: "20% platform commission" },
              { label: "After Commission", value: formatCurrencyValue(afterCommissionValue) },
            ]}
          />

          <TableShell title="Payment Records">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaymentRows.length ? (
                  filteredPaymentRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50">
                      <td className="py-3 font-semibold text-slate-700">{row.id}</td>
                      <td className="py-3 text-slate-700">{row.type}</td>
                      <td className="py-3 text-slate-700">{row.amount}</td>
                      <td className="py-3 text-slate-500">{row.date}</td>
                      <td className="py-3"><MiniStatus status={row.status} /></td>
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

          <SummaryStrip
            items={[
              { label: "5 Star", value: String(fiveStarCount) },
              { label: "All Review", value: String(filteredReviewRows.length) },
              { label: "Average Rating", value: detail.averageRating || "0.0" },
            ]}
          />

          <TableShell title="Review History">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Customer</th>
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

          <TableShell title="Recent Reports">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Report ID</th>
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Reporter</th>
                  <th className="pb-3 font-semibold">Priority</th>
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
                      <td className="py-3 text-slate-700">{report.reporter}</td>
                      <td className="py-3 text-slate-700">{report.priority}</td>
                      <td className="py-3 text-slate-500">{report.date}</td>
                      <td className="py-3"><MiniStatus status={report.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                      No reports found for this provider.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </div>
      ) : null}
      {activeTab === "Documents & Verification" ? (
        <SurfaceCard title="Documents & Verification">
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              <InfoRow label="Provider Name" value={detail.name} icon={<UserCircle2 className="size-4" />} />
              <InfoRow label="Service Type" value={detail.serviceType} icon={<BriefcaseBusiness className="size-4" />} />
              <InfoRow label="Service Radius" value={detail.serviceRadiusKm || "Not set"} icon={<MapPin className="size-4" />} />
              <InfoRow label="Current Coordinates" value={detail.currentCoordinates || "Not captured"} icon={<MapPin className="size-4" />} />
              <InfoRow label="Experience" value={detail.yearsExperience || "Not set"} icon={<BriefcaseBusiness className="size-4" />} />
              <InfoRow label="Hourly Rate" value={detail.hourlyRate || "Not set"} icon={<Wallet className="size-4" />} />
              <InfoRow label="Daily Rate" value={detail.dailyRate || "Not set"} icon={<Wallet className="size-4" />} />
              <InfoRow label="Email" value={detail.email} icon={<Mail className="size-4" />} />
              <InfoRow label="Phone" value={detail.phone} icon={<Phone className="size-4" />} />
            </div>
            <div className="space-y-3">
              {verificationDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <FileText className="size-4 text-slate-400" />
                    <div>
                      <div>{document.label}</div>
                      {"fileName" in document && document.fileName ? <div className="text-xs text-slate-400">{document.fileName}</div> : null}
                    </div>
                  </div>
                  <MiniStatus status={document.status} />
                </div>
              ))}
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">Service Image Captions</p>
                <p className="mt-2 text-[13px] text-slate-600">
                  {(detail.serviceImageCaptions ?? []).length
                    ? (detail.serviceImageCaptions ?? []).join(", ")
                    : "No live service image captions saved yet."}
                </p>
                {(detail.serviceImageFiles ?? []).length ? (
                  <p className="mt-2 text-[12px] text-slate-500">{(detail.serviceImageFiles ?? []).join(", ")}</p>
                ) : null}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">Certificate Captions</p>
                <p className="mt-2 text-[13px] text-slate-600">
                  {(detail.certificateImageCaptions ?? []).length
                    ? (detail.certificateImageCaptions ?? []).join(", ")
                    : "No live certificate captions saved yet."}
                </p>
                {(detail.certificateImageFiles ?? []).length ? (
                  <p className="mt-2 text-[12px] text-slate-500">{(detail.certificateImageFiles ?? []).join(", ")}</p>
                ) : null}
              </div>
            </div>
          </div>
        </SurfaceCard>
      ) : null}
      {activeTab === "Service Areas" ? (
        <SurfaceCard title="Service Areas">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Service Radius</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{detail.serviceRadiusKm || "Not set"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Current Live Location</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{detail.currentCoordinates || "Not captured"}</p>
            </div>
            {detail.serviceAreas.map((area) => (
              <div key={area.id} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4 text-slate-400" />
                    {area.label}
                  </span>
                  {area.tag ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      {area.tag}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}
      {activeTab === "Activity Log" ? (
        <SurfaceCard title="Activity Log">
          <div className="space-y-4">
            {detail.activityLog.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-[13px] text-slate-500">{item.note}</p>
                <p className="mt-2 text-[12px] text-slate-400">{item.time}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
