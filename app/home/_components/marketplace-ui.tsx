import Link from "next/link";
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  CircleUserRound,
  CookingPot,
  House,
  MessageCircleMore,
  Search,
  SprayCan,
  UserRound,
  Wrench,
  Baby,
  CarFront,
  Bolt,
  Heart,
  CalendarDays,
} from "lucide-react";
import { BottomNav, EmptyState, ProviderCard as SharedProviderCard, SectionTitle, StatusBadge } from "@/app/_components/della-ui";

import { LiveLocationChip } from "@/app/_components/live-location-chip";
import type { HomeFeedData, HomeServiceCategory } from "@/lib/home-feed";
import {
  buildProviderDetailHref,
  buildProviderPortraitSrc,
} from "@/lib/provider-catalog";

export function MarketplaceScreen({
  greetingName,
  locationLabel,
  categories,
  popularChefProviders,
  popularElectricianProviders,
  popularMaidProviders,
  upcomingBooking,
  errorMessage,
}: HomeFeedData) {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f6fff8]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white px-5 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="relative min-h-[100dvh] bg-white py-5 pb-28">
          <div className="pointer-events-none absolute right-[-12%] top-[-2%] h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(187,247,208,0.7),_transparent_68%)]" />

          <header className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[28px] font-extrabold leading-none tracking-[-0.06em] text-[#16A34A]">
                  DELLA
                </p>
                <h1 className="mt-7 text-[28px] font-extrabold leading-[1.12] tracking-[-0.05em] text-[#0F172A]">
                  {timePrefix()}{" "}
                  <span className="inline-flex items-center gap-1">
                    {greetingName} <span aria-hidden>👋</span>
                  </span>
                </h1>
                <div className="mt-3">
                  <LiveLocationChip fallbackLabel={locationLabel} />
                </div>
              </div>

              <button
                type="button"
                aria-label="Notifications"
                className="relative mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0F172A]"
              >
                <Bell className="h-7 w-7 stroke-[2.2]" />
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
              </button>
            </div>

            <div className="mt-6 flex h-[58px] items-center rounded-[20px] border border-[#DFE7E2] bg-white px-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <Search className="h-6 w-6 text-[#0F172A]" />
              <input
                type="text"
                placeholder="What service do you need today?"
                className="ml-4 h-full flex-1 border-0 bg-transparent text-[16px] text-[#0F172A] outline-none placeholder:text-[#667085]"
              />
            </div>
          </header>

          <section className="mt-8 rounded-[26px] border border-[#E8EEE9] bg-white px-4 py-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-4 gap-y-6">
                {categories.map((category) => (
                  <CategoryItem key={category.key} category={category} />
                ))}
              </div>
            </section>

          {errorMessage ? (
            <div className="mt-6 rounded-[18px] border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#B42318]">
              {errorMessage}
            </div>
          ) : null}

          <ProviderSliderSection
            title="Popular chef nearby you"
            href="/providers?service=chef"
            providers={popularChefProviders}
          />

          <ProviderSliderSection
            title="Popular electrician nearby you"
            href="/providers?service=electrician"
            providers={popularElectricianProviders}
          />

          <ProviderSliderSection
            title="Popular maids nearby you"
            href="/providers?service=maid"
            providers={popularMaidProviders}
          />

          <section className="mt-8">
            <SectionTitle
              title="Upcoming booking"
              action={
                <Link
                  href="/profile/bookings"
                  className="text-[14px] font-extrabold text-[#16A34A]"
                >
                  See all bookings
                </Link>
              }
            />

            <div className="rounded-[22px] border border-[#E5EBE6] bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              {upcomingBooking ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-[5.4rem] w-[5.4rem] shrink-0 items-center justify-center rounded-[18px] bg-[#EEF9F1] text-[#0F172A]">
                    <House className="h-10 w-10 stroke-[1.7]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[18px] font-extrabold tracking-[-0.03em] text-[#0F172A]">
                      {upcomingBooking.title}
                    </h3>
                    <p className="mt-1 truncate text-[15px] font-semibold text-[#344054]">
                      {upcomingBooking.provider}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[14px] text-[#475467]">
                      <CalendarDays className="h-4 w-4 text-[#16A34A]" />
                      <span className="truncate">{upcomingBooking.scheduleLabel}</span>
                    </div>
                    <div className="mt-3">
                      <StatusBadge label={upcomingBooking.statusLabel} tone="pending" />
                    </div>
                  </div>

                  <Link
                    href="/profile/bookings"
                    className="inline-flex h-12 shrink-0 items-center gap-2 rounded-[16px] border border-[#16A34A] px-5 text-[15px] font-extrabold text-[#16A34A]"
                  >
                    View Details
                    <ChevronRight className="h-4.5 w-4.5" />
                  </Link>
                </div>
              ) : (
                <EmptyState
                  title="No upcoming booking yet"
                  description="Your next confirmed service will appear here for quick access."
                />
              )}
            </div>
          </section>

          <BottomNav
            items={[
              { href: "/home", label: "Home", active: true, icon: <House className="h-5 w-5 stroke-[1.9]" /> },
              { href: "/profile/bookings", label: "Bookings", icon: <BookOpen className="h-5 w-5 stroke-[1.9]" /> },
              { href: "/profile/messages", label: "Messages", icon: <MessageCircleMore className="h-5 w-5 stroke-[1.9]" /> },
              { href: "/profile/favourites", label: "Favourite", icon: <Heart className="h-5 w-5 stroke-[1.9]" /> },
              { href: "/profile", label: "Profile", icon: <CircleUserRound className="h-5 w-5 stroke-[1.9]" /> },
            ]}
          />
        </div>
      </div>
    </main>
  );
}

