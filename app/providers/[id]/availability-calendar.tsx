"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, ChevronRight, X } from "lucide-react";

import type { ProviderAvailabilitySlot } from "@/lib/provider-detail";

type AvailabilityCalendarProps = {
  providerId: string;
  serviceQuery: string | null;
  slots: ProviderAvailabilitySlot[];
};

export function AvailabilityCalendar({
  providerId,
  serviceQuery,
  slots,
}: AvailabilityCalendarProps) {
  const selectedDefault = useMemo(
    () => slots.find((slot) => slot.state === "available") ?? slots[0],
    [slots]
  );
  const [selectedSlot, setSelectedSlot] = useState(selectedDefault);

  const nextAvailable = useMemo(
    () => slots.find((slot) => slot.state === "available") ?? slots[0],
    [slots]
  );

  const selectedDateLabel = `${selectedSlot.dayLabel}, ${selectedSlot.dateLabel}`;
  const bookHref = serviceQuery
    ? `/providers/${encodeURIComponent(providerId)}/book?service=${encodeURIComponent(serviceQuery)}&date=${encodeURIComponent(selectedDateLabel)}`
    : `/providers/${encodeURIComponent(providerId)}/book?date=${encodeURIComponent(selectedDateLabel)}`;

  return (
    <section className="mt-5 rounded-[20px] border border-[#E6ECE7] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <h2 className="text-[15px] font-extrabold text-[#0F172A]">
        Available This Week
      </h2>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {slots.map((slot) => {
          const isAvailable = slot.state === "available";
          const isSelected =
            selectedSlot.dayLabel === slot.dayLabel &&
            selectedSlot.dateLabel === slot.dateLabel;

          return (
            <button
              key={`${slot.dayLabel}-${slot.dateLabel}`}
              type="button"
              disabled={!isAvailable}
              onClick={() => setSelectedSlot(slot)}
              className={`rounded-[14px] px-1 py-2 text-center ${
                isSelected ? "bg-[#F3FFF5]" : "bg-transparent"
              } ${!isAvailable ? "opacity-80" : ""}`}
            >
              <p className="text-[11px] font-semibold text-[#344054]">
                {slot.dayLabel}
              </p>
              <div
                className={`mx-auto mt-2 inline-flex h-9 w-9 items-center justify-center rounded-full ${
                  isAvailable ? "bg-[#DFF7E7] text-[#16A34A]" : "bg-[#FDECEC] text-[#EF4444]"
                }`}
              >
                {isAvailable ? <Check className="h-4.5 w-4.5" /> : <X className="h-4.5 w-4.5" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-[#E8ECE8] pt-4">
        <h3 className="text-[14px] font-extrabold text-[#0F172A]">Next Available</h3>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-[16px] bg-[linear-gradient(90deg,#F5FFF8_0%,#EEFDF4_100%)] px-3.5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9F8EE] text-[#16A34A]">
              <CalendarDays className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-extrabold text-[#16A34A]">
                {nextAvailable.dayLabel}, {nextAvailable.timeLabel}
              </p>
              <p className="mt-1 text-[11px] text-[#667085]">{nextAvailable.dateLabel}</p>
            </div>
          </div>

          <Link
            href={bookHref}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[12px] bg-[#16A34A] px-3.5 text-[12px] font-extrabold text-white"
          >
            Book
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
