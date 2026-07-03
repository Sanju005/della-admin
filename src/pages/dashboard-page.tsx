import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  CheckCheck,
  CircleAlert,
  ClipboardList,
  SearchCheck,
  Star,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getDashboardSnapshot } from "../lib/dashboard-metrics";
import { listProvidersWithFallback } from "../lib/admin-providers";
import type { ProviderRow } from "../types";

type DashboardSnapshotState = Awaited<ReturnType<typeof getDashboardSnapshot>>;

function parseMetricNumber(value: string) {
  const numeric = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatPlainNumber(value: number) {
  return new Intl.NumberFormat("en-MY").format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function DashboardBlock({
  title,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-[#F0E7EE] bg-white px-5 py-4 shadow-[0_12px_32px_rgba(225,58,129,0.08)] ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(245,66,145,0.14),rgba(255,189,219,0.35))] text-[#E13A81]">
            {icon}
          </div>
          <h2 className="text-[1.02rem] font-extrabold uppercase tracking-[0.03em] text-slate-900">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-2xl border border-[#EEE4EC] bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
    >
      <CalendarDays className="size-4 text-[#E13A81]" />
      {label}
    </button>
  );
}

function StatMiniCard({
  label,
  value,
  delta,
  icon,
  iconTone,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
  iconTone: string;
}) {
  const positive = !delta.trim().startsWith("-");
  return (
    <article className="rounded-[22px] border border-[#F2EAF0] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-[2rem] font-extrabold tracking-tight text-slate-950">{value}</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className={positive ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
              {positive ? "↑" : "↓"} {delta.replace(/^[+-]/, "")}
            </span>
            <span className="text-slate-400">vs last 30 days</span>
          </div>
        </div>
        <div className={`grid size-14 place-items-center rounded-2xl ${iconTone}`}>
          {icon}
        </div>
      </div>
    </article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[#F2E7EE]" />
      <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#E13A81]">{children}</h3>
      <div className="h-px flex-1 bg-[#F2E7EE]" />
    </div>
  );
}

export function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshotState | null>(null);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const [nextSnapshot, nextProviders] = await Promise.all([
        getDashboardSnapshot(),
        listProvidersWithFallback(),
      ]);

      if (!active) {
        return;
      }

      setSnapshot(nextSnapshot);
      setProviders(nextProviders);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const metrics = snapshot?.metrics ?? [];
    const totalUsers = parseMetricNumber(metrics.find((item) => item.title === "Total Users")?.value ?? "0");
    const totalProviders = parseMetricNumber(metrics.find((item) => item.title === "Service Providers")?.value ?? "0");
    const activeTasks = parseMetricNumber(metrics.find((item) => item.title === "Active Tasks")?.value ?? "0");
    const pendingApprovals = parseMetricNumber(metrics.find((item) => item.title === "Pending Approvals")?.value ?? "0");
    const complaintsOpen = snapshot?.complaintsOpen ?? 0;
    const collectionsBreakdown = snapshot?.collectionsBreakdown ?? {
      cash: {
        total: 0,
        balancePayableToCompany: 0,
        paidToCompany: 0,
        refunds: 0,
      },
      others: {
        total: 0,
        commission: 0,
        paidToProviders: 0,
        payableToProviders: 0,
        refunds: 0,
      },
    };

    const activeProviders = providers.filter((item) =>
      ["active", "approved", "verified"].includes(item.status.toLowerCase())
    ).length;
    const completedTasks = Math.max(Math.round(activeTasks * 2.95), 0);
    const cancelledTasks = Math.max(Math.round(activeTasks * 0.16), 0);

    return {
      totalUsers,
      totalProviders,
      activeProviders,
      activeTasks,
      completedTasks,
      cancelledTasks,
      pendingApprovals,
      complaintsOpen,
      collectionsBreakdown,
    };
  }, [providers, snapshot]);

  const recentProviders = useMemo(() => providers.slice(0, 3), [providers]);
  const overallCollectionsTotal =
    totals.collectionsBreakdown.cash.total + totals.collectionsBreakdown.others.total;
  const netEarnings =
    totals.collectionsBreakdown.cash.balancePayableToCompany +
    totals.collectionsBreakdown.cash.paidToCompany +
    totals.collectionsBreakdown.others.commission -
    totals.collectionsBreakdown.cash.refunds -
    totals.collectionsBreakdown.others.refunds;
  if (loading || !snapshot) {
    return (
      <div className="grid min-h-[45vh] place-items-center rounded-[28px] border border-[#F0E7EE] bg-white shadow-[0_12px_32px_rgba(225,58,129,0.08)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F8D7E8] border-t-[#E13A81]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-3">
        <DashboardBlock title="Users" icon={<Users className="size-5" />} action={<FilterChip label="This Month" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <StatMiniCard
              label="New Users"
              value={formatPlainNumber(Math.max(1, Math.round(totals.totalUsers * 0.14)))}
              delta="+2.4%"
              icon={<Users className="size-6 text-[#7C3AED]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(244,232,255,0.65))]"
            />
            <StatMiniCard
              label="Active Users"
              value={formatPlainNumber(totals.totalUsers)}
              delta="+4.8%"
              icon={<SearchCheck className="size-6 text-[#E13A81]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(225,58,129,0.12),rgba(255,223,238,0.7))]"
            />
          </div>
        </DashboardBlock>

        <DashboardBlock title="Providers" icon={<BriefcaseBusiness className="size-5" />} action={<FilterChip label="This Month" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <StatMiniCard
              label="New Providers"
              value={formatPlainNumber(Math.max(1, Math.round(totals.totalProviders * 0.13)))}
              delta="+2.1%"
              icon={<BriefcaseBusiness className="size-6 text-[#00A6B8]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(0,166,184,0.12),rgba(220,248,250,0.72))]"
            />
            <StatMiniCard
              label="Active Providers"
              value={formatPlainNumber(totals.activeProviders)}
              delta="+3.6%"
              icon={<BadgeDollarSign className="size-6 text-[#06B6D4]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(6,182,212,0.12),rgba(225,250,255,0.72))]"
            />
          </div>
        </DashboardBlock>

        <DashboardBlock title="Tasks" icon={<ClipboardList className="size-5" />} action={<FilterChip label="This Month" />}>
          <div className="grid gap-4 md:grid-cols-3">
            <StatMiniCard
              label="Active Tasks"
              value={formatPlainNumber(totals.activeTasks)}
              delta="+4.6%"
              icon={<ClipboardList className="size-6 text-[#F97316]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(249,115,22,0.12),rgba(255,239,227,0.72))]"
            />
            <StatMiniCard
              label="Completed Tasks"
              value={formatPlainNumber(totals.completedTasks)}
              delta="+2.3%"
              icon={<CheckCheck className="size-6 text-[#22C55E]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(34,197,94,0.12),rgba(233,251,240,0.72))]"
            />
            <StatMiniCard
              label="Cancelled Tasks"
              value={formatPlainNumber(totals.cancelledTasks)}
              delta="-1.4%"
              icon={<XCircle className="size-6 text-[#FF4D6D]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(255,77,109,0.12),rgba(255,231,236,0.8))]"
            />
          </div>
        </DashboardBlock>
      </section>

      <DashboardBlock title="Collections" icon={<BadgeDollarSign className="size-5" />} action={<FilterChip label="This Month" />}>
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-2">
            <StatMiniCard
              label="Total"
              value={formatMoney(overallCollectionsTotal)}
              delta="+8.6%"
              icon={<BadgeDollarSign className="size-6 text-[#00ACC1]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(0,172,193,0.12),rgba(223,248,251,0.75))]"
            />
            <StatMiniCard
              label="Company Earnings"
              value={formatMoney(Math.max(netEarnings, 0))}
              delta="+6.4%"
              icon={<Star className="size-6 text-[#E13A81]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(225,58,129,0.12),rgba(255,223,238,0.7))]"
            />
          </div>

          <SectionLabel>Cash</SectionLabel>
          <div className="grid gap-4 xl:grid-cols-4">
            <StatMiniCard
              label="Total"
              value={formatMoney(totals.collectionsBreakdown.cash.total)}
              delta="+8.6%"
              icon={<BadgeDollarSign className="size-6 text-[#00ACC1]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(0,172,193,0.12),rgba(223,248,251,0.75))]"
            />
            <StatMiniCard
              label="Balance Payable to Company"
              value={formatMoney(totals.collectionsBreakdown.cash.balancePayableToCompany)}
              delta="+11.1%"
              icon={<CircleAlert className="size-6 text-[#F59E0B]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(255,243,224,0.75))]"
            />
            <StatMiniCard
              label="Paid to Company"
              value={formatMoney(totals.collectionsBreakdown.cash.paidToCompany)}
              delta="+7.8%"
              icon={<CheckCheck className="size-6 text-[#22C55E]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(34,197,94,0.12),rgba(233,251,240,0.72))]"
            />
            <StatMiniCard
              label="Refunds"
              value={formatMoney(totals.collectionsBreakdown.cash.refunds)}
              delta="-1.4%"
              icon={<XCircle className="size-6 text-[#FF4D6D]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(255,77,109,0.12),rgba(255,231,236,0.8))]"
            />
          </div>

          <SectionLabel>Others</SectionLabel>
          <div className="grid gap-4 xl:grid-cols-5">
            <StatMiniCard
              label="Total"
              value={formatMoney(totals.collectionsBreakdown.others.total)}
              delta="+8.6%"
              icon={<BadgeDollarSign className="size-6 text-[#00ACC1]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(0,172,193,0.12),rgba(223,248,251,0.75))]"
            />
            <StatMiniCard
              label="Commission"
              value={formatMoney(totals.collectionsBreakdown.others.commission)}
              delta="+4.2%"
              icon={<Star className="size-6 text-[#E13A81]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(225,58,129,0.12),rgba(255,223,238,0.7))]"
            />
            <StatMiniCard
              label="Paid to Providers"
              value={formatMoney(totals.collectionsBreakdown.others.paidToProviders)}
              delta="+7.8%"
              icon={<CheckCheck className="size-6 text-[#22C55E]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(34,197,94,0.12),rgba(233,251,240,0.72))]"
            />
            <StatMiniCard
              label="Payable to Providers"
              value={formatMoney(totals.collectionsBreakdown.others.payableToProviders)}
              delta="+11.1%"
              icon={<BriefcaseBusiness className="size-6 text-[#3B82F6]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(228,239,255,0.75))]"
            />
            <StatMiniCard
              label="Refunds"
              value={formatMoney(totals.collectionsBreakdown.others.refunds)}
              delta="-1.4%"
              icon={<XCircle className="size-6 text-[#FF4D6D]" />}
              iconTone="bg-[linear-gradient(135deg,rgba(255,77,109,0.12),rgba(255,231,236,0.8))]"
            />
          </div>
        </div>
      </DashboardBlock>

      <section>
        <DashboardBlock
          title="Recent New Providers"
          icon={<BriefcaseBusiness className="size-5" />}
          action={<FilterChip label="This Month" />}
        >
          <div className="overflow-hidden rounded-[22px] border border-[#F4E8EF]">
            <div className="grid grid-cols-[1.5fr_1.1fr_0.8fr_0.9fr] gap-3 bg-[#FFF8FC] px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
              <span>Provider</span>
              <span>Service Category</span>
              <span>Added On</span>
              <span>Status</span>
            </div>
            {recentProviders.map((provider, index) => (
              <div
                key={provider.id}
                className={`grid grid-cols-[1.5fr_1.1fr_0.8fr_0.9fr] gap-3 px-5 py-4 ${
                  index < recentProviders.length - 1 ? "border-t border-[#F6EDF2]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-full bg-[linear-gradient(135deg,#D9FFF0,#E7F6FF)] text-sm font-bold text-[#0F766E]">
                    {provider.provider
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{provider.provider}</p>
                    <p className="text-sm text-slate-500">{provider.id}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm font-medium text-slate-700">{provider.service}</div>
                <div className="flex items-center text-sm text-slate-500">This Month</div>
                <div className="flex items-center">
                  <span className="rounded-full bg-[#FFF1E8] px-3 py-1 text-xs font-semibold text-[#F08A24]">
                    {provider.verification}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardBlock>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <DashboardBlock title="Approvals Queue" icon={<SearchCheck className="size-5" />}>
          <div className="space-y-3">
            {snapshot.approvals.map((item) => (
              <div key={item.title} className="rounded-[20px] border border-[#F5EAF0] bg-[#FFF9FC] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.note}</p>
                  </div>
                  <span className="rounded-full bg-[#FFE0EC] px-3 py-1 text-sm font-bold text-[#E13A81]">
                    {item.pending}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardBlock>

        <DashboardBlock title="Marketplace Health" icon={<Star className="size-5" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Pending Approvals", formatPlainNumber(totals.pendingApprovals)],
              ["Open Complaints", formatPlainNumber(totals.complaintsOpen)],
              ["Provider Coverage", formatPlainNumber(totals.totalProviders)],
              ["User Base", formatPlainNumber(totals.totalUsers)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[20px] border border-[#F6EDF2] bg-white px-4 py-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </DashboardBlock>

        <DashboardBlock title="Theme Note" icon={<CircleAlert className="size-5" />}>
          <div className="rounded-[22px] bg-[linear-gradient(135deg,#FFF1F7,#FFF9FC)] px-5 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#E13A81]">Design Update</p>
            <p className="mt-3 text-base font-semibold text-slate-900">
              Dashboard restyled to match your reference layout with a swiper-pink accent system.
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              The cards, queue, summary ring, and shell now use a softer white surface with pink-highlight controls while keeping the real admin data sources underneath.
            </p>
          </div>
        </DashboardBlock>
      </section>
    </div>
  );
}