function ProviderSliderSection({
  title,
  href,
  providers,
}: {
  title: string;
  href: string;
  providers: HomeFeedData["popularProviders"];
}) {
  if (providers.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] font-extrabold tracking-[-0.04em] text-[#0F172A]">
          {title}
        </h2>
        <Link href={href} className="text-[14px] font-extrabold text-[#16A34A]">
          See all
        </Link>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 pb-2">
        <div className="flex gap-4">
          {providers.map((provider) => (
            <div key={`${title}-${provider.id}`} className="w-[15.8rem] shrink-0">
              <SharedProviderCard
                href={buildProviderDetailHref({
                  id: provider.id,
                  serviceKey: provider.serviceKey,
                })}
                name={provider.name}
                service={provider.service}
                priceLabel={provider.priceLabel}
                rating={provider.rating.toFixed(1)}
                reviews={`${provider.reviews} reviews`}
                distanceLabel={`${provider.distanceKm} km away`}
                portraitSrc={buildProviderPortraitSrc({
                  name: provider.name,
                  serviceKey: provider.serviceKey,
                })}
                badge={<StatusBadge label={provider.statusLabel} tone="accepted" />}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryItem({ category }: { category: HomeServiceCategory }) {
  return (
    <Link
      href={`/providers?service=${category.key}`}
      className="flex flex-col items-center text-center"
    >
      <div className="flex h-[3.7rem] w-[3.7rem] items-center justify-center rounded-full bg-[#EEF9F1] text-[#0F172A]">
        <CategoryIcon kind={category.key} />
      </div>
      <p className="mt-3 text-[13px] font-semibold tracking-[-0.02em] text-[#0F172A]">
        {category.label}
      </p>
    </Link>
  );
}

function CategoryIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "chef":
      return <CookingPot className="h-[1.55rem] w-[1.55rem] stroke-[1.8]" />;
    case "maid":
      return <BriefcaseBusiness className="h-[1.55rem] w-[1.55rem] stroke-[1.8]" />;
    case "babysitter":
      return <Baby className="h-[1.55rem] w-[1.55rem] stroke-[1.8]" />;
    case "driver":
      return <CarFront className="h-[1.55rem] w-[1.55rem] stroke-[1.8]" />;
    case "cleaner":
      return <SprayCan className="h-[1.55rem] w-[1.55rem] stroke-[1.8]" />;
    case "tutor":
      return <BookOpen className="h-[1.55rem] w-[1.55rem] stroke-[1.8]" />;
    case "plumber":
      return <Wrench className="h-[1.55rem] w-[1.55rem] stroke-[1.8]" />;
    case "electrician":
      return <Bolt className="h-[1.55rem] w-[1.55rem] stroke-[1.8]" />;
    default:
      return <UserRound className="h-[1.55rem] w-[1.55rem] stroke-[1.8]" />;
  }
}

function timePrefix() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning,";
  }

  if (hour < 18) {
    return "Good afternoon,";
  }

  return "Good evening,";
}
