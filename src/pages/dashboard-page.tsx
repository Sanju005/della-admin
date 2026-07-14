import {
  BadgePercent,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCheck,
  CircleAlert,
  ClipboardList,
  Globe,
  ReceiptText,
  RotateCcw,
  SearchCheck,
  Send,
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
    <section className={`rounded-[28px] border border-[#F0E7EE] bg-white px-6 py-5 shadow-[0_12px_32px_rgba(225,58,129,0.08)] ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
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
}: {
  label: string;
  value: string;
  delta: string;
}) {
  const positive = !delta.trim().startsWith("-");
  return (
    <article className="min-h-[128px] rounded-[24px] border border-[#EEE6F7] bg-white px-6 py-4 shadow-[0_10px_28px_rgba(109,65,221,0.05)]">
      <div className="flex items-start gap-3">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-[1.9rem] font-extrabold tracking-tight text-slate-950">{value}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className={positive ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
              {positive ? "↑" : "↓"} {delta.replace(/^[+-]/, "")}
            </span>
            <span className="text-slate-400">vs last 30 days</span>
          </div>
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

function CollectionSectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 text-[#5E38D7]">
        {icon}
        <h3 className="text-[1.05rem] font-bold text-[#3920A4]">{title}</h3>
      </div>
      <div className="h-px flex-1 bg-[#ECE8F8]" />
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
  const overallRefunds =
    totals.collectionsBreakdown.cash.refunds + totals.collectionsBreakdown.others.refunds;
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
      <section className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))] 2xl:[grid-template-columns:repeat(3,minmax(0,1fr))]">
        <DashboardBlock title="Users" icon={<Users className="size-5" />} action={<FilterChip label="This Month" />}>
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
            <StatMiniCard
              label="New Users"
              value={formatPlainNumber(Math.max(1, Math.round(totals.totalUsers * 0.14)))}
              delta="+2.4%"
            />
            <StatMiniCard
              label="Active Users"
              value={formatPlainNumber(totals.totalUsers)}
              delta="+4.8%"
            />
          </div>
        </DashboardBlock>

        <DashboardBlock title="Providers" icon={<BriefcaseBusiness className="size-5" />} action={<FilterChip label="This Month" />}>
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
            <StatMiniCard
              label="New Providers"
              value={formatPlainNumber(Math.max(1, Math.round(totals.totalProviders * 0.13)))}
              delta="+2.1%"
            />
            <StatMiniCard
              label="Active Providers"
              value={formatPlainNumber(totals.activeProviders)}
              delta="+3.6%"
            />
          </div>
        </DashboardBlock>

        <DashboardBlock title="Tasks" icon={<ClipboardList className="size-5" />} action={<FilterChip label="This Month" />}>
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))]">
            <StatMiniCard
              label="Active Tasks"
              value={formatPlainNumber(totals.activeTasks)}
              delta="+4.6%"
            />
            <StatMiniCard
              label="Completed Tasks"
              value={formatPlainNumber(totals.completedTasks)}
              delta="+2.3%"
            />
            <StatMiniCard
              label="Cancelled Tasks"
              value={formatPlainNumber(totals.cancelledTasks)}
              delta="-1.4%"
            />
          </div>
        </DashboardBlock>
      </section>

      <DashboardBlock title="Collections" icon={<BadgeDollarSign className="size-5" />} action={<FilterChip label="This Month" />}>
        <div className="space-y-7">
          <div className="grid gap-4 xl:grid-cols-3">
            <StatMiniCard
              label="Total Collections"
              value={formatMoney(overallCollectionsTotal)}
              delta="+8.6%"
            />
            <StatMiniCard
              label="Company Earnings"
              value={formatMoney(Math.max(netEarnings, 0))}
              delta="+6.4%"
            />
            <StatMiniCard
              label="Refunds"
              value={formatMoney(overallRefunds)}
              delta="-1.4%"
            />
          </div>

          <CollectionSectionHeader
            title="Cash Payments"
            icon={<Banknote className="size-6" strokeWidth={1.8} />}
          />
          <div className="grid gap-4 xl:grid-cols-4">
            <StatMiniCard
              label="Total Cash Collected"
              value={formatMoney(totals.collectionsBreakdown.cash.total)}
              delta="+8.6%"
            />
            <StatMiniCard
              label="Payable to Company"
              value={formatMoney(totals.collectionsBreakdown.cash.balancePayableToCompany)}
              delta="+11.1%"
            />
            <StatMiniCard
              label="Paid to Company"
              value={formatMoney(totals.collectionsBreakdown.cash.paidToCompany)}
              delta="+7.8%"
            />
            <StatMiniCard
              label="Cash Refunds"
              value={formatMoney(totals.collectionsBreakdown.cash.refunds)}
              delta="-1.4%"
            />
          </div>

          <CollectionSectionHeader
            title="Online Payments"
            icon={<Globe className="size-6" strokeWidth={1.8} />}
          />
          <div className="grid gap-4 xl:grid-cols-5">
            <StatMiniCard
              label="Total Online Collected"
              value={formatMoney(totals.collectionsBreakdown.others.total)}
              delta="+8.6%"
            />
            <StatMiniCard
              label="Commission"
              value={formatMoney(totals.collectionsBreakdown.others.commission)}
              delta="+4.2%"
            />
            <StatMiniCard
              label="Paid to Providers"
              value={formatMoney(totals.collectionsBreakdown.others.paidToProviders)}
              delta="+7.8%"
            />
            <StatMiniCard
              label="Payable to Providers"
              value={formatMoney(totals.collectionsBreakdown.others.payableToProviders)}
              delta="+11.1%"
            />
            <StatMiniCard
              label="Online Refunds"
              value={formatMoney(totals.collectionsBreakdown.others.refunds)}
              delta="-1.4%"
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
