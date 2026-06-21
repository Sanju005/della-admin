"use client";

import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Filter,
  Heart,
  IdCard,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Star,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import { EmptyState as SharedEmptyState, PageHeader, SectionTitle } from "@/app/_components/della-ui";

import { LiveLocationChip } from "@/app/_components/live-location-chip";

type TabKey = "all" | "live-in" | "part-time" | "full-time";
type SortKey = "popular" | "nearest" | "price-low";
type WorkMode = "Live-in" | "Part-time" | "Full-time";
type ServiceKey =
  | "chef"
  | "maid"
  | "babysitter"
  | "driver"
  | "cleaner"
  | "tutor"
  | "plumber"
  | "electrician"
  | null;

type CatalogScreenListing = {
  id: string;
  name: string;
  providerName?: string;
  serviceKey: Exclude<ServiceKey, null>;
  serviceLabel: string;
  workMode: WorkMode;
  bio: string;
  specialties: string[];
  distanceKm: number;
  rating: number;
  reviews: number;
  hourlyRate: number;
  yearsExperience: string;
  availabilityLabel: string;
  href: string;
  portraitSrc: string;
  isApproved: boolean;
};

type CatalogScreenData = {
  service: ServiceKey;
  serviceLabel: string;
  bannerSrc: string;
  listings: CatalogScreenListing[];
  errorMessage: string | null;
};

const serviceIcons: Partial<
  Record<Exclude<ServiceKey, null>, ComponentType<{ className?: string }>>
> = {
  chef: BriefcaseBusiness,
  maid: UserRound,
  babysitter: UserRound,
  driver: BriefcaseBusiness,
  cleaner: UserRound,
  tutor: BriefcaseBusiness,
  plumber: BriefcaseBusiness,
  electrician: BriefcaseBusiness,
};

