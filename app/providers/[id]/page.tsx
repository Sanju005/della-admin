import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
  Star,
  Timer,
} from "lucide-react";
import { notFound } from "next/navigation";

import { BookNowButton } from "./book-now-button";
import { getProviderDetail } from "@/lib/provider-detail";

export const dynamic = "force-dynamic";

export default async function ProviderDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const detail = await getProviderDetail(params.id, searchParams.service ?? null);

  if (!detail) {
    notFound();
  }

  return (
    <main className="min-h-[100dvh] bg-[#f6fff8]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="py-4">
          <header className="flex items-center justify-between">
            <Link
              href={searchParams.service ? `/providers?service=${searchParams.service}` : "/providers"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0F172A]"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label="Save provider"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0F172A]"
              >
                <Heart className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Share provider"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0F172A]"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </header>

          <section className="mt-4 flex gap-3">
            <div className="relative h-[10.6rem] w-[8.4rem] shrink-0 overflow-hidden rounded-[22px]">
              <Image
                src={detail.profileImage}
                alt={detail.name}
                width={336}
                height={435}
                unoptimized
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-3 left-3 rounded-full bg-white/94 px-2.5 py-1 shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0F172A]">
                  <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                  Online
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <h1 className="text-[15px] font-extrabold text-[#0F172A]">
                  {detail.name}
                </h1>
                <BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 fill-[#16A34A] text-[#16A34A]" />
              </div>
              <p className="mt-1 text-[13px] text-[#475467]">{detail.title}</p>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12px] text-[#344054]">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                  <span className="font-semibold">{detail.reviewsLabel}</span>
                </span>
                <span className="text-[#98A2B3]">•</span>
                <span>{detail.jobsCompleted} Jobs Completed</span>
              </div>

              <div className="mt-2 flex items-start gap-1.5 text-[12px] leading-5 text-[#475467]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#475467]" />
                <span>{detail.locationFull}</span>
              </div>

              <div className="mt-2 flex items-start gap-1.5 text-[12px] font-semibold text-[#16A34A]">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 rotate-[-45deg]" />
                <span>{detail.distanceKm} km away from you</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-left text-[11px] text-[#344054]">
                <InfoPill icon={<ShieldCheck className="h-4.5 w-4.5 text-[#16A34A]" />} label="Verified" />
                <InfoPill icon={<CheckCheck className="h-4.5 w-4.5 text-[#16A34A]" />} label="Background Checked" />
                <InfoPill icon={<BadgeCheck className="h-4.5 w-4.5 text-[#16A34A]" />} label={detail.yearsExperience} />
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="grid grid-cols-3 gap-2">
              {detail.gallery.map((image, index) => (
                <div
                  key={`${detail.id}-${image.src}`}
                  className="relative h-[8.8rem] overflow-hidden rounded-[16px]"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={256}
                    height={296}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.66)_100%)]" />
                  <p className="absolute bottom-2.5 left-2.5 right-2.5 text-[10px] font-semibold leading-4 text-white">
                    {image.caption}
                  </p>
                  {index === 2 ? (
                    <div className="absolute bottom-2.5 right-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white">
                      +12
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {[0, 1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={`h-2 w-2 rounded-full ${
                    dot === 0 ? "bg-[#16A34A]" : "bg-[#D9DDE3]"
                  }`}
                />
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-[20px] border border-[#E6ECE7] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF9F1] text-[#16A34A]">
                <BadgeCheck className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-[15px] font-extrabold text-[#0F172A]">
                {detail.serviceLabel} Service
              </h2>
            </div>

            <div className="mt-4 rounded-[16px] border border-[#E7ECE7] px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <PriceMetric
                  label="Per Hour Price"
                  value={`RM ${detail.hourlyRate}`}
                  suffix="/ hour"
                  icon={<Timer className="h-4.5 w-4.5 text-[#475467]" />}
                />
                <div className="border-l border-[#E8ECE8] pl-3">
                  <PriceMetric
                    label="Per Day Price"
                    value={`RM ${detail.dailyRate}`}
                    suffix="/ day"
                    icon={<CalendarDays className="h-4.5 w-4.5 text-[#475467]" />}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[13px] font-semibold text-[#0F172A]">Specialities</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.specialties.map((specialty) => (
                  <span
                    key={`${detail.id}-${specialty}`}
                    className="rounded-full bg-[#EEF9F1] px-3 py-1.5 text-[12px] font-medium text-[#16A34A]"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[20px] border border-[#E6ECE7] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-extrabold text-[#0F172A]">
              About {detail.name}
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-[#344054]">{detail.about}</p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 text-[13px] font-bold text-[#16A34A]"
            >
              Read more
              <ChevronDown className="h-4 w-4" />
            </button>
          </section>

          <section className="mt-5 rounded-[20px] border border-[#E6ECE7] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-extrabold text-[#0F172A]">
                  Customer Reviews
                </h2>
                <p className="mt-1 text-[12px] text-[#667085]">
                  Real feedback with ratings and photos
                </p>
              </div>
              <div className="rounded-full bg-[#FFF7E8] px-2.5 py-1 text-[12px] font-bold text-[#B54708]">
                {detail.rating.toFixed(1)} / 5
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {detail.customerReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-[16px] border border-[#E7ECE7] bg-[#FBFCFB] p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold text-[#0F172A]">
                        {review.customerName}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 text-[#F59E0B]">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                              key={`${review.id}-${value}`}
                              className={`h-3.5 w-3.5 ${
                                value <= Math.round(review.rating)
                                  ? "fill-current"
                                  : "text-[#D0D5DD]"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-semibold text-[#344054]">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#98A2B3]">{review.postedLabel}</span>
                  </div>

                  <p className="mt-3 text-[12px] leading-5 text-[#344054]">
                    {review.comment}
                  </p>

                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {review.images.map((image, index) => (
                      <div
                        key={`${review.id}-${index}`}
                        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px]"
                      >
                        <Image
                          src={image}
                          alt={`${review.customerName} review image ${index + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <BookNowButton providerId={detail.id} />
        </div>
      </div>
    </main>
  );
}

function InfoPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="space-y-1.5">
      <div>{icon}</div>
      <p className="leading-4">{label}</p>
    </div>
  );
}

function PriceMetric({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: string;
  suffix: string;
  icon: ReactNode;
}) {
  return (
    <div>
      <p className="text-[12px] text-[#475467]">{label}</p>
      <div className="mt-2.5 flex items-end gap-1.5">
        <p className="text-[16px] font-extrabold text-[#16A34A]">{value}</p>
        <p className="pb-0.5 text-[12px] text-[#344054]">{suffix}</p>
        <span className="ml-auto">{icon}</span>
      </div>
    </div>
  );
}
