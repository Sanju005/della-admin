import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { bookings, dashboardMetrics, payments, approvalItems, complaints, reviews } from "../data/mock-data";
import { DataTable } from "../components/data-table";
import { StatusBadge, statusToTone } from "../components/status-badge";
import { getDashboardSnapshot } from "../lib/dashboard-metrics";

const bookingColumns = [
  { key: "id", label: "ID" },
  { key: "service", label: "Service" },
  { key: "provider", label: "Provider" },
  { key: "customer", label: "Customer" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount" },
  { key: "schedule", label: "Date & Time" },
] as const;

const paymentColumns = [
  { key: "id", label: "ID" },
  { key: "customer", label: "Customer" },
  { key: "provider", label: "Provider" },
  { key: "amount", label: "Amount" },
  { key: "method", label: "Method" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
] as const;

export function DashboardPage() {
  const [metrics, setMetrics] = useState(dashboardMetrics);
  const [approvals, setApprovals] = useState(approvalItems);

  useEffect(() => {
    let active = true;

    async function loadSnapshot() {
      const snapshot = await getDashboardSnapshot();

      if (!active) {
        return;
      }

      setMetrics(snapshot.metrics);
      setApprovals(snapshot.approvals);
    }

    void loadSnapshot();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.trend === "up";

          return (
            <article
              key={metric.title}
              className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`grid size-14 place-items-center rounded-2xl bg-gradient-to-br ${metric.accent} text-white shadow-lg`}>
                  <Icon className="size-6" />
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}>
                  {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                  {metric.delta}
                </span>
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                {metric.title}
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold tracking-tight text-slate-950">
                {metric.value}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                vs last month
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] xl:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-950">
                Bookings / tasks overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Service flow over the last seven days.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              Last 7 days
            </div>
          </div>

          <div className="mt-8 grid h-[280px] grid-cols-7 items-end gap-3">
            {[
              { day: "30 May", active: 56, completed: 24, cancelled: 12 },
              { day: "31 May", active: 78, completed: 38, cancelled: 18 },
              { day: "1 Jun", active: 94, completed: 51, cancelled: 24 },
              { day: "2 Jun", active: 80, completed: 47, cancelled: 19 },
              { day: "3 Jun", active: 82, completed: 49, cancelled: 18 },
              { day: "4 Jun", active: 97, completed: 58, cancelled: 23 },
              { day: "5 Jun", active: 112, completed: 76, cancelled: 31 },
            ].map((point) => (
              <div key={point.day} className="flex h-full flex-col justify-end gap-3">
                <div className="flex h-full items-end gap-1">
                  <div className="w-full rounded-t-2xl bg-[#2563eb]" style={{ height: `${point.active}%` }} />
                  <div className="w-full rounded-t-2xl bg-[#16a34a]" style={{ height: `${point.completed}%` }} />
                  <div className="w-full rounded-t-2xl bg-[#fb7185]" style={{ height: `${point.cancelled}%` }} />
                </div>
                <p className="text-center text-xs font-medium text-slate-400">{point.day}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563eb]" />
              Active
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#16a34a]" />
              Completed
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#fb7185]" />
              Cancelled
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="font-display text-xl font-bold text-slate-950">Task mix</h2>
            <div className="mt-6 flex items-center justify-center">
              <div className="relative grid size-52 place-items-center rounded-full bg-[conic-gradient(#f59e0b_0deg_92deg,#3b82f6_92deg_210deg,#8b5cf6_210deg_292deg,#34d399_292deg_360deg)]">
                <div className="grid size-32 place-items-center rounded-full bg-white shadow-inner">
                  <div className="text-center">
                    <p className="font-display text-4xl font-extrabold text-slate-950">1,245</p>
                    <p className="text-sm text-slate-500">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              {[
                ["Pending", "320", "25.7%", "amber"],
                ["Accepted", "410", "32.9%", "sky"],
                ["In Progress", "280", "22.5%", "violet"],
                ["Completed", "235", "18.9%", "emerald"],
              ].map(([label, value, percent, status]) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`size-2.5 rounded-full ${
                      status === "amber"
                        ? "bg-amber-400"
                        : status === "sky"
                          ? "bg-sky-500"
                          : status === "violet"
                            ? "bg-violet-500"
                            : "bg-emerald-500"
                    }`} />
                    <span className="font-medium text-slate-600">{label}</span>
                  </div>
                  <span className="font-semibold text-slate-950">
                    {value} <span className="text-slate-400">{percent}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-slate-950">Pending approvals</h2>
              <span className="text-sm font-semibold text-emerald-700">View all</span>
            </div>
            <div className="mt-5 space-y-3">
              {approvals.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.note}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${item.accent}`}>
                    {item.pending}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataTable
          title="Recent bookings / tasks"
          description="Latest customer activity across the marketplace."
          rows={bookings}
          columns={[...bookingColumns]}
          statusKey="status"
          searchPlaceholder="Search tasks, providers, or customers..."
        />
        <DataTable
          title="Recent payments"
          description="Settlement and payment monitoring."
          rows={payments}
          columns={[...paymentColumns]}
          statusKey="status"
          searchPlaceholder="Search payment IDs or customer names..."
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1.1fr_0.8fr]">
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-950">Recent reviews</h2>
            <span className="text-sm font-semibold text-emerald-700">View all</span>
          </div>
          <div className="mt-5 space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{review.customer}</p>
                    <p className="text-sm text-slate-500">for {review.provider}</p>
                  </div>
                  <StatusBadge status={review.status} />
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">"{review.comment}"</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-950">Recent complaints</h2>
            <span className="text-sm font-semibold text-emerald-700">View all</span>
          </div>
          <div className="mt-5 space-y-3">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{complaint.subject}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {complaint.ticket} • {complaint.customer}
                    </p>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{complaint.owner}</span>
                  <span className={`font-semibold ${
                    statusToTone(complaint.priority) === "rose"
                      ? "text-rose-600"
                      : statusToTone(complaint.priority) === "amber"
                        ? "text-amber-600"
                        : "text-sky-600"
                  }`}>
                    {complaint.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-950">Users overview</h2>
            <span className="text-sm font-semibold text-emerald-700">View report</span>
          </div>
          <div className="mt-8 flex justify-center">
            <div className="grid size-52 place-items-center rounded-full bg-[conic-gradient(#2563eb_0deg_276deg,#8b5cf6_276deg_336deg,#fb7185_336deg_360deg)]">
              <div className="grid size-32 place-items-center rounded-full bg-white shadow-inner">
                <div className="text-center">
                  <p className="font-display text-4xl font-extrabold text-slate-950">12,845</p>
                  <p className="text-sm text-slate-500">Total users</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            {[
              ["Active users", "9,856", "76.7%", "bg-[#2563eb]"],
              ["Inactive users", "2,145", "16.7%", "bg-[#8b5cf6]"],
              ["Banned users", "844", "6.6%", "bg-[#fb7185]"],
            ].map(([label, value, percent, tone]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-slate-600">
                  <span className={`size-2.5 rounded-full ${tone}`} />
                  {label}
                </span>
                <span className="font-semibold text-slate-950">
                  {value} <span className="text-slate-400">{percent}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
