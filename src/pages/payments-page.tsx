import { Banknote, CalendarDays, Check, Clock3, Eye, Image as ImageIcon, ReceiptText, Search, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/auth-provider";
import { StatusBadge } from "../components/status-badge";
import { approveCompanyPayments, listPaymentsWithFallback } from "../lib/admin-payments";
import type { PaymentProofAsset, PaymentRow } from "../types";

function parseMoney(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const numeric = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-MY").format(value);
}

function buildProviderId(source: string) {
  const normalized = source.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return normalized.startsWith("PV") ? normalized : `PV${normalized.slice(0, 5).padEnd(5, "0")}`;
}

function isImageProof(asset: PaymentProofAsset | null | undefined) {
  const mimeType = asset?.mimeType?.trim().toLowerCase() ?? "";
  const url = asset?.url?.trim().toLowerCase() ?? "";
  const fileName = asset?.fileName?.trim().toLowerCase() ?? "";

  return (
    mimeType.startsWith("image/") ||
    url.startsWith("data:image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(fileName)
  );
}

function SummaryCard({
  label,
  value,
  note,
  tone,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[24px] border border-[#EEE8F4] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-[1.55rem] font-extrabold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{note}</p>
        </div>
        <div className={`grid size-11 place-items-center rounded-2xl ${tone}`}>{icon}</div>
      </div>
    </article>
  );
}

function FilterPill({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-[#E6D9FF] bg-[#F7F1FF] text-[#6D41DD]"
          : "border-[#EEE6F2] bg-white text-slate-600"
      }`}
    >
      <CalendarDays className="size-4" />
      {label}
    </button>
  );
}

function ProofThumb({ asset }: { asset: PaymentProofAsset | null | undefined }) {
  if (!asset) {
    return <span className="text-xs text-slate-400">No proof</span>;
  }

  if (isImageProof(asset)) {
    return (
      <a
        href={asset.url}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-[#E8E2EF] bg-slate-50"
      >
        <img src={asset.url} alt={asset.fileName ?? asset.label} className="h-full w-full object-cover" />
      </a>
    );
  }

  return (
    <a
      href={asset.url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8E2EF] bg-slate-50 text-slate-500"
    >
      <ImageIcon className="size-4" />
    </a>
  );
}

export function PaymentsPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "custom">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "payment process">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [approvalPendingId, setApprovalPendingId] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [adminAmounts, setAdminAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      setLoading(true);
      const nextRows = await listPaymentsWithFallback();

      if (!active) {
        return;
      }

      setRows(nextRows);
      setSelectedRowId((current) => current ?? nextRows[0]?.rawId ?? null);
      setAdminAmounts((current) => {
        const next = { ...current };

        nextRows.forEach((row) => {
          const key = row.rawId ?? row.id;
          if (!key || next[key] !== undefined) {
            return;
          }

          next[key] = String(parseMoney(row.companyCommissionAmount).toFixed(2));
        });

        return next;
      });
      setApprovalError(null);
      setLoading(false);
    }

    void loadPayments();

    return () => {
      active = false;
    };
  }, []);

  function parseRowDate(value: string | undefined) {
    if (!value?.trim()) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  const filteredRows = useMemo(() => {
    const baseRows = rows.filter((row) => (row.method ?? "").trim().toLowerCase() === "cash");
    const trimmed = query.trim().toLowerCase();
    const today = new Date();
    const todayString = today.toDateString();

    return baseRows.filter((row) => {
      const providerId = buildProviderId(row.id);
      const matchesSearch =
        !trimmed || [providerId, row.provider].join(" ").toLowerCase().includes(trimmed);

      const normalizedStatus = (row.commissionStatus ?? row.status ?? "").trim().toLowerCase();
      const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;

      const parsedDate = parseRowDate(row.date);
      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = parsedDate ? parsedDate.toDateString() === todayString : false;
      }

      if (dateFilter === "custom") {
        if (!customStartDate && !customEndDate) {
          matchesDate = true;
        } else if (!parsedDate) {
          matchesDate = false;
        } else {
          const rowTime = parsedDate.getTime();
          const startTime = customStartDate ? new Date(`${customStartDate}T00:00:00`).getTime() : null;
          const endTime = customEndDate ? new Date(`${customEndDate}T23:59:59`).getTime() : null;

          matchesDate =
            (startTime === null || rowTime >= startTime) &&
            (endTime === null || rowTime <= endTime);
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [customEndDate, customStartDate, dateFilter, query, rows, statusFilter]);

  useEffect(() => {
    if (!filteredRows.length) {
      setSelectedRowId(null);
      return;
    }

    setSelectedRowId((current) =>
      filteredRows.some((row) => (row.rawId ?? row.id) === current)
        ? current
        : (filteredRows[0]?.rawId ?? filteredRows[0]?.id ?? null)
    );
  }, [filteredRows]);

  const selectedRow = useMemo(
    () => filteredRows.find((row) => (row.rawId ?? row.id) === selectedRowId) ?? filteredRows[0] ?? null,
    [filteredRows, selectedRowId]
  );

  const stats = useMemo(() => {
    const totalBookings = filteredRows.length;
    const totalAmount = filteredRows.reduce((sum, row) => sum + parseMoney(row.amount), 0);
    const totalCollected = filteredRows.reduce(
      (sum, row) => sum + parseMoney(row.providerNetAmount ?? row.amount),
      0
    );
    const totalCommission = filteredRows.reduce(
      (sum, row) => sum + parseMoney(row.companyCommissionAmount),
      0
    );
    const pendingAmount = filteredRows
      .filter((row) => (row.commissionStatus ?? "").trim().toLowerCase() !== "paid")
      .reduce((sum, row) => sum + parseMoney(row.companyCommissionAmount), 0);

    return {
      totalBookings,
      totalAmount,
      totalCollected,
      totalCommission,
      pendingAmount,
    };
  }, [filteredRows]);

  async function handleApprovePayment(row: PaymentRow) {
    if (!row.unpaidRawIds?.length || !session?.access_token || approvalPendingId) {
      return;
    }

    setApprovalPendingId(row.rawId ?? row.id);
    setApprovalError(null);

    try {
      await approveCompanyPayments({
        accessToken: session.access_token,
        paymentIds: row.unpaidRawIds,
      });

      const nextRows = await listPaymentsWithFallback();
      setRows(nextRows);
      setSelectedRowId(row.rawId ?? row.id);
    } catch (error) {
      setApprovalError(
        error instanceof Error ? error.message : "Unable to approve provider commission payment."
      );
    } finally {
      setApprovalPendingId(null);
    }
  }

  if (loading && rows.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center rounded-[28px] border border-[#EEE8F4] bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      </div>
    );
  }

  const selectedProof = selectedRow?.providerCompanyPaymentProof ?? selectedRow?.customerPaymentProof ?? null;

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] border border-[#EEE8F4] bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFCFF_100%)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-[#E9F9EF] text-[#18A957]">
                <Banknote className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-[1.5rem] font-extrabold tracking-tight text-slate-950">
                  Cash
                </h2>
                <p className="text-sm text-slate-500">
                  View and manage all cash payments from providers
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setDateFilter("today")}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                dateFilter === "today"
                  ? "border-[#E6D9FF] bg-[#F7F1FF] text-[#6D41DD]"
                  : "border-[#EEE6F2] bg-white text-slate-600"
              }`}
            >
              <CalendarDays className="size-4" />
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("custom")}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                dateFilter === "custom"
                  ? "border-[#E6D9FF] bg-[#F7F1FF] text-[#6D41DD]"
                  : "border-[#EEE6F2] bg-white text-slate-600"
              }`}
            >
              <CalendarDays className="size-4" />
              Custom Range
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilter("all");
                setStatusFilter("all");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="inline-flex items-center rounded-2xl border border-[#EEE6F2] bg-white px-4 py-2 text-sm font-medium text-slate-500"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,420px),auto,1fr] xl:items-end">
            <div>
              <p className="text-sm font-semibold text-slate-700">Search by Provider ID or Name</p>
              <label className="mt-3 flex items-center gap-3 rounded-2xl border border-[#E7E1EC] bg-white px-4 py-3 text-sm text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <Search className="size-4" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search provider name"
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-slate-400 transition hover:text-slate-600"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </label>
            </div>

            {dateFilter === "custom" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  Start Date
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    className="rounded-2xl border border-[#E7E1EC] bg-white px-4 py-3 text-sm font-medium text-slate-600 outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  End Date
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    className="rounded-2xl border border-[#E7E1EC] bg-white px-4 py-3 text-sm font-medium text-slate-600 outline-none"
                  />
                </label>
              </div>
            ) : (
              <div />
            )}

            <div>
              <p className="text-sm font-semibold text-slate-700">Sort by Status</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["all", "All"],
                  ["pending", "Pending"],
                  ["paid", "Paid"],
                  ["payment process", "Process"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value as "all" | "pending" | "paid" | "payment process")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === value
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              label="Total Bookings"
              value={formatCount(stats.totalBookings)}
              note="Loaded cash transactions"
              tone="bg-[#F3EEFF] text-[#7C4DFF]"
              icon={<ReceiptText className="size-5" />}
            />
            <SummaryCard
              label="Total Amount"
              value={formatMoney(stats.totalAmount)}
              note="Collected from customers"
              tone="bg-[#EEF4FF] text-[#2563EB]"
              icon={<Wallet className="size-5" />}
            />
            <SummaryCard
              label="Total Collected"
              value={formatMoney(stats.totalCollected)}
              note="Provider net total"
              tone="bg-[#EAFBF0] text-[#16A34A]"
              icon={<Banknote className="size-5" />}
            />
            <SummaryCard
              label="Total Commission"
              value={formatMoney(stats.totalCommission)}
              note="Admin commission"
              tone="bg-[#FFF5E8] text-[#F59E0B]"
              icon={<ReceiptText className="size-5" />}
            />
            <SummaryCard
              label="Pending Amount"
              value={formatMoney(stats.pendingAmount)}
              note="Awaiting provider settlement"
              tone="bg-[#FFF0F0] text-[#EF4444]"
              icon={<Clock3 className="size-5" />}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-[#EEE8F4] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1500px] text-left">
            <thead className="border-b border-[#F0EAF4] bg-[#FFFCFF]">
              <tr className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-4">Provider ID</th>
                <th className="px-4 py-4">Provider</th>
                <th className="px-4 py-4">Task ID</th>
                <th className="px-4 py-4">Task Date</th>
                <th className="px-4 py-4">Total Amount</th>
                <th className="px-4 py-4">Commission</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Paid Commission By Provider</th>
                <th className="px-4 py-4">Ref Image</th>
                <th className="px-4 py-4">Admin Amount</th>
                <th className="px-4 py-4">Balance</th>
                <th className="px-4 py-4">Approve / Reject</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const rowKey = row.rawId ?? row.id;
                const isSelected = rowKey === selectedRowId;
                const commission = parseMoney(row.companyCommissionAmount);
                const paidByProvider = parseMoney(row.companyCommissionAmount);
                const adminAmount = Number(adminAmounts[rowKey] ?? commission);
                const balance = paidByProvider - (Number.isFinite(adminAmount) ? adminAmount : 0);
                const isCommissionPaid = (row.commissionStatus ?? "").trim().toLowerCase() === "paid";
                const hasProof = Boolean(
                  row.providerCompanyPaymentProof?.url?.trim() || row.customerPaymentProof?.url?.trim()
                );
                const pending = approvalPendingId === rowKey;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => setSelectedRowId(rowKey)}
                    className={`border-b border-[#F6F0F7] text-sm transition hover:bg-[#FFFCFF] ${
                      isSelected ? "bg-[#FCFAFF]" : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-4 font-semibold text-slate-700">{buildProviderId(row.id)}</td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{row.provider}</p>
                        <p className="mt-1 text-xs text-slate-400">{row.customer}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">{row.bookingId ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-500">{row.date}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{row.amount}</td>
                    <td className="px-4 py-4 text-slate-700">{formatMoney(commission)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={row.commissionStatus ?? row.status} />
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">
                      {formatMoney(paidByProvider)}
                    </td>
                    <td className="px-4 py-4">
                      <ProofThumb asset={row.providerCompanyPaymentProof ?? row.customerPaymentProof} />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        value={adminAmounts[rowKey] ?? String(commission.toFixed(2))}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          setAdminAmounts((current) => ({
                            ...current,
                            [rowKey]: event.target.value,
                          }))
                        }
                        className="w-[120px] rounded-xl border border-[#ECE5F1] bg-[#FCFBFE] px-3 py-2 font-semibold text-slate-700 outline-none"
                      />
                    </td>
                    <td className={`px-4 py-4 font-semibold ${balance === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatMoney(balance)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleApprovePayment(row);
                          }}
                          disabled={
                            pending ||
                            isCommissionPaid ||
                            !hasProof ||
                            !session?.access_token ||
                            balance !== 0
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            pending || isCommissionPaid || !hasProof || !session?.access_token || balance !== 0
                              ? "cursor-not-allowed bg-slate-100 text-slate-400"
                              : "bg-[#EAFBF0] text-[#169B57] hover:brightness-95"
                          }`}
                        >
                          <Check className="size-3.5" />
                          {pending ? "Approving..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F1] px-3 py-1.5 text-xs font-semibold text-[#EF4444]"
                        >
                          <X className="size-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[#FBF8FF] text-sm font-semibold text-slate-800">
              <tr>
                <td className="px-4 py-4" colSpan={4}>
                  Total ({formatCount(filteredRows.length)} cash payments)
                </td>
                <td className="px-4 py-4">{formatMoney(stats.totalAmount)}</td>
                <td className="px-4 py-4">{formatMoney(stats.totalCommission)}</td>
                <td className="px-4 py-4" />
                <td className="px-4 py-4">{formatMoney(stats.totalCommission)}</td>
                <td className="px-4 py-4" />
                <td className="px-4 py-4">
                  {formatMoney(
                    filteredRows.reduce((sum, row) => {
                      const key = row.rawId ?? row.id;
                      return sum + Number(adminAmounts[key] ?? parseMoney(row.companyCommissionAmount));
                    }, 0)
                  )}
                </td>
                <td className="px-4 py-4">
                  {formatMoney(
                    filteredRows.reduce((sum, row) => {
                      const key = row.rawId ?? row.id;
                      return (
                        sum +
                        (parseMoney(row.companyCommissionAmount) -
                          Number(adminAmounts[key] ?? parseMoney(row.companyCommissionAmount)))
                      );
                    }, 0)
                  )}
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tfoot>
          </table>
        </div>

        {approvalError ? (
          <div className="border-t border-[#F6F0F7] px-5 py-3 text-sm text-rose-600">{approvalError}</div>
        ) : null}

        {filteredRows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No cash payments match the current provider search.
          </div>
        ) : null}
      </section>

      {selectedRow ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr),380px]">
          <article className="rounded-[28px] border border-[#EEE8F4] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-950">Transaction Summary</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Selected cash task details and commission review summary.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedProof?.url) {
                    window.open(selectedProof.url, "_blank", "noopener,noreferrer");
                  }
                }}
                disabled={!selectedProof?.url}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
                  selectedProof?.url
                    ? "bg-[#F5F1FF] text-[#6D41DD]"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                }`}
              >
                <Eye className="size-4" />
                View Proof
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-[#FAF8FD] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Provider ID</p>
                <p className="mt-2 text-base font-bold text-slate-950">{buildProviderId(selectedRow.id)}</p>
              </div>
              <div className="rounded-2xl bg-[#FAF8FD] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Task ID</p>
                <p className="mt-2 text-base font-bold text-slate-950">{selectedRow.bookingId ?? "-"}</p>
              </div>
              <div className="rounded-2xl bg-[#FAF8FD] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Commission</p>
                <p className="mt-2 text-base font-bold text-slate-950">
                  {selectedRow.companyCommissionAmount ?? "RM0.00"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#FAF8FD] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Status</p>
                <p className="mt-2 text-base font-bold text-slate-950">{selectedRow.commissionStatus ?? selectedRow.status}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-[#EEE8F4] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <h3 className="font-display text-xl font-bold text-slate-950">Reference Preview</h3>
            <p className="mt-1 text-sm text-slate-500">Open the image and verify the paid commission amount.</p>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-[#EEE6F0] bg-[#FAF8FD]">
              {selectedProof && isImageProof(selectedProof) ? (
                <img
                  src={selectedProof.url}
                  alt={selectedProof.fileName ?? selectedProof.label}
                  className="max-h-[320px] w-full object-contain"
                />
              ) : (
                <div className="grid min-h-[260px] place-items-center p-6 text-center text-sm text-slate-500">
                  {selectedProof ? "Preview is available through the View Proof button." : "No payment proof uploaded yet."}
                </div>
              )}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
