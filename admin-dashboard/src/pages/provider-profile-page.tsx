import {
  BadgeCheck,
  Ban,
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
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { InfoRow, MetricTile, MiniStatus, PillBadge, ReviewStars, SurfaceCard, TableShell } from "../components/user-detail-ui";
import { providerDetailRecords } from "../data/provider-detail-mocks";
import type { ProviderDetailRecord } from "../types";

const tabs = [
  "Overview",
  "Tasks",
  "Payments & Withdrawals",
  "Reviews",
  "Profile & Documents",
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

export function ProviderProfilePage() {
  const { providerId = "" } = useParams();
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const [message, setMessage] = useState<string | null>(null);
  const record = providerDetailRecords[providerId] ?? providerDetailRecords["PRV-2034"]!;

  const provider = useMemo<ProviderDetailRecord>(() => record, [record]);

  function flash(nextMessage: string) {
    setMessage(nextMessage);
  }

  function renderOverview() {
    return (
      <>
        <section className="grid gap-4 xl:grid-cols-[1.03fr_0.95fr_0.78fr_1fr]">
          <SurfaceCard
            title="Personal Details"
            action={
              <button className="rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Edit
              </button>
            }
          >
            <div className="space-y-4">
              <InfoRow label="Full Name" value={provider.name} icon={<UserCircle2 className="size-4" />} />
              <InfoRow label="Email Address" value={provider.email} icon={<Mail className="size-4" />} />
              <InfoRow label="Phone Number" value={provider.phone} icon={<Phone className="size-4" />} />
              <InfoRow label="Date of Birth" value={provider.dob} icon={<CalendarDays className="size-4" />} />
              <InfoRow label="Gender" value={provider.gender} icon={<ShieldCheck className="size-4" />} />
              <InfoRow label="Language" value={provider.language} icon={<Languages className="size-4" />} />
              <InfoRow label="NRIC / ID Number" value={provider.nationalId} icon={<FileBadge2 className="size-4" />} />
              <InfoRow label="Emergency Contact" value={provider.emergencyContact} icon={<Phone className="size-4" />} />
              <InfoRow label="Address" value={<span className="whitespace-pre-line">{provider.address}</span>} icon={<MapPin className="size-4" />} />
            </div>
          </SurfaceCard>

          <div className="space-y-4">
            <SurfaceCard
              title="Service Areas"
              action={
                <button className="rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Edit
                </button>
              }
            >
              <div className="space-y-4">
                {provider.serviceAreas.map((area) => (
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

            <SurfaceCard title="Quick Summary">
              <div className="grid gap-4 sm:grid-cols-2">
                <SummaryMetric label="Average Rating" value={provider.averageRating} />
                <SummaryMetric label="Total Reviews" value={provider.totalReviews} />
                <SummaryMetric label="On-time Rate" value={provider.onTimeRate} />
                <SummaryMetric label="Repeat Customers" value={provider.repeatCustomers} />
              </div>
            </SurfaceCard>
          </div>

          <div className="space-y-4">
            <SurfaceCard title="Provider Status" className="h-full">
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Account Status</span>
                  <MiniStatus status={provider.status} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Approval Status</span>
                  <MiniStatus status={provider.approvalStatus} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Background Check</span>
                  <MiniStatus status={provider.backgroundCheck} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">KYC Status</span>
                  <MiniStatus status={provider.kycStatus} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Member Since</span>
                  <span className="font-medium text-slate-900">{provider.memberSince}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Last Login</span>
                  <span className="font-medium text-slate-900">{provider.lastLogin}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Device</span>
                  <span className="font-medium text-slate-900">{provider.device}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Completed Jobs</span>
                  <span className="font-medium text-slate-900">{provider.completedJobs}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Cancellation Rate</span>
                  <span className="font-medium text-slate-900">{provider.cancellationRate}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Response Rate</span>
                  <span className="font-medium text-slate-900">{provider.responseRate}</span>
                </div>
              </div>
            </SurfaceCard>
          </div>

          <div className="space-y-4">
            <SurfaceCard title="About Provider">
              <p className="text-sm leading-7 text-slate-600">{provider.about}</p>

              <div className="mt-8">
                <h4 className="text-base font-bold text-slate-950">Skills & Services</h4>
                <div className="mt-4 flex flex-wrap gap-2">
                  {provider.skills.map((skill) => (
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
                  {provider.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3 text-slate-700">
                        <FileText className="size-4 text-slate-400" />
                        <span>{document.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="size-4" />
                        <span className="text-xs font-semibold">{document.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SurfaceCard>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <SurfaceCard title="Availability">
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryMetric label="Working Days" value={provider.workingDays} />
              <SummaryMetric label="Working Hours" value={provider.workingHours} />
            </div>
          </SurfaceCard>

          <SurfaceCard title="Recent Actions">
            <div className="space-y-3">
              {provider.recentActions.map((action) => (
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
              {provider.activityLog.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-[13px] text-slate-500">{item.note}</p>
                  <p className="mt-2 text-[12px] text-slate-400">{item.time}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <TableShell title="Completed Tasks" action={<button className="text-xs font-semibold text-emerald-700">View all</button>}>
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Task ID</th>
                  <th className="pb-3 font-semibold">Service</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {provider.completedTaskRows.map((task) => (
                  <tr key={task.id} className="border-b border-slate-50">
                    <td className="py-3 font-semibold text-emerald-700">{task.id}</td>
                    <td className="py-3">{task.service}</td>
                    <td className="py-3">{task.customer}</td>
                    <td className="py-3 text-slate-500">{task.date}</td>
                    <td className="py-3">{task.amount}</td>
                    <td className="py-3"><MiniStatus status={task.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>

          <TableShell title="Upcoming Tasks" action={<button className="text-xs font-semibold text-emerald-700">View all</button>}>
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Task ID</th>
                  <th className="pb-3 font-semibold">Service</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {provider.upcomingTaskRows.map((task) => (
                  <tr key={task.id} className="border-b border-slate-50">
                    <td className="py-3 font-semibold text-emerald-700">{task.id}</td>
                    <td className="py-3">{task.service}</td>
                    <td className="py-3">{task.customer}</td>
                    <td className="py-3 text-slate-500">{task.schedule}</td>
                    <td className="py-3">{task.amount}</td>
                    <td className="py-3"><MiniStatus status={task.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>

          <TableShell title="Payments & Withdrawals" action={<button className="text-xs font-semibold text-emerald-700">View all</button>}>
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
                {provider.payoutRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50">
                    <td className="py-3 font-semibold text-slate-700">{row.id}</td>
                    <td className="py-3">{row.type}</td>
                    <td className="py-3">{row.amount}</td>
                    <td className="py-3 text-slate-500">{row.date}</td>
                    <td className="py-3"><MiniStatus status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </section>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-[#E7ECE7] bg-white px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="relative">
              <div
                className={`grid size-[104px] shrink-0 place-items-center rounded-[30px] bg-gradient-to-br ${avatarGradient(provider.name)} shadow-inner ring-8 ring-slate-50`}
              >
                <div className="grid size-[82px] place-items-center rounded-[26px] bg-white/70 backdrop-blur">
                  <span className="font-display text-[2rem] font-extrabold text-slate-700">
                    {initials(provider.name)}
                  </span>
                </div>
              </div>
              <span className="absolute bottom-2 right-2 size-4 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-[2rem] font-extrabold tracking-tight text-slate-950">
                  {provider.name}
                </h1>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {provider.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Provider ID: {provider.providerId}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <PillBadge tone="emerald"><BadgeCheck className="size-3.5" /> Email Verified</PillBadge>
                <PillBadge tone="emerald"><Phone className="size-3.5" /> Phone Verified</PillBadge>
                <PillBadge tone="emerald"><ShieldCheck className="size-3.5" /> KYC Verified</PillBadge>
                <PillBadge tone="blue">{provider.roleBadge}</PillBadge>
              </div>

              <div className="mt-5 grid gap-4 text-sm text-slate-500 sm:grid-cols-2 xl:grid-cols-5">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Joined</p>
                    <p className="mt-1 font-medium text-slate-900">{provider.joinedAt}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Last Login</p>
                    <p className="mt-1 font-medium text-slate-900">{provider.lastLogin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BriefcaseBusiness className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Service Type</p>
                    <p className="mt-1 font-medium text-slate-900">{provider.serviceType}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Service Area</p>
                    <p className="mt-1 font-medium text-slate-900">{provider.serviceArea}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="mt-0.5 size-4 text-amber-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Rating</p>
                    <p className="mt-1 font-medium text-slate-900">{provider.rating} {provider.ratingNote}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 xl:max-w-[620px] xl:justify-end">
            <button
              type="button"
              onClick={() => flash("Public provider profile opened.")}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700"
            >
              <Eye className="size-4" />
              View Profile
            </button>
            <button
              type="button"
              onClick={() => flash("Provider suspended.")}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 px-5 py-3 text-sm font-semibold text-amber-700"
            >
              <Ban className="size-4" />
              Suspend Provider
            </button>
            <button
              type="button"
              onClick={() => flash("Password reset link sent.")}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 px-5 py-3 text-sm font-semibold text-blue-700"
            >
              <KeyRound className="size-4" />
              Reset Password
            </button>
            <button
              type="button"
              onClick={() => flash("Provider deactivated.")}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600"
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
        {provider.metrics.map((metric, index) => (
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
      {activeTab === "Tasks"
        ? renderSimpleRows(
            "All Tasks",
            ["Task ID", "Service", "Customer", "Date", "Amount", "Status"],
            [...provider.completedTaskRows, ...provider.upcomingTaskRows.map((task) => ({
              id: task.id,
              service: task.service,
              customer: task.customer,
              date: task.schedule,
              amount: task.amount,
              status: task.status,
            }))].map((task) => [task.id, task.service, task.customer, task.date, task.amount, task.status])
          )
        : null}
      {activeTab === "Payments & Withdrawals"
        ? renderSimpleRows(
            "Payments & Withdrawals",
            ["ID", "Type", "Amount", "Date", "Status"],
            provider.payoutRows.map((row) => [row.id, row.type, row.amount, row.date, row.status])
          )
        : null}
      {activeTab === "Reviews"
        ? renderSimpleRows(
            "Reviews",
            ["Metric", "Value"],
            [
              ["Average Rating", provider.averageRating],
              ["Total Reviews", provider.totalReviews],
              ["On-time Rate", provider.onTimeRate],
              ["Repeat Customers", provider.repeatCustomers],
            ]
          )
        : null}
      {activeTab === "Profile & Documents" ? (
        <SurfaceCard title="Profile & Documents">
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              <InfoRow label="Provider Name" value={provider.name} icon={<UserCircle2 className="size-4" />} />
              <InfoRow label="Service Type" value={provider.serviceType} icon={<BriefcaseBusiness className="size-4" />} />
              <InfoRow label="Email" value={provider.email} icon={<Mail className="size-4" />} />
              <InfoRow label="Phone" value={provider.phone} icon={<Phone className="size-4" />} />
            </div>
            <div className="space-y-3">
              {provider.documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <FileText className="size-4 text-slate-400" />
                    <span>{document.label}</span>
                  </div>
                  <MiniStatus status={document.status} />
                </div>
              ))}
            </div>
          </div>
        </SurfaceCard>
      ) : null}
      {activeTab === "Service Areas" ? (
        <SurfaceCard title="Service Areas">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {provider.serviceAreas.map((area) => (
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
            {provider.activityLog.map((item) => (
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