export function ProvidersCatalogScreen({ data }: { data: CatalogScreenData }) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("popular");

  const counts = useMemo(
    () => ({
      all: data.listings.length,
      "live-in": data.listings.filter((item) => item.workMode === "Live-in").length,
      "part-time": data.listings.filter((item) => item.workMode === "Part-time").length,
      "full-time": data.listings.filter((item) => item.workMode === "Full-time").length,
    }),
    [data.listings]
  );

  const filteredListings = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    let items = data.listings.filter((listing) => {
      const matchesQuery =
        loweredQuery.length === 0 ||
        listing.name.toLowerCase().includes(loweredQuery) ||
        listing.providerName?.toLowerCase().includes(loweredQuery) ||
        listing.bio.toLowerCase().includes(loweredQuery) ||
        listing.specialties.some((specialty) =>
          specialty.toLowerCase().includes(loweredQuery)
        );

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "live-in" && listing.workMode === "Live-in") ||
        (activeTab === "part-time" && listing.workMode === "Part-time") ||
        (activeTab === "full-time" && listing.workMode === "Full-time");

      return matchesQuery && matchesTab;
    });

    items = [...items].sort((left, right) => {
      if (sortBy === "nearest") return left.distanceKm - right.distanceKm;
      if (sortBy === "price-low") return left.hourlyRate - right.hourlyRate;
      if (right.rating !== left.rating) return right.rating - left.rating;
      return right.reviews - left.reviews;
    });

    return items;
  }, [activeTab, data.listings, query, sortBy]);

  const Icon = data.service
    ? serviceIcons[data.service] ?? BriefcaseBusiness
    : BriefcaseBusiness;
  const serviceLower = (data.serviceLabel || "service").toLowerCase();

  return (
    <main className="min-h-[100dvh] bg-[#f6fff8]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="py-6">
          <header className="flex items-center justify-between gap-3">
            <Link
              href="/home"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f4faf5] text-[#0F172A]"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <LiveLocationChip fallbackLabel="Current location" />
          </header>

          <section className="mt-8">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-[24px] bg-[#EEF9F1] text-[#0F172A] shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:h-28 sm:w-28">
                <Icon className="h-14 w-14 stroke-[1.8]" />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <PageHeader
                  title={data.serviceLabel}
                  subtitle={`Find trusted ${serviceLower} services near you`}
                />
                <div className="mt-4 grid grid-cols-3 gap-3 text-[12px] leading-5 text-[#344054]">
                  <TrustBadge
                    icon={<ShieldCheck className="h-4.5 w-4.5 text-[#16A34A]" />}
                    label="Approval badge after admin review"
                  />
                  <TrustBadge
                    icon={<Star className="h-4.5 w-4.5 fill-[#16A34A] text-[#16A34A]" />}
                    label="Rating & Reviews"
                  />
                  <TrustBadge
                    icon={<BadgeCheck className="h-4.5 w-4.5 text-[#16A34A]" />}
                    label="Secure Booking"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 flex items-center gap-3">
            <div className="flex h-[58px] basis-[70%] items-center rounded-[20px] border border-[#E5ECE7] px-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
              <Search className="h-6 w-6 text-[#0F172A]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${serviceLower} services...`}
                className="ml-4 h-full w-full border-0 bg-transparent text-[16px] text-[#0F172A] outline-none placeholder:text-[#667085]"
              />
            </div>
            <button
              type="button"
              className="inline-flex h-[58px] basis-[30%] items-center justify-center gap-2 rounded-[16px] bg-[#16A34A] px-4 text-[16px] font-extrabold text-white"
            >
              <Filter className="h-5 w-5" />
              Filter
            </button>
          </section>

          <section className="mt-6 overflow-hidden rounded-[20px] border border-[#E5ECE7] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="grid grid-cols-4">
              <TabButton
                active={activeTab === "all"}
                onClick={() => setActiveTab("all")}
                label="All"
                count={counts.all}
              />
              <TabButton
                active={activeTab === "live-in"}
                onClick={() => setActiveTab("live-in")}
                label="Live-in"
                count={counts["live-in"]}
              />
              <TabButton
                active={activeTab === "part-time"}
                onClick={() => setActiveTab("part-time")}
                label="Part-time"
                count={counts["part-time"]}
              />
              <TabButton
                active={activeTab === "full-time"}
                onClick={() => setActiveTab("full-time")}
                label="Full-time"
                count={counts["full-time"]}
              />
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-[18px] bg-[linear-gradient(90deg,#F5FFF8_0%,#F0FFF5_50%,#E3F8EA_100%)] px-4 py-4 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#DFF6E7] text-[#16A34A]">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-extrabold tracking-[-0.03em] text-[#17803D]">
                  Approved listings only
                </h2>
                <p className="mt-1.5 text-[13px] leading-5 text-[#475467]">
                  Customers only see providers after admin approval and verification.
                </p>
              </div>
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[16px]">
                <Image
                  src={data.bannerSrc}
                  alt={`${data.serviceLabel} banner`}
                  width={192}
                  height={192}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </section>

          {data.errorMessage ? (
            <div className="mt-5 rounded-[18px] border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#B42318]">
              {data.errorMessage}
            </div>
          ) : null}

          <section className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SectionTitle title={`${filteredListings.length} ${data.serviceLabel} services found`} />
              <label className="flex items-center gap-3 text-[14px] text-[#475467]">
                <span>Sort by</span>
                <span className="relative">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortKey)}
                    className="h-12 appearance-none rounded-[14px] border border-[#E5ECE7] bg-white pl-4 pr-10 text-[15px] font-semibold text-[#344054] outline-none"
                  >
                    <option value="popular">Popular</option>
                    <option value="nearest">Nearest</option>
                    <option value="price-low">Lowest price</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475467]" />
                </span>
              </label>
            </div>

            <div className="mt-5 space-y-4">
              {filteredListings.length === 0 ? (
                <SharedEmptyState
                  title="No providers matched this filter"
                  description="Try a different keyword, work mode, or sort option to see more nearby providers."
                />
              ) : null}
              {filteredListings.map((listing) => (
                <ProviderCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function TrustBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="inline-flex min-w-0 items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 px-2 py-4 text-center ${
        active ? "shadow-[inset_0_-3px_0_#16A34A]" : ""
      }`}
    >
      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
        <span
          className={`text-[11px] font-extrabold tracking-[-0.02em] ${
            active ? "text-[#16A34A]" : "text-[#0F172A]"
          }`}
        >
          {label}
        </span>
        <span
          className={`inline-flex min-w-[1.7rem] items-center justify-center rounded-full px-1.5 py-1 text-[10px] font-bold leading-none ${
            active ? "bg-[#16A34A] text-white" : "bg-[#F1F4F2] text-[#667085]"
          }`}
        >
          {count}
        </span>
      </div>
    </button>
  );
}

function ProviderCard({ listing }: { listing: CatalogScreenListing }) {
  return (
    <article className="rounded-[22px] border border-[#E7ECE8] bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <div className="flex gap-4">
        <div className="relative h-[11rem] w-[7.6rem] shrink-0 overflow-hidden rounded-[20px]">
          <Image
            src={listing.portraitSrc}
            alt={listing.name}
            width={320}
            height={352}
            unoptimized
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-3 left-2.5 rounded-[10px] bg-[#16A34A] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(22,163,74,0.22)]">
            {listing.availabilityLabel}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="flex min-w-0 items-center gap-2 text-[15px] font-extrabold tracking-[-0.03em] text-[#0F172A]">
                <span className="truncate">{listing.name}</span>
                {listing.isApproved ? (
                  <BadgeCheck className="h-4.5 w-4.5 shrink-0 fill-[#16A34A] text-[#16A34A]" />
                ) : null}
              </h3>
              {listing.providerName && listing.providerName !== listing.name ? (
                <p className="mt-1 truncate text-[12px] font-semibold text-[#16A34A]">
                  {listing.providerName}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#475467]">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                  <span className="font-semibold text-[#0F172A]">
                    {listing.rating.toFixed(1)}
                  </span>
                  <span>({listing.reviews})</span>
                </span>
                <span className="text-[#D0D5DD]">|</span>
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5 fill-[#16A34A] text-[#16A34A]" />
                  <span className="font-semibold text-[#0F172A]">98%</span>
                  <span>(On-time)</span>
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1 text-[13px] text-[#475467]">
                <MapPin className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>{listing.distanceKm} km away</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#EEF9F1] px-3 py-1.5 text-[12px] font-semibold text-[#16A34A]">
                  {listing.yearsExperience} Experience
                </span>
                <span className="rounded-full bg-[#F4F5F7] px-3 py-1.5 text-[12px] font-semibold text-[#667085]">
                  {listing.specialties[0] ?? listing.workMode}
                </span>
              </div>
            </div>

            <button
              type="button"
              aria-label="Save provider"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#EEF2EF] bg-white text-[#667085] shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
            >
              <Heart className="h-5.5 w-5.5" />
            </button>
          </div>
        </div>
      </div>

      {listing.isApproved ? (
        <div className="mt-4 border-t border-[#E9EEEA] pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-[16px] bg-[#F8FCF9] px-3 py-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF9F1] text-[#16A34A]">
                <IdCard className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#98A2B3]">
                  Verified
                </p>
                <p className="text-[12px] font-semibold text-[#0F172A]">
                  ID Verified
                </p>
              </div>
              <BadgeCheck className="h-4.5 w-4.5 shrink-0 fill-[#16A34A] text-[#16A34A]" />
            </div>

            <div className="flex items-center gap-2 rounded-[16px] bg-[#F8FCF9] px-3 py-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF9F1] text-[#16A34A]">
                <Phone className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#98A2B3]">
                  Contact
                </p>
                <p className="text-[12px] font-semibold text-[#0F172A]">
                  Phone Verified
                </p>
              </div>
              <BadgeCheck className="h-4.5 w-4.5 shrink-0 fill-[#16A34A] text-[#16A34A]" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#E9EEEA] pt-4">
        <div className="min-w-0">
          <p className="text-[13px] text-[#667085]">From</p>
          <p className="mt-1 text-[20px] font-extrabold tracking-[-0.03em] text-[#16A34A]">
            RM{listing.hourlyRate}/hr
          </p>
        </div>
        <Link
          href={listing.href}
          className="inline-flex h-12 min-w-[9.5rem] items-center justify-center gap-2 rounded-[16px] bg-[#16A34A] px-5 text-[14px] font-extrabold text-white shadow-[0_10px_24px_rgba(22,163,74,0.22)]"
        >
          View Profile
          <ChevronRight className="h-4.5 w-4.5" />
        </Link>
      </div>
    </article>
  );
}
