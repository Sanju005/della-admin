import { ExternalLink, FileText, Image as ImageIcon, ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "../components/data-table";
import { useAuth } from "../auth/auth-provider";
import { approveCompanyPayments, buildPaymentStats, listPaymentsWithFallback } from "../lib/admin-payments";
import type { PaymentProofAsset, PaymentRow } from "../types";

function isImageProof(asset: PaymentProofAsset | null | undefined) {
  const mimeType = asset?.mimeType?.trim().toLowerCase() ?? "";
  const url = asset?.url?.trim().toLowerCase() ?? "";
  const fileName = asset?.fileName?.trim().toLowerCase() ?? "";

  return mimeType.startsWith("image/") || url.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(fileName);
}

function isPdfProof(asset: PaymentProofAsset | null | undefined) {
  const mimeType = asset?.mimeType?.trim().toLowerCase() ?? "";
  const url = asset?.url?.trim().toLowerCase() ?? "";
  const fileName = asset?.fileName?.trim().toLowerCase() ?? "";

  return mimeType === "application/pdf" || url.startsWith("data:application/pdf") || fileName.endsWith(".pdf");
}

function ProofPreviewCard({
  title,
  asset,
}: {
  title: string;
  asset: PaymentProofAsset | null | undefined;
}) {
  if (!asset) {
    return (
      <article className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-5">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-3 text-sm text-slate-500">No proof uploaded for this payment yet.</p>
      </article>
    );
  }

  if (isImageProof(asset)) {
    return (
      <article className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-xs text-slate-400">{asset.fileName ?? "Image proof"}</p>
          </div>
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Open
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
          <img
            src={asset.url}
            alt={asset.fileName ?? asset.label}
            className="max-h-[360px] w-full object-contain"
          />
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
          {isPdfProof(asset) ? <FileText className="size-5" /> : <ImageIcon className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{asset.fileName ?? asset.label}</p>
          <p className="mt-1 text-xs text-slate-400">{asset.mimeType ?? "Uploaded proof file"}</p>
        </div>
      </div>
      <a
        href={asset.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        {isPdfProof(asset) ? "Open PDF proof" : "Open file proof"}
        <ExternalLink className="size-4" />
      </a>
    </article>
  );
}

function DetailStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
      {note ? <p className="mt-1 text-[12px] text-slate-500">{note}</p> : null}
    </div>
  );
}

export function PaymentsPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [approvalPending, setApprovalPending] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      setLoading(true);
      const nextRows = await listPaymentsWithFallback();

      if (!active) {
        return;
      }

      setRows(nextRows);
      setSelectedPaymentId((current) => current ?? nextRows[0]?.id ?? null);
      setApprovalError(null);
      setLoading(false);
    }

    void loadPayments();

    return () => {
      active = false;
    };
  }, []);

  const selectedPayment = useMemo(
    () => rows.find((row) => row.id === selectedPaymentId) ?? rows[0] ?? null,
    [rows, selectedPaymentId],
  );
  const settlementProofAsset =
    selectedPayment?.providerCompanyPaymentProof ?? selectedPayment?.customerPaymentProof ?? null;
  const companyProofUploaded = Boolean(settlementProofAsset?.url?.trim());
  const isCommissionPaid = (selectedPayment?.commissionStatus ?? "").trim().toLowerCase() === "paid";

  async function handleApprovePayment() {
    if (!selectedPayment?.unpaidRawIds?.length || !session?.access_token || approvalPending) {
      return;
    }

    setApprovalPending(true);
    setApprovalError(null);

    try {
      await approveCompanyPayments({
        accessToken: session.access_token,
        paymentIds: selectedPayment.unpaidRawIds,
      });

      const nextRows = await listPaymentsWithFallback();
      setRows(nextRows);
      setSelectedPaymentId((current) => {
        if (!current) {
          return nextRows[0]?.id ?? null;
        }

        return nextRows.find((row) => row.id === current)?.id ?? nextRows[0]?.id ?? null;
      });
    } catch (error) {
      setApprovalError(
        error instanceof Error ? error.message : "Unable to approve provider commission payment.",
      );
    } finally {
      setApprovalPending(false);
    }
  }

  if (loading && rows.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      </div>
    );
  }

  const stats = buildPaymentStats(rows);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {stat.label}
            </p>
            <p className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-950">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-slate-500">{stat.note}</p>
          </article>
        ))}
      </section>

      <DataTable
        title="Payments"
        description="Provider-level collection totals, commission settlement state, and uploaded proof verification. Select a provider row to inspect the summary."
        rows={rows}
        columns={[
          { key: "id", label: "Provider ID" },
          { key: "provider", label: "Provider" },
          { key: "paymentCount", label: "Bookings" },
          { key: "customer", label: "Customer" },
          { key: "amount", label: "Final Amount Paid" },
          { key: "providerNetAmount", label: "Provider Net" },
          { key: "companyCommissionAmount", label: "Commission" },
          { key: "commissionStatus", label: "Commission Status" },
          { key: "method", label: "Payment Method" },
          { key: "status", label: "Payment Status" },
          { key: "date", label: "Date" },
        ]}
        statusKey="status"
        searchPlaceholder="Search provider, customer, payment method, or payment status..."
        selectedRowId={selectedPayment?.id ?? null}
        onRowClick={(row) => setSelectedPaymentId(String(row.id))}
        emptyMessage="No payment records are available yet."
      />

      {selectedPayment ? (
        <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_rgba(16,24,40,0.08)] backdrop-blur xl:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-950">
                <ReceiptText className="size-5 text-emerald-600" />
                Provider Payment Summary
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedPayment.provider} across {selectedPayment.paymentCount ?? 0} booking{selectedPayment.paymentCount === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {selectedPayment.status}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <DetailStat label="Provider ID" value={selectedPayment.id} />
            <DetailStat label="Customers" value={selectedPayment.customer} />
            <DetailStat label="Provider" value={selectedPayment.provider} />
            <DetailStat label="Final Amount Paid" value={selectedPayment.amount} />
            <DetailStat label="Provider Net Earning" value={selectedPayment.providerNetAmount ?? selectedPayment.amount} />
            <DetailStat
              label="Commission"
              value={selectedPayment.companyCommissionAmount ?? "RM0.00"}
              note={`${selectedPayment.commissionStatus ?? "Unpaid"}${selectedPayment.companyPaidAt ? ` • ${selectedPayment.companyPaidAt}` : ""}`}
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailStat label="Booking Count" value={String(selectedPayment.paymentCount ?? 0)} />
            <DetailStat label="Payment Method" value={selectedPayment.method} />
            <DetailStat label="Payment Status" value={selectedPayment.status} />
            <DetailStat
              label="Commission Status"
              value={selectedPayment.commissionStatus ?? "Unpaid"}
              note={`${selectedPayment.unpaidRawIds?.length ?? 0} pending settlement row${selectedPayment.unpaidRawIds?.length === 1 ? "" : "s"}`}
            />
          </div>

          <div className="mt-6">
            <ProofPreviewCard
              title="Payment Proof"
              asset={selectedPayment.providerCompanyPaymentProof ?? selectedPayment.customerPaymentProof}
            />
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Provider to company settlement</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review the uploaded payment slip, then mark this provider summary as paid so all pending commission rows under this provider are settled.
                </p>
                {!companyProofUploaded ? (
                  <p className="mt-2 text-sm text-amber-700">
                    The provider has not uploaded a company payment slip yet.
                  </p>
                ) : null}
                {approvalError ? (
                  <p className="mt-2 text-sm text-rose-600">{approvalError}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void handleApprovePayment()}
                disabled={approvalPending || isCommissionPaid || !companyProofUploaded || !session?.access_token}
                className={`inline-flex min-w-[180px] items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  approvalPending || isCommissionPaid || !companyProofUploaded || !session?.access_token
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : "bg-[linear-gradient(135deg,#0f8b3d,#16a34a)] text-white shadow-[0_18px_40px_rgba(15,139,61,0.28)] hover:brightness-105"
                }`}
              >
                {approvalPending
                  ? "Approving..."
                  : isCommissionPaid
                    ? "Marked Paid"
                    : "Approve Provider as Paid"}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
