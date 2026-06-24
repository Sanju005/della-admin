import { Eye } from "lucide-react";
import { MiniStatus, SurfaceCard, TableShell } from "./user-detail-ui";
import type { ProviderTaskDetail } from "../lib/admin-providers";

function isImageProofUrl(value: string | undefined) {
  if (!value?.trim()) {
    return false;
  }

  return /^(https?:\/\/|data:image\/|blob:)/i.test(value.trim());
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

function ProofLinkCard({
  title,
  fileName,
  url,
  mimeType,
  note,
}: {
  title: string;
  fileName?: string;
  url?: string;
  mimeType?: string;
  note?: string;
}) {
  if (!url) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm text-slate-500">No proof uploaded yet.</p>
        {note ? <p className="mt-1 text-[12px] text-slate-400">{note}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-[13px] text-slate-600">{fileName || "Uploaded proof file"}</p>
          {mimeType ? <p className="mt-1 text-[12px] text-slate-400">{mimeType}</p> : null}
          {note ? <p className="mt-1 text-[12px] text-slate-400">{note}</p> : null}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <Eye className="size-4" />
          Open
        </a>
      </div>
      {isImageProofUrl(url) ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <img src={url} alt={fileName || title} className="max-h-56 w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}

export function TaskDetailPanel({
  detail,
  loading,
  title = "Task Detail",
}: {
  detail: ProviderTaskDetail | null;
  loading?: boolean;
  title?: string;
}) {
  if (loading) {
    return (
      <SurfaceCard title={title}>
        <p className="text-sm text-slate-500">Loading task detail...</p>
      </SurfaceCard>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <SurfaceCard title={`${title} - ${detail.bookingId}`}>
      <div className="space-y-4">
        <SummaryStrip
          items={[
            { label: "Booking ID", value: detail.bookingId },
            { label: "Service", value: detail.service },
            { label: "Customer", value: detail.customer },
            { label: "Status", value: detail.status },
            { label: "Amount", value: detail.amount },
            { label: "Start Time", value: detail.scheduledStart, note: "Scheduled start" },
            { label: "End Time", value: detail.scheduledEnd, note: "Scheduled end" },
            { label: "Mode", value: detail.bookingMode },
            { label: "Booked At", value: detail.createdAt, note: "Request created" },
          ]}
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-sm font-semibold text-slate-900">Task Notes</p>
            {detail.notes.map((note) => (
              <div key={note.label}>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">{note.label}</p>
                <p className="mt-1 text-sm text-slate-700">{note.value}</p>
              </div>
            ))}
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Schedule Window</p>
              <p className="mt-1 text-sm text-slate-700">{detail.schedule}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Location</p>
              <p className="mt-1 text-sm text-slate-700">{detail.location}</p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-sm font-semibold text-slate-900">Task Path</p>
            {detail.timeline.length ? (
              detail.timeline.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    {item.status ? <MiniStatus status={item.status} /> : null}
                  </div>
                  <p className="mt-1 text-[13px] text-slate-600">{item.note}</p>
                  <p className="mt-1 text-[12px] text-slate-400">{item.time}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No task timeline found.</p>
            )}
          </div>
        </div>

        <TableShell title="Status History">
          <table className="min-w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-3 font-semibold">From</th>
                <th className="pb-3 font-semibold">To</th>
                <th className="pb-3 font-semibold">Actor</th>
                <th className="pb-3 font-semibold">Note</th>
                <th className="pb-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {detail.statusHistory.length ? (
                detail.statusHistory.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="py-3 text-slate-700">{item.fromStatus}</td>
                    <td className="py-3 text-slate-700">{item.toStatus}</td>
                    <td className="py-3 text-slate-700">
                      <div className="font-medium">{item.actor}</div>
                      <div className="text-xs text-slate-400">{item.actorRole}</div>
                    </td>
                    <td className="py-3 text-slate-700">{item.note}</td>
                    <td className="py-3 text-slate-500">{item.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-sm text-slate-500">No status history found for this task.</td>
                </tr>
              )}
            </tbody>
          </table>
        </TableShell>

        <div className="grid gap-4">
          <TableShell title="Payments">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Gross</th>
                  <th className="pb-3 font-semibold">Provider Net</th>
                  <th className="pb-3 font-semibold">Commission</th>
                  <th className="pb-3 font-semibold">Company Status</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {detail.payments.length ? (
                  detail.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-50">
                      <td className="py-3 text-slate-700">{payment.id}</td>
                      <td className="py-3 text-slate-700">{payment.method}</td>
                      <td className="py-3 text-slate-700">{payment.amount}</td>
                      <td className="py-3 text-slate-700">{payment.providerNetAmount}</td>
                      <td className="py-3 text-slate-700">{payment.companyCommissionAmount}</td>
                      <td className="py-3"><MiniStatus status={payment.companyStatus} /></td>
                      <td className="py-3"><MiniStatus status={payment.status} /></td>
                      <td className="py-3 text-slate-500">{payment.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-4 text-sm text-slate-500">No payment records for this task.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>

          <TableShell title="Reviews">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Reviewer</th>
                  <th className="pb-3 font-semibold">For</th>
                  <th className="pb-3 font-semibold">Rating</th>
                  <th className="pb-3 font-semibold">Comment</th>
                  <th className="pb-3 font-semibold">Reply</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {detail.reviews.length ? (
                  detail.reviews.map((review) => (
                    <tr key={review.id} className="border-b border-slate-50">
                      <td className="py-3 text-slate-700">
                        <div className="font-medium">{review.reviewer}</div>
                        <div className="text-xs text-slate-400">{review.reviewerRole}</div>
                      </td>
                      <td className="py-3 text-slate-700">{review.reviewFor}</td>
                      <td className="py-3 text-slate-700">{review.rating}/5</td>
                      <td className="py-3 text-slate-700">{review.comment}</td>
                      <td className="py-3 text-slate-700">{review.reply ?? "-"}</td>
                      <td className="py-3 text-slate-500">{review.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-sm text-slate-500">No reviews linked to this task yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>

          <TableShell title="Task Notes & Messages">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Sender</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Message</th>
                  <th className="pb-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {detail.messages.length ? (
                  detail.messages.map((message) => (
                    <tr key={message.id} className="border-b border-slate-50">
                      <td className="py-3 text-slate-700">{message.sender}</td>
                      <td className="py-3 text-slate-700">{message.senderRole}</td>
                      <td className="py-3 text-slate-700">{message.message}</td>
                      <td className="py-3 text-slate-500">{message.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-sm text-slate-500">No additional messages for this task.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-sm font-semibold text-slate-900">Task Related Images & Proofs</p>
          {detail.images.length ? (
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              {detail.images.map((image) => (
                <ProofLinkCard
                  key={image.id}
                  title={image.label}
                  fileName={image.fileName}
                  url={image.url}
                  mimeType={image.mimeType}
                />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No task images are stored yet for this booking. When proof files or related uploads exist, they will appear here.</p>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
