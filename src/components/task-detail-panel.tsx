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

function parsePaymentBreakdown(note: string) {
  const marker = "PAYMENT_BREAKDOWN:";
  const markerIndex = note.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const rawJson = note.slice(markerIndex + marker.length).trim();
  const objectStart = rawJson.search(/[\[{]/);
  const objectEnd = Math.max(rawJson.lastIndexOf("}"), rawJson.lastIndexOf("]"));
  const candidate =
    objectStart >= 0 && objectEnd > objectStart ? rawJson.slice(objectStart, objectEnd + 1) : rawJson;

  try {
    const parsed = JSON.parse(candidate);
    const entry = Array.isArray(parsed) ? parsed[0] : parsed;

    if (!entry || typeof entry !== "object") {
      return null;
    }

    const baseAmount = typeof entry.baseAmount === "number" ? entry.baseAmount : null;
    const finalAmount = typeof entry.finalAmount === "number" ? entry.finalAmount : null;
    const additionalCharge = typeof entry.additionalCharge === "number" ? entry.additionalCharge : null;
    const discountAmount = typeof entry.discountAmount === "number" ? entry.discountAmount : null;
    const noteText = typeof entry.note === "string" ? entry.note.trim() : "";

    return {
      baseAmount,
      finalAmount,
      additionalCharge,
      discountAmount,
      noteText,
    };
  } catch {
    return null;
  }
}

function formatTimelineNote(note: string) {
  const breakdown = parsePaymentBreakdown(note);

  if (!breakdown) {
    return {
      primary: note,
      secondary: [] as string[],
    };
  }

  const secondary = [
    breakdown.baseAmount !== null ? `Base amount: RM${breakdown.baseAmount.toFixed(2)}` : "",
    breakdown.additionalCharge !== null ? `Additional charge: RM${breakdown.additionalCharge.toFixed(2)}` : "",
    breakdown.discountAmount !== null ? `Discount: RM${breakdown.discountAmount.toFixed(2)}` : "",
    breakdown.finalAmount !== null ? `Final amount: RM${breakdown.finalAmount.toFixed(2)}` : "",
  ].filter(Boolean);

  return {
    primary: breakdown.noteText || "Provider accepted the booking and shared the payment breakdown.",
    secondary,
  };
}

function PathCard({
  title,
  status,
  note,
  time,
  children,
}: {
  title: string;
  status?: string;
  note: string;
  time?: string;
  children?: React.ReactNode;
}) {
  const formatted = formatTimelineNote(note);

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {status ? <MiniStatus status={status} /> : null}
      </div>
      <p className="mt-1 text-[13px] text-slate-600">{formatted.primary}</p>
      {formatted.secondary.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {formatted.secondary.map((item) => (
            <span key={item} className="rounded-full bg-slate-50 px-2.5 py-1 text-[12px] text-slate-600">
              {item}
            </span>
          ))}
        </div>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
      {time ? <p className="mt-2 text-[12px] text-slate-400">{time}</p> : null}
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
        <p className="mt-2 text-sm text-slate-500">No image uploaded.</p>
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

function EmptyPathState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-500">
      {message}
    </div>
  );
}

function findTimelineStep(detail: ProviderTaskDetail, matcher: (item: ProviderTaskDetail["timeline"][number]) => boolean) {
  return detail.timeline.find(matcher) ?? null;
}

function latestValue(values: Array<string | undefined>) {
  return values.find((value) => Boolean(value?.trim())) ?? undefined;
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

  const completionImages = detail.images.filter((image) => /completion|completed|job|work|service/i.test(image.label));
  const paymentImages = detail.images.filter((image) => /payment|proof|receipt|cash/i.test(image.label));
  const customerReviews = detail.reviews.filter((review) => review.reviewerRole.toLowerCase() === "customer");
  const providerReviews = detail.reviews.filter((review) => review.reviewerRole.toLowerCase() === "provider");
  const createdStep = findTimelineStep(detail, (item) => item.title.toLowerCase().includes("booking created"));
  const acceptedStep = findTimelineStep(detail, (item) => item.title.toLowerCase().includes("accepted"));
  const onTheWayStep = findTimelineStep(detail, (item) => item.title.toLowerCase().includes("on the way"));
  const arrivedStep = findTimelineStep(detail, (item) => item.title.toLowerCase().includes("arrived"));
  const completedStep = findTimelineStep(detail, (item) => item.title.toLowerCase().includes("completed"));
  const paymentStep = findTimelineStep(
    detail,
    (item) => item.title.toLowerCase().includes("payment") || item.title.toLowerCase().includes("paid")
  );
  const reviewStep = findTimelineStep(detail, (item) => item.title.toLowerCase().includes("review"));
  const hasCompletionState = ["completed", "paid", "reviewed"].includes(detail.status.trim().toLowerCase());
  const hasPaymentReceivedState =
    detail.payments.length > 0 &&
    detail.payments.some((payment) => payment.status.trim().toLowerCase() === "paid");
  const latestPaymentTime = latestValue(detail.payments.map((payment) => payment.createdAt));
  const latestCustomerReviewTime = latestValue(customerReviews.map((review) => review.createdAt));
  const latestProviderReviewTime = latestValue(providerReviews.map((review) => review.createdAt));

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
              <div className="space-y-3">
                <PathCard
                  title="User Sent Request"
                  status="Created"
                  note={`Customer ${detail.customer} created the booking request for ${detail.service}.`}
                  time={createdStep?.time ?? detail.createdAt}
                />

                <PathCard
                  title="Provider On The Way"
                  status={onTheWayStep?.status ?? "On The Way"}
                  note={onTheWayStep?.note ?? "Provider started travelling to the task location."}
                  time={onTheWayStep?.time}
                />

                <PathCard
                  title="Provider Arrived"
                  status={arrivedStep?.status ?? "Arrived"}
                  note={arrivedStep?.note ?? "Provider arrived at the task location."}
                  time={arrivedStep?.time}
                />

                <PathCard
                  title="Provider Sent Final Amount With Task Completion Images"
                  status={acceptedStep?.status ?? completedStep?.status ?? "Accepted"}
                  note={
                    acceptedStep?.note ||
                    completedStep?.note ||
                    "Provider sent the final amount and completion update for the task."
                  }
                  time={acceptedStep?.time ?? completedStep?.time}
                >
                  {completionImages.length ? (
                    <div className="grid gap-3 xl:grid-cols-2">
                      {completionImages.map((image) => (
                        <ProofLinkCard
                          key={image.id}
                          title={image.label}
                          fileName={image.fileName}
                          url={image.url}
                          mimeType={image.mimeType}
                          note="Job completion image"
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyPathState message="No completion images uploaded." />
                  )}
                </PathCard>

                <PathCard
                  title="User Agreed And Paid With Attached Payment Slip"
                  status={paymentStep?.status ?? (detail.payments.length ? "Paid" : "Pending")}
                  note={
                    detail.payments.length
                      ? "User payment details and attached slip are shown below."
                      : "No payment record is linked to this task yet."
                  }
                  time={paymentStep?.time ?? latestPaymentTime}
                >
                  {detail.payments.length ? (
                    <div className="space-y-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        {detail.payments.map((payment) => (
                          <div key={payment.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                            <p className="text-sm font-semibold text-slate-900">{payment.id}</p>
                            <p className="mt-1 text-[13px] text-slate-600">
                              {payment.method} • {payment.amount}
                            </p>
                            <p className="mt-1 text-[12px] text-slate-500">
                              Provider net: {payment.providerNetAmount} • Commission: {payment.companyCommissionAmount}
                            </p>
                            <p className="mt-1 text-[12px] text-slate-500">
                              Payment: {payment.status} • Company: {payment.companyStatus}
                            </p>
                          </div>
                        ))}
                      </div>
                      {paymentImages.length ? (
                        <div className="grid gap-3 xl:grid-cols-2">
                          {paymentImages.map((image) => (
                            <ProofLinkCard
                              key={image.id}
                              title={image.label}
                              fileName={image.fileName}
                              url={image.url}
                              mimeType={image.mimeType}
                              note="Payment slip image"
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyPathState message="No payment slip image uploaded." />
                      )}
                    </div>
                  ) : (
                    <EmptyPathState message="No payment record is linked to this task yet." />
                  )}
                </PathCard>

                <PathCard
                  title="User Review With Images"
                  status={customerReviews.length ? "Reviewed" : "Pending"}
                  note={
                    customerReviews.length
                      ? "Customer review for the provider is linked below."
                      : "Customer review is not linked to this task yet."
                  }
                  time={reviewStep?.time ?? latestCustomerReviewTime}
                >
                  {customerReviews.length ? (
                    <div className="space-y-3">
                      {customerReviews.map((review) => (
                        <div key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {review.reviewer} rated {review.rating}/5
                          </p>
                          <p className="mt-1 text-[13px] text-slate-600">{review.comment}</p>
                          {review.reply ? <p className="mt-1 text-[12px] text-slate-500">Reply: {review.reply}</p> : null}
                          <p className="mt-1 text-[12px] text-slate-400">{review.createdAt}</p>
                          <div className="mt-3">
                            <EmptyPathState message="No review images uploaded." />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyPathState message="No review images uploaded." />
                  )}
                </PathCard>

                <PathCard
                  title="Provider Marked Payment Received"
                  status={hasPaymentReceivedState ? "Paid" : "Pending"}
                  note={
                    hasPaymentReceivedState
                      ? "Provider marked the user payment as received."
                      : "Provider has not marked payment as received yet."
                  }
                  time={latestPaymentTime}
                />

                <PathCard
                  title="Provider Gave Review To User"
                  status={providerReviews.length ? "Reviewed" : "Pending"}
                  note={
                    providerReviews.length
                      ? "Provider review for the customer is linked below."
                      : "Provider review is not linked to this task yet."
                  }
                  time={latestProviderReviewTime}
                >
                  {providerReviews.length ? (
                    <div className="space-y-3">
                      {providerReviews.map((review) => (
                        <div key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {review.reviewer} rated {review.rating}/5
                          </p>
                          <p className="mt-1 text-[13px] text-slate-600">{review.comment}</p>
                          {review.reply ? <p className="mt-1 text-[12px] text-slate-500">Reply: {review.reply}</p> : null}
                          <p className="mt-1 text-[12px] text-slate-400">{review.createdAt}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyPathState message="No provider review uploaded." />
                  )}
                </PathCard>

                <PathCard
                  title="Task Completed"
                  status={hasCompletionState ? "Completed" : detail.status}
                  note={
                    hasCompletionState
                      ? "Task workflow is completed."
                      : "Task is still in progress."
                  }
                  time={completedStep?.time ?? latestValue([latestProviderReviewTime, latestCustomerReviewTime, latestPaymentTime])}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">No task timeline found.</p>
            )}
          </div>
        </div>

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
            <p className="mt-2 text-sm text-slate-500">
              No images uploaded.
            </p>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
