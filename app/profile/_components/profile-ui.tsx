"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppButton,
  BookingCard as SharedBookingCard,
  EmptyState as SharedEmptyState,
  MessagePlaceholderCard,
  StatusBadge as SharedStatusBadge,
} from "@/app/_components/della-ui";

import { LiveLocationChip } from "@/app/_components/live-location-chip";
import {
  disablePushNotifications,
  getPushSetupState,
  requestNotificationPermission,
  saveFCMToken,
  type PushSetupState,
} from "@/lib/notifications";
import { getSupabaseClient } from "@/lib/supabase";
import {
  loadSavedPlaces,
  loadStoredLiveLocation,
  resolveCurrentLiveLocation,
  type StoredLiveLocation,
} from "@/lib/live-location";
import { loadStoredCustomerProfile, saveCustomerProfile } from "@/lib/profile-browser";
import type {
  Address,
  Booking,
  BookingStatus,
  CustomerProfile,
  FavoriteProvider,
  NotificationItem,
  PaymentHistoryItem,
  ProfileOverviewData,
  SettingGroup,
} from "@/lib/profile-types";

type ShellProps = {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  backHref?: string;
  showBottomNav?: boolean;
};

type OverviewProps = {
  initialData: ProfileOverviewData;
};

type EditProps = {
  initialProfile: CustomerProfile;
};

type AddressesProps = {
  addresses: Address[];
};

type BookingsProps = {
  bookings: Booking[];
  initialTab?: BookingStatus;
};

type SettingsProps = {
  groups: SettingGroup[];
};

type PaymentsProps = {
  payments: PaymentHistoryItem[];
};

type FavoritesProps = {
  providers: FavoriteProvider[];
};

type NotificationsProps = {
  initialNotifications?: NotificationItem[];
};

type BookingDetailProps = {
  booking: Booking;
};

type BookingReviewProps = {
  booking: Booking;
};

export function ProfileShell({
  children,
  title,
  showBack = false,
  backHref = "/profile",
  showBottomNav = true,
}: ShellProps) {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f6fff8]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-white px-5 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="relative min-h-[100dvh] overflow-hidden bg-white">
          <div className="bg-[#16a34a] px-5 pb-4 pt-5 text-white">
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showBack ? (
                  <Link
                    href={backHref}
                    aria-label="Back"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/95"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </Link>
                ) : null}
                <h1 className="text-[18px] font-extrabold">{title}</h1>
              </div>
              {!showBack ? (
                <Link
                  href="/profile/notifications"
                  aria-label="Notifications"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/95"
                >
                  <BellIcon className="h-5 w-5" />
                </Link>
              ) : <span className="h-8 w-8" aria-hidden />}
            </div>
          </div>

          <div className={showBottomNav ? "px-4 pb-28 pt-4" : "px-4 pb-6 pt-4"}>
            {children}
          </div>

          {showBottomNav ? <BottomNav /> : null}
        </div>
      </div>
    </main>
  );
}

export function ProfileOverviewScreen({ initialData }: OverviewProps) {
  const [profile, setProfile] = useState(
    () => loadStoredCustomerProfile() ?? initialData.profile
  );
  const [bookingSummary, setBookingSummary] = useState(initialData.bookingSummary);
  const [paymentSummary, setPaymentSummary] = useState(initialData.paymentSummary);

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  useEffect(() => {
    let active = true;

    async function loadLiveProfile() {
      const client = getSupabaseClient();

      if (!client) {
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!active || !session) {
        return;
      }

      const response = await fetch("/api/profile/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = (await response.json()) as
        | {
            profile: CustomerProfile;
            bookingSummary: ProfileOverviewData["bookingSummary"];
            paymentSummary: ProfileOverviewData["paymentSummary"];
          }
        | { error?: string };

      if (!active || !response.ok || !("profile" in result)) {
        return;
      }

      setProfile(result.profile);
      setBookingSummary(result.bookingSummary);
      setPaymentSummary(result.paymentSummary);
    }

    void loadLiveProfile();

    return () => {
      active = false;
    };
  }, []);

  return (
    <ProfileShell title="My Profile" showBottomNav>
      <ProfileSummaryCard profile={profile} fullName={fullName} />
      <ProfileCompletion completion={profile.completion} />

      <SectionCard
        title="Personal Information"
        actionHref="/profile/edit"
        actionLabel="View All"
      >
        <ProfileInfoRow icon={<UserIcon className="h-4 w-4" />} label="First Name" value={profile.firstName} />
        <ProfileInfoRow icon={<UserIcon className="h-4 w-4" />} label="Last Name" value={profile.lastName} />
        <ProfileInfoRow icon={<UserIcon className="h-4 w-4" />} label="Sex" value={profile.sex || "-"} />
        <ProfileInfoRow icon={<CalendarIcon className="h-4 w-4" />} label="Date of Birth" value={profile.dateOfBirth} />
        <ProfileInfoRow icon={<MailIcon className="h-4 w-4" />} label="Email" value={profile.email} />
        <ProfileInfoRow icon={<PhoneIcon className="h-4 w-4" />} label="Phone Number" value={`${profile.countryCode} ${profile.phoneNumber}`} />
      </SectionCard>

      <SectionCard
        title="My Bookings"
        actionHref="/profile/bookings"
        actionLabel="View All"
      >
        <ProfileInfoRow icon={<CalendarIcon className="h-4 w-4" />} label="Upcoming Bookings" value={String(bookingSummary.upcoming)} valueTone="green" href="/profile/bookings?tab=upcoming" />
        <ProfileInfoRow icon={<CheckCircleIcon className="h-4 w-4" />} label="Completed Bookings" value={String(bookingSummary.completed)} valueTone="green" href="/profile/bookings?tab=completed" />
        <ProfileInfoRow icon={<CloseCircleIcon className="h-4 w-4" />} label="Cancelled Bookings" value={String(bookingSummary.cancelled)} valueTone="green" href="/profile/bookings?tab=cancelled" />
      </SectionCard>

      <SectionCard
        title="Favourite Providers"
        actionHref="/profile/favourites"
        actionLabel="View All"
      >
        <div className="flex items-start justify-between gap-3">
          {initialData.favoriteProviders.map((provider) => (
            <div key={provider.id} className="flex flex-1 flex-col items-center text-center">
              <AvatarCircle
                initials={provider.initials}
                size="md"
                accent={provider.accent}
              />
              <p className="mt-2 text-[13px] font-bold text-[#111827]">
                {provider.name}
              </p>
              <p className="text-[12px] text-[#6b7280]">{provider.role}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Payment Methods" actionLabel="Manage">
        {initialData.paymentMethods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between border-t border-[#edf1ef] px-0 py-3 first:border-t-0 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eff9f0] text-[#16a34a]">
                <WalletIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#111827]">
                  {method.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              {method.isDefault ? (
                <span className="rounded-full bg-[#e9f9ec] px-2 py-1 text-[11px] font-bold text-[#16a34a]">
                  Default
                </span>
              ) : null}
              <p className="mt-1 text-[12px] text-[#6b7280]">{method.type}</p>
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="Payment"
        actionHref="/profile/payments"
        actionLabel="View All"
      >
        <ProfileInfoRow
          icon={<WalletIcon className="h-4 w-4" />}
          label="Total Paid"
          value={`RM${paymentSummary.totalPaid}`}
          valueTone="green"
        />
        <ProfileInfoRow
          icon={<CalendarIcon className="h-4 w-4" />}
          label="Latest Payment"
          value={paymentSummary.lastPaymentLabel}
        />
      </SectionCard>
    </ProfileShell>
  );
}

export function FavoritesScreen({ providers }: FavoritesProps) {
  const [items, setItems] = useState(providers);

  return (
    <ProfileShell title="Favourite Providers" showBack backHref="/profile">
      <div className="space-y-4">
        {items.map((provider) => (
          <div
            key={provider.id}
            className="rounded-[18px] border border-[#e4ece7] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start gap-4">
              <div className="relative h-[5.6rem] w-[5.6rem] shrink-0 overflow-hidden rounded-full">
                {provider.portraitSrc ? (
                  <Image
                    src={provider.portraitSrc}
                    alt={provider.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <AvatarCircle
                    initials={provider.initials}
                    size="lg"
                    accent={provider.accent}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-extrabold text-[#111827]">
                      {provider.name}
                    </h2>
                    <p className="mt-1 text-[13px] font-semibold text-[#16a34a]">
                      {provider.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${provider.name} from favourites`}
                    onClick={() =>
                      setItems((current) =>
                        current.filter((item) => item.id !== provider.id)
                      )
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f1] text-[#ef4444]"
                  >
                    <FavoriteHeartIcon className="h-5 w-5 fill-current" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] text-[#4b5563]">
                  <p>
                    Rating:{" "}
                    <span className="font-semibold text-[#111827]">
                      {provider.rating?.toFixed(1) ?? "4.8"}
                    </span>
                  </p>
                  <p>
                    From:{" "}
                    <span className="font-semibold text-[#111827]">
                      {provider.priceLabel ?? "RM200"}
                    </span>
                  </p>
                  <p className="col-span-2">
                    Location:{" "}
                    <span className="font-semibold text-[#111827]">
                      {provider.location ?? "Kuala Lumpur"}
                    </span>
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link
                    href={provider.bookHref ?? "/profile/favourites"}
                    className="inline-flex h-10 items-center justify-center rounded-[12px] bg-[#16a34a] px-4 text-[13px] font-extrabold text-white shadow-[0_12px_24px_rgba(22,163,74,0.18)]"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#d9e2dd] bg-white px-4 py-8 text-center text-[14px] text-[#6b7280]">
            No favourite providers left.
          </div>
        ) : null}
      </div>
    </ProfileShell>
  );
}

export function EditProfileScreen({ initialProfile }: EditProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState("");
  const [form, setForm] = useState(() => loadStoredCustomerProfile() ?? initialProfile);

  useEffect(() => {
    let active = true;

    async function loadLiveProfile() {
      const client = getSupabaseClient();

      if (!client) {
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!active || !session) {
        return;
      }

      const response = await fetch("/api/profile/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = (await response.json()) as
        | {
            profile: CustomerProfile;
          }
        | { error?: string };

      if (!active || !response.ok || !("profile" in result)) {
        return;
      }

      setForm(result.profile);
    }

    void loadLiveProfile();

    return () => {
      active = false;
    };
  }, []);

  const updateField =
    (field: keyof CustomerProfile) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await saveCustomerProfile(form);
      setSavedMessage(
        result.mode === "supabase"
          ? "Saved to profile backend."
          : "Saved for preview on this device."
      );
      window.setTimeout(() => {
        router.push("/profile");
      }, 500);
    });
  };

  return (
    <ProfileShell title="Edit Personal Information" showBack backHref="/profile">
      <form onSubmit={handleSave}>
        <div className="mb-5 flex flex-col items-center">
          <div className="relative">
            <AvatarCircle
              initials={`${form.firstName[0] ?? "S"}${form.lastName[0] ?? "K"}`}
              size="xl"
              accent="from-emerald-500 to-green-700"
            />
            <span className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#16a34a] text-white shadow-[0_8px_18px_rgba(22,163,74,0.22)]">
              <CameraIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-[13px] text-[#4b5563]">Change Profile Photo</p>
        </div>

        <div className="space-y-4">
          <LabeledInput label="First Name" value={form.firstName} onChange={updateField("firstName")} icon={<UserIcon className="h-5 w-5" />} />
          <LabeledInput label="Last Name" value={form.lastName} onChange={updateField("lastName")} icon={<UserIcon className="h-5 w-5" />} />
          <LabeledSelect
            label="Sex"
            value={form.sex}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sex: event.target.value as CustomerProfile["sex"],
              }))
            }
            icon={<UserIcon className="h-5 w-5" />}
            options={["Male", "Female"]}
          />
          <LabeledInput label="Date of Birth" value={form.dateOfBirth} onChange={updateField("dateOfBirth")} icon={<CalendarIcon className="h-5 w-5" />} rightIcon={<CalendarIcon className="h-5 w-5" />} />
          <LabeledInput label="Email" value={form.email} onChange={updateField("email")} icon={<MailIcon className="h-5 w-5" />} />
          <div>
            <p className="mb-2 text-[14px] font-semibold text-[#111827]">Phone Number</p>
            <div className="flex gap-2.5">
              <div className="flex h-11 w-[6.2rem] items-center rounded-[12px] border border-[#d9e2dd] px-3 text-[14px] text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                <MalaysiaFlagIcon className="mr-2 h-4 w-6 rounded-[3px]" />
                <span>{form.countryCode}</span>
                <ChevronDownIcon className="ml-auto h-4 w-4 text-[#6b7280]" />
              </div>
              <div className="flex flex-1 items-center rounded-[12px] border border-[#d9e2dd] px-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                <input
                  value={form.phoneNumber}
                  onChange={updateField("phoneNumber")}
                  className="h-11 w-full border-0 bg-transparent text-[14px] text-[#111827] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {savedMessage ? (
          <p className="mt-4 text-center text-[13px] font-semibold text-[#16a34a]">
            {savedMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-[#16a34a] text-[15px] font-extrabold text-white shadow-[0_16px_30px_rgba(22,163,74,0.22)]"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </ProfileShell>
  );
}

export function AddressesScreen({ addresses }: AddressesProps) {
  return (
    <ProfileShell title="Saved Addresses" showBack backHref="/profile">
      <div className="space-y-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="rounded-[18px] border border-[#e4ece7] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eff9f0] text-[#16a34a]">
                <AddressKindIcon kind={address.kind} className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-extrabold text-[#111827]">
                      {address.label}
                    </h3>
                    {address.isDefault ? (
                      <span className="rounded-full bg-[#e9f9ec] px-2 py-1 text-[11px] font-bold text-[#16a34a]">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label="Address options"
                    className="text-[#6b7280]"
                  >
                    <DotsVerticalIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-2 text-[14px] leading-6 text-[#374151]">
                  {address.line1}
                  <br />
                  {address.line2}
                  <br />
                  {address.city}
                  {address.state ? `, ${address.state}` : ""}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#3ec66d] bg-[#fbfffc] text-[15px] font-extrabold text-[#16a34a]"
      >
        <PlusIcon className="h-4 w-4" />
        Add New Address
      </button>
    </ProfileShell>
  );
}

export function BookingsScreen({ bookings, initialTab = "upcoming" }: BookingsProps) {
  const [items, setItems] = useState(bookings);
  const [activeTab, setActiveTab] = useState<BookingStatus>(initialTab);

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();

    async function loadLiveBookings() {
      if (!client) {
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!active || !session) {
        return;
      }

      const response = await fetch("/api/bookings", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = (await response.json()) as
        | { bookings: Booking[] }
        | { error?: string };

      if (!active || !response.ok || !("bookings" in result)) {
        return;
      }

      setItems(result.bookings);
    }

    void loadLiveBookings();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () => items.filter((booking) => booking.status === activeTab),
    [activeTab, items]
  );

  return (
    <ProfileShell title="My Bookings" showBack backHref="/profile">
      <div className="mb-4 flex items-center justify-between border-b border-[#edf1ef] px-2 text-[14px] font-semibold text-[#6b7280]">
        {(["upcoming", "completed", "cancelled"] as BookingStatus[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-2 pb-3 pt-1 capitalize ${
              activeTab === tab
                ? "border-[#16a34a] text-[#16a34a]"
                : "border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <SharedEmptyState
            title={`No ${activeTab} bookings yet`}
            description="When you create or finish bookings, they will appear here with live status updates."
            action={<AppButton href="/providers">Find Providers</AppButton>}
          />
        ) : null}
        {filtered.map((booking) => (
          <SharedBookingCard
            key={booking.id}
            title={booking.service}
            provider={booking.provider}
            schedule={booking.schedule}
            location={booking.location}
            statusLabel={booking.statusLabel}
            statusTone={bookingTone(booking)}
            image={<BookingThumb kind={booking.thumbnail} imageSrc={booking.imageSrc} service={booking.service} />}
            notes={
              booking.status === "cancelled" ? (
                <div className="space-y-1.5 rounded-[14px] bg-[#f8fafc] px-3 py-2.5 text-[12px] leading-5 text-[#475569]">
                  <p>
                    <span className="font-extrabold text-[#111827]">Cancelled by:</span>{" "}
                    {booking.cancelledBy ?? "Not specified"}
                  </p>
                  <p>
                    <span className="font-extrabold text-[#111827]">Reason:</span>{" "}
                    {booking.cancellationReason ?? "No reason shared."}
                  </p>
                </div>
              ) : undefined
            }
            secondaryAction={
              booking.status === "upcoming" ? (
                <AppButton href="/profile/messages" tone="secondary" className="flex-1">
                  Message
                </AppButton>
              ) : undefined
            }
            primaryAction={
              booking.status === "upcoming" ? (
                <AppButton href={`/profile/bookings/${booking.id}`} className="flex-1">
                  See Details
                </AppButton>
              ) : booking.status === "completed" ? (
                <AppButton href={`/profile/bookings/${booking.id}/review`}>
                  Review
                </AppButton>
              ) : undefined
            }
          />
        ))}
      </div>

      <AppButton
        type="button"
        className="mt-5 w-full"
      >
        View All Bookings
      </AppButton>
    </ProfileShell>
  );
}

export function SettingsScreen({ groups }: SettingsProps) {
  return (
    <ProfileShell title="Settings" showBack backHref="/profile" showBottomNav>
      <div className="space-y-4">
        <LocationSettingsCard />
        {groups.map((group) => (
          <SectionCard key={group.title} title={group.title}>
            {group.items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 py-4 text-[14px] ${
                  index > 0 ? "border-t border-[#edf1ef]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                      item.tone === "danger"
                        ? "bg-[#fff1f1] text-[#ef4444]"
                        : "bg-[#eff9f0] text-[#16a34a]"
                    }`}
                  >
                    <SettingIcon name={item.icon} className="h-4 w-4" />
                  </span>
                  <span
                    className={`font-medium ${
                      item.tone === "danger" ? "text-[#ef4444]" : "text-[#111827]"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-[#6b7280]" />
              </div>
            ))}
          </SectionCard>
        ))}
      </div>
    </ProfileShell>
  );
}

export function BookingDetailScreen({ booking }: BookingDetailProps) {
  return (
    <ProfileShell title="Booking Details" showBack backHref="/profile/bookings">
      <div className="rounded-[18px] border border-[#e4ece7] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
        <div className="flex gap-4">
          <BookingThumb kind={booking.thumbnail} imageSrc={booking.imageSrc} service={booking.service} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-extrabold text-[#111827]">
              {booking.service}
            </h2>
            <p className="mt-1 text-[14px] text-[#4b5563]">{booking.provider}</p>
            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeToneClass(booking.badgeTone)}`}>
              {booking.statusLabel}
            </span>
          </div>
        </div>
      </div>

      <SectionCard title="Schedule & Location">
        <ProfileInfoRow
          icon={<CalendarIcon className="h-4 w-4" />}
          label="Date & Time"
          value={booking.schedule}
        />
        <ProfileInfoRow
          icon={<PinIcon className="h-4 w-4" />}
          label="Location"
          value={booking.location}
        />
      </SectionCard>

      <SectionCard title="Booking Activity">
        <div className="space-y-4">
          {(booking.activitySteps ?? []).map((step, index, steps) => (
            <div key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    step.status === "done"
                      ? "border-[#16a34a] bg-[#16a34a] text-white"
                      : step.status === "current"
                        ? "border-[#16a34a] bg-white text-[#16a34a]"
                        : "border-[#d9e2dd] bg-white text-[#98a2b3]"
                  }`}
                >
                  {step.status === "done" ? (
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-current" />
                  )}
                </span>
                {index < steps.length - 1 ? (
                  <span
                    className={`mt-1 h-8 w-[2px] ${
                      step.status === "done" ? "bg-[#16a34a]" : "bg-[#e5e7eb]"
                    }`}
                  />
                ) : null}
              </div>
              <div className="pt-0.5">
                <p
                  className={`text-[14px] font-semibold ${
                    step.status === "pending" ? "text-[#98a2b3]" : "text-[#111827]"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-[12px] text-[#6b7280]">
                  {step.status === "done"
                    ? "Completed"
                    : step.status === "current"
                      ? "Current step"
                      : "Waiting"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Payment">
        <ProfileInfoRow
          icon={<WalletIcon className="h-4 w-4" />}
          label="Amount Paid"
          value={`RM${booking.paymentAmount ?? 0}`}
          valueTone="green"
        />
        <ProfileInfoRow
          icon={<WalletIcon className="h-4 w-4" />}
          label="Payment Method"
          value={booking.paymentMethod ?? "Not available"}
        />
      </SectionCard>

      {booking.status === "cancelled" ? (
        <SectionCard title="Cancellation Details">
          <ProfileInfoRow
            icon={<CloseCircleIcon className="h-4 w-4" />}
            label="Cancelled By"
            value={booking.cancelledBy ?? "Not specified"}
          />
          <div className="border-t border-[#edf1ef] pt-3">
            <p className="text-[13px] font-semibold text-[#111827]">Reason</p>
            <p className="mt-2 text-[14px] leading-6 text-[#374151]">
              {booking.cancellationReason ?? "No cancellation reason shared."}
            </p>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Notes">
        <p className="text-[14px] leading-6 text-[#374151]">
          {booking.notes || "No additional note added for this booking."}
        </p>
      </SectionCard>

      {booking.status === "completed" ? (
        <div className="mt-5">
          <Link
            href={`/profile/bookings/${booking.id}/review`}
            className="inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[#16a34a] text-[15px] font-extrabold text-white shadow-[0_16px_30px_rgba(22,163,74,0.22)]"
          >
            Review This Service
          </Link>
        </div>
      ) : null}
    </ProfileShell>
  );
}

export function BookingReviewScreen({ booking }: BookingReviewProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  return (
    <ProfileShell title="Write Review" showBack backHref={`/profile/bookings/${booking.id}`}>
      <div className="rounded-[18px] border border-[#e4ece7] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
        <div className="flex gap-4">
          <BookingThumb kind={booking.thumbnail} imageSrc={booking.imageSrc} service={booking.service} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-extrabold text-[#111827]">
              {booking.provider}
            </h2>
            <p className="mt-1 text-[14px] text-[#16a34a]">{booking.service}</p>
            <p className="mt-2 text-[13px] text-[#4b5563]">{booking.location}</p>
          </div>
        </div>
      </div>

      <SectionCard title="Rate Provider">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="text-[#f59e0b]"
              aria-label={`Rate ${value} stars`}
            >
              <StarIcon
                className={`h-8 w-8 ${
                  value <= rating ? "fill-current text-[#f59e0b]" : "text-[#d0d5dd]"
                }`}
              />
            </button>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-[#6b7280]">
          {rating > 0 ? `You selected ${rating} star${rating > 1 ? "s" : ""}.` : "Tap a star to rate this service."}
        </p>
      </SectionCard>

      <SectionCard title="Add Photos">
        <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[12px] border border-dashed border-[#16a34a] bg-[#fbfffc] text-[14px] font-extrabold text-[#16a34a]">
          Upload Review Photos
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []).map((file) => file.name);
              setPhotos(files);
            }}
          />
        </label>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {(photos.length > 0 ? photos : ["Food setup", "Work result", "Provider arrival"]).map((photo, index) => (
            <div
              key={`${photo}-${index}`}
              className="flex aspect-square items-center justify-center rounded-[14px] border border-[#e4ece7] bg-[#f8fcf9] px-2 text-center text-[12px] font-semibold text-[#4b5563]"
            >
              {photo}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Comment">
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share your experience with this service provider"
          className="min-h-[8rem] w-full rounded-[14px] border border-[#d9e2dd] px-4 py-3 text-[14px] text-[#111827] outline-none"
        />
      </SectionCard>

      {submitted ? (
        <p className="mt-4 text-center text-[13px] font-semibold text-[#16a34a]">
          Review submitted successfully.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setSubmitted(true)}
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[#16a34a] text-[15px] font-extrabold text-white shadow-[0_16px_30px_rgba(22,163,74,0.22)]"
      >
        Submit Review
      </button>
    </ProfileShell>
  );
}

export function PaymentsScreen({ payments }: PaymentsProps) {
  const [filterMode, setFilterMode] = useState<"month" | "custom">("month");
  const [selectedMonth, setSelectedMonth] = useState("2026-06");
  const [dateFrom, setDateFrom] = useState("2026-04-01");
  const [dateTo, setDateTo] = useState("2026-06-30");

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const paidDate = new Date(payment.paidAt);

      if (filterMode === "month") {
        const paymentMonth = `${paidDate.getFullYear()}-${String(
          paidDate.getMonth() + 1
        ).padStart(2, "0")}`;
        return paymentMonth === selectedMonth;
      }

      const from = new Date(`${dateFrom}T00:00:00`);
      const to = new Date(`${dateTo}T23:59:59`);
      return paidDate >= from && paidDate <= to;
    });
  }, [dateFrom, dateTo, filterMode, payments, selectedMonth]);

  const totalPaid = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <ProfileShell title="Payment History" showBack backHref="/profile">
      <div className="rounded-[18px] border border-[#e4ece7] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] text-[#6b7280]">Total paid</p>
            <p className="mt-1 text-[24px] font-extrabold text-[#16a34a]">
              RM{totalPaid}
            </p>
          </div>
          <div className="rounded-[14px] bg-[#eff9f0] px-3 py-2 text-right">
            <p className="text-[12px] font-bold text-[#16a34a]">
              {filteredPayments.length} payments
            </p>
            <p className="mt-1 text-[11px] text-[#4b5563]">
              Category, date, and time
            </p>
          </div>
        </div>
      </div>

      <SectionCard title="Filter">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFilterMode("month")}
            className={`inline-flex h-10 flex-1 items-center justify-center rounded-[12px] border text-[13px] font-bold ${
              filterMode === "month"
                ? "border-[#16a34a] bg-[#eff9f0] text-[#16a34a]"
                : "border-[#d9e2dd] bg-white text-[#111827]"
            }`}
          >
            By Month
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("custom")}
            className={`inline-flex h-10 flex-1 items-center justify-center rounded-[12px] border text-[13px] font-bold ${
              filterMode === "custom"
                ? "border-[#16a34a] bg-[#eff9f0] text-[#16a34a]"
                : "border-[#d9e2dd] bg-white text-[#111827]"
            }`}
          >
            Custom Period
          </button>
        </div>

        {filterMode === "month" ? (
          <div className="mt-4">
            <p className="mb-2 text-[13px] font-semibold text-[#111827]">Month</p>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="h-11 w-full rounded-[12px] border border-[#d9e2dd] bg-white px-3 text-[14px] text-[#111827] outline-none"
            >
              <option value="2026-06">June 2026</option>
              <option value="2026-05">May 2026</option>
              <option value="2026-04">April 2026</option>
              <option value="2026-03">March 2026</option>
            </select>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-2 text-[13px] font-semibold text-[#111827]">From</p>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-11 w-full rounded-[12px] border border-[#d9e2dd] bg-white px-3 text-[14px] text-[#111827] outline-none"
              />
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-[#111827]">To</p>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-11 w-full rounded-[12px] border border-[#d9e2dd] bg-white px-3 text-[14px] text-[#111827] outline-none"
              />
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Payment History">
        <div className="space-y-4">
          {filteredPayments.map((payment) => {
            const paidAt = new Date(payment.paidAt);
            return (
              <div
                key={payment.id}
                className="rounded-[16px] border border-[#edf1ef] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-extrabold text-[#111827]">
                      {payment.serviceTitle}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-[#16a34a]">
                      {payment.serviceCategory}
                    </p>
                    <p className="mt-1 text-[13px] text-[#4b5563]">
                      Provider: {payment.provider}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[18px] font-extrabold text-[#111827]">
                      RM{payment.amount}
                    </p>
                    <span className="mt-1 inline-flex rounded-full bg-[#eff9f0] px-2 py-1 text-[11px] font-bold text-[#16a34a]">
                      {payment.status === "paid" ? "Paid" : "Refunded"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[12px] text-[#6b7280]">
                  <p>
                    Date:{" "}
                    <span className="font-semibold text-[#111827]">
                      {new Intl.DateTimeFormat("en-MY", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(paidAt)}
                    </span>
                  </p>
                  <p>
                    Time:{" "}
                    <span className="font-semibold text-[#111827]">
                      {new Intl.DateTimeFormat("en-MY", {
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(paidAt)}
                    </span>
                  </p>
                  <p className="col-span-2">
                    Method:{" "}
                    <span className="font-semibold text-[#111827]">
                      {payment.paymentMethod}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}

          {filteredPayments.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[#d9e2dd] px-4 py-6 text-center text-[13px] text-[#6b7280]">
              No payment found for this filter.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </ProfileShell>
  );
}

export function NotificationsScreen({
  initialNotifications = [],
}: NotificationsProps) {
  const [items, setItems] = useState(initialNotifications);
  const [pushState, setPushState] = useState<PushSetupState>({
    permission: "default",
    hasSavedToken: false,
  });
  const [pushNotice, setPushNotice] = useState("");
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();
    let channel: ReturnType<NonNullable<typeof client>["channel"]> | null = null;

    async function loadNotifications() {
      if (!client) {
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!active || !session) {
        return;
      }

      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = (await response.json()) as
        | { notifications: NotificationItem[] }
        | { error?: string };

      if (!active || !response.ok || !("notifications" in result)) {
        return;
      }

      setItems(result.notifications);

      channel = client
        .channel(`notifications-${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${session.user.id}`,
          },
          async () => {
            const refreshResponse = await fetch("/api/notifications", {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            const refreshResult = (await refreshResponse.json()) as
              | { notifications: NotificationItem[] }
              | { error?: string };

            if (!active || !refreshResponse.ok || !("notifications" in refreshResult)) {
              return;
            }

            setItems(refreshResult.notifications);
          }
        )
        .subscribe();
    }

    void loadNotifications();
    void getPushSetupState().then((state) => {
      if (active) {
        setPushState(state);
      }
    });

    return () => {
      active = false;
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, []);

  async function markAsRead(id: string) {
    const client = getSupabaseClient();
    if (!client) {
      return;
    }

    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )
    );

    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  }

  async function handleEnablePush() {
    setPushBusy(true);
    setPushNotice("");

    try {
      const token = await requestNotificationPermission();

      if (!token) {
        const state = await getPushSetupState();
        setPushState(state);
        setPushNotice(
          state.permission === "denied"
            ? "Push is blocked in this browser. Please allow notifications in browser settings."
            : "Push permission was not granted."
        );
        return;
      }

      const result = await saveFCMToken(token);

      if (!result.success) {
        setPushNotice(result.error || "Unable to save push token.");
        return;
      }

      setPushState({
        permission: "granted",
        hasSavedToken: true,
      });
      setPushNotice("Push notifications enabled on this device.");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleDisablePush() {
    setPushBusy(true);
    setPushNotice("");

    try {
      const result = await disablePushNotifications();

      if (!result.success) {
        setPushNotice(result.error || "Unable to disable push notifications.");
        return;
      }

      const state = await getPushSetupState();
      setPushState(state);
      setPushNotice("Push notifications disabled for this device.");
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <ProfileShell title="Notifications" showBack backHref="/profile">
      <div className="space-y-4">
        <PushNotificationCard
          pushState={pushState}
          notice={pushNotice}
          busy={pushBusy}
          onEnable={handleEnablePush}
          onDisable={handleDisablePush}
        />
        {items.length === 0 ? (
          <SharedEmptyState
            title="No notifications yet"
            description="Booking updates, provider decisions, and payment alerts will show up here in real time."
          />
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void markAsRead(item.id)}
              className={`w-full rounded-[18px] border p-4 text-left shadow-[0_10px_26px_rgba(15,23,42,0.04)] ${
                item.isRead
                  ? "border-[#e4ece7] bg-white"
                  : "border-[#bbf7d0] bg-[#f6fff8]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-extrabold text-[#111827]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-[#4b5563]">
                    {item.body}
                  </p>
                  <div className="mt-3">
                    <SharedStatusBadge
                      label={item.isRead ? "Read" : "Unread"}
                      tone={item.isRead ? "cancelled" : "info"}
                    />
                  </div>
                </div>
                {!item.isRead ? (
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#16a34a]" />
                ) : null}
              </div>
              <p className="mt-3 text-[12px] font-semibold text-[#6b7280]">
                {new Intl.DateTimeFormat("en-MY", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(item.createdAt))}
              </p>
            </button>
          ))
        )}
      </div>
    </ProfileShell>
  );
}

export function MessagesScreen() {
  return (
    <ProfileShell title="Messages" showBack backHref="/profile">
      <div className="space-y-4">
        <SharedEmptyState
          title="No conversations yet"
          description="When booking chat is enabled for a provider, your conversation threads will appear here."
          action={<AppButton href="/profile/bookings">Open My Bookings</AppButton>}
        />
        <MessagePlaceholderCard />
      </div>
    </ProfileShell>
  );
}

function PushNotificationCard({
  pushState,
  notice,
  busy,
  onEnable,
  onDisable,
}: {
  pushState: PushSetupState;
  notice: string;
  busy: boolean;
  onEnable: () => void;
  onDisable: () => void;
}) {
  const enabled = pushState.permission === "granted" && pushState.hasSavedToken;
  const statusLabel =
    pushState.permission === "unsupported"
      ? "Not supported"
      : pushState.permission === "denied"
        ? "Blocked"
        : enabled
          ? "Enabled"
          : pushState.permission === "granted"
            ? "Ready to enable"
            : "Permission needed";

  return (
    <div className="rounded-[18px] border border-[#dbe8df] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-extrabold text-[#111827]">
            Push Notifications
          </p>
          <p className="mt-1 text-[13px] leading-6 text-[#4b5563]">
            Get booking updates even when this app is closed.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
            enabled
              ? "bg-[#e9f9ec] text-[#16a34a]"
              : "bg-[#eef2f7] text-[#64748b]"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || pushState.permission === "unsupported"}
          onClick={onEnable}
          className="inline-flex h-10 items-center justify-center rounded-[12px] bg-[#16a34a] px-4 text-[13px] font-extrabold text-white disabled:opacity-60"
        >
          {busy ? "Updating..." : enabled ? "Enable Again" : "Enable Push"}
        </button>
        <button
          type="button"
          disabled={busy || (!enabled && pushState.permission !== "granted")}
          onClick={onDisable}
          className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#dbe8df] bg-white px-4 text-[13px] font-extrabold text-[#111827] disabled:opacity-60"
        >
          Disable Push
        </button>
      </div>

      {notice ? (
        <p className="mt-3 text-[12px] font-semibold text-[#4b5563]">{notice}</p>
      ) : null}
    </div>
  );
}

function LocationSettingsCard() {
  const [location, setLocation] = useState<StoredLiveLocation | null>(() =>
    loadStoredLiveLocation()
  );
  const [savedPlaces, setSavedPlaces] = useState<StoredLiveLocation[]>(() =>
    loadSavedPlaces()
  );
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setStatusMessage("");

    void resolveCurrentLiveLocation("Current location")
      .then((nextLocation) => {
        if (!nextLocation) {
          setStatusMessage("Location services are unavailable on this device.");
          return;
        }

        setLocation(nextLocation);
        setSavedPlaces(loadSavedPlaces());
        setStatusMessage("Current location updated successfully.");
      })
      .catch(() => {
        setStatusMessage("Location permission was denied or unavailable.");
      })
      .finally(() => {
        setIsLocating(false);
      });
  };

  return (
    <SectionCard title="Live Location">
      <div className="rounded-[16px] bg-[#f8fcf9] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-extrabold text-[#111827]">
              Use my current location
            </p>
            <p className="mt-1 text-[13px] leading-5 text-[#4b5563]">
              Save your live GPS coordinates for accurate map-based service matching,
              then tap the saved location to fine-tune it on the map.
            </p>
          </div>
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eff9f0] text-[#16a34a]">
            <PinIcon className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4 rounded-[14px] border border-[#e4ece7] bg-white px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
            Saved location
          </p>
          <div className="mt-1">
            <LiveLocationChip
              fallbackLabel={location?.label ?? "No live location saved yet"}
              className="text-[14px] font-semibold"
              onLocationChange={(nextLocation) => {
                setLocation(nextLocation);
                setSavedPlaces(loadSavedPlaces());
              }}
              onLocationClear={() => {
                setLocation(null);
                setSavedPlaces(loadSavedPlaces());
              }}
            />
          </div>
          {location ? (
            <p className="mt-1 text-[12px] text-[#6b7280]">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          ) : null}
        </div>

        {location ? (
          <div className="mt-4 overflow-hidden rounded-[20px] border border-[#dcecdf] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="bg-[#eef9ff] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
                    {location.addressLabel ?? "Home"}
                  </p>
                  <p className="mt-1 text-[18px] font-extrabold text-[#111827]">
                    {[location.houseNumber, location.buildingName || location.label]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="mt-1 text-[13px] text-[#4b5563]">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#ef4444] shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
                  <PinIcon className="h-5 w-5 fill-current" />
                </span>
              </div>
            </div>
            <div className="space-y-2 px-4 py-4">
              <p className="text-[14px] font-semibold text-[#111827]">
                {location.formattedAddress ?? location.label}
              </p>
              <p className="text-[13px] text-[#4b5563]">
                {[
                  location.floor && `Floor ${location.floor}`,
                  location.unitNumber && `Unit ${location.unitNumber}`,
                ]
                  .filter(Boolean)
                  .join(" • ") || "No floor or unit details yet"}
              </p>
              <p className="text-[13px] text-[#2563eb]">
                {location.pickupNote || "No pickup note added yet"}
              </p>
            </div>
          </div>
        ) : null}

        {savedPlaces.length > 0 ? (
          <div className="mt-4 rounded-[18px] border border-[#e4ece7] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-extrabold text-[#111827]">
                Saved Places
              </h3>
              <span className="text-[12px] font-semibold text-[#6b7280]">
                {savedPlaces.length} saved
              </span>
            </div>
            <div className="space-y-3">
              {savedPlaces.map((place) => (
                <div
                  key={place.id}
                  className="rounded-[14px] border border-[#edf1ef] px-3 py-3"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
                    {place.addressLabel ?? "Place"}
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-[#111827]">
                    {[place.houseNumber, place.buildingName || place.label]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="mt-1 text-[13px] text-[#4b5563]">
                    {place.formattedAddress ?? place.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {statusMessage ? (
          <p className="mt-3 text-[12px] font-semibold text-[#16a34a]">
            {statusMessage}
          </p>
        ) : null}

        <div className="mt-4">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[#16a34a] px-4 text-[14px] font-extrabold text-white shadow-[0_12px_24px_rgba(22,163,74,0.18)] disabled:opacity-70"
          >
            {isLocating ? "Getting location..." : "Use My Current Location"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function ProfileSummaryCard({
  profile,
  fullName,
}: {
  profile: CustomerProfile;
  fullName: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#e4ece7] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-4">
        <AvatarCircle
          initials={`${profile.firstName[0] ?? "S"}${profile.lastName[0] ?? "K"}`}
          size="lg"
          accent="from-emerald-500 to-green-700"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-extrabold text-[#111827]">
                {fullName}
              </h2>
              <div className="mt-1 flex items-center gap-1 text-[13px] text-[#6b7280]">
                <PinIcon className="h-3.5 w-3.5" />
                {profile.city}, {profile.region}
              </div>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-[#6b7280]" />
          </div>

          {profile.verified ? (
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#e9f9ec] px-2.5 py-1 text-[12px] font-bold text-[#16a34a]">
              <CheckShieldIcon className="h-4 w-4" />
              Phone Verified
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileCompletion({ completion }: { completion: number }) {
  return (
    <SectionCard title="Profile Completion">
      <div className="mb-2 flex items-center justify-between text-[13px] text-[#6b7280]">
        <span />
        <span>
          <strong className="text-[#16a34a]">{completion}%</strong> Complete
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#e5e7eb]">
        <div
          className="h-2 rounded-full bg-[#16a34a]"
          style={{ width: `${completion}%` }}
        />
      </div>
    </SectionCard>
  );
}

function SectionCard({
  title,
  actionLabel,
  actionHref,
  children,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-[18px] border border-[#e4ece7] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-extrabold text-[#111827]">{title}</h3>
        {actionLabel ? (
          actionHref ? (
            <Link href={actionHref} className="text-[13px] font-bold text-[#16a34a]">
              {actionLabel}
            </Link>
          ) : (
            <span className="text-[13px] font-bold text-[#16a34a]">{actionLabel}</span>
          )
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ProfileInfoRow({
  icon,
  label,
  value,
  valueTone = "default",
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueTone?: "default" | "green";
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center gap-3 text-[14px] text-[#111827]">
        <span className="text-[#16a34a]">{icon}</span>
        <span>{label}</span>
      </div>
      <span
        className={`text-[13px] ${
          valueTone === "green"
            ? "font-bold text-[#16a34a]"
            : "text-[#374151]"
        }`}
      >
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center justify-between gap-3 border-t border-[#edf1ef] py-3 first:border-t-0 first:pt-0 last:pb-0"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#edf1ef] py-3 first:border-t-0 first:pt-0 last:pb-0">
      {content}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  icon,
  rightIcon,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  rightIcon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-semibold text-[#111827]">
        {label}
      </span>
      <div className="flex items-center rounded-[12px] border border-[#d9e2dd] px-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
        <span className="mr-3 text-[#16a34a]">{icon}</span>
        <input
          value={value}
          onChange={onChange}
          className="h-11 flex-1 border-0 bg-transparent text-[14px] text-[#111827] outline-none"
        />
        {rightIcon ? <span className="ml-3 text-[#6b7280]">{rightIcon}</span> : null}
      </div>
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  icon,
  options,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  icon: React.ReactNode;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-semibold text-[#111827]">
        {label}
      </span>
      <div className="flex items-center rounded-[12px] border border-[#d9e2dd] px-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
        <span className="mr-3 text-[#16a34a]">{icon}</span>
        <select
          value={value}
          onChange={onChange}
          className="h-11 flex-1 appearance-none border-0 bg-transparent text-[14px] text-[#111827] outline-none"
        >
          <option value="">Select sex</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="ml-3 text-[#6b7280]">
          <ChevronDownIcon className="h-4 w-4" />
        </span>
      </div>
    </label>
  );
}

function AvatarCircle({
  initials,
  size,
  accent,
}: {
  initials: string;
  size: "md" | "lg" | "xl";
  accent: string;
}) {
  const sizeClass =
    size === "xl"
      ? "h-24 w-24 text-[28px]"
      : size === "lg"
        ? "h-[4.5rem] w-[4.5rem] text-[22px]"
        : "h-14 w-14 text-[16px]";

  return (
    <div
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full bg-gradient-to-br ${accent} font-extrabold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]`}
    >
      {initials}
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t border-[#E8ECE8] bg-white/97 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur">
      <div className="flex items-center justify-between gap-1 text-[10.5px] font-medium text-[#8A94A6]">
        <NavItem href="/home" label="Home" icon={<HomeIcon className="h-5 w-5" />} active={pathname === "/home"} />
        <NavItem href="/profile/bookings" label="Bookings" icon={<CalendarIcon className="h-5 w-5" />} active={pathname.startsWith("/profile/bookings")} />
        <NavItem href="/profile/notifications" label="Alerts" icon={<BellIcon className="h-5 w-5" />} active={pathname.startsWith("/profile/notifications")} />
        <NavItem href="/profile/favourites" label="Favourite" icon={<UserIcon className="h-5 w-5" />} active={pathname.startsWith("/profile/favourites")} />
        <NavItem href="/profile" label="Profile" icon={<UserIcon className="h-5 w-5" />} active={pathname === "/profile" || pathname.startsWith("/profile/edit") || pathname.startsWith("/profile/addresses") || pathname.startsWith("/profile/settings")} />
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-[3.1rem] flex-col items-center gap-1 ${
        active ? "text-[#16A34A]" : "text-[#8A94A6]"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className="flex h-3 items-end">
        <span
          className={`rounded-full transition-all ${
            active ? "h-[3px] w-10 bg-[#16A34A]" : "h-[3px] w-6 bg-transparent"
          }`}
        />
      </span>
    </Link>
  );
}

function BookingThumb({
  kind,
  imageSrc,
  service,
}: {
  kind: string;
  imageSrc?: string;
  service: string;
}) {
  const tones =
    kind === "food"
      ? "from-amber-500 via-orange-500 to-emerald-700"
      : kind === "cleaning"
        ? "from-sky-300 via-slate-200 to-cyan-600"
        : "from-slate-800 via-slate-600 to-stone-400";

  if (imageSrc) {
    return (
      <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[14px] shadow-[0_8px_18px_rgba(15,23,42,0.16)]">
        <Image
          src={imageSrc}
          alt={service}
          fill
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`h-[4.5rem] w-[4.5rem] shrink-0 rounded-[14px] bg-gradient-to-br ${tones} p-2 shadow-[0_8px_18px_rgba(15,23,42,0.16)]`}>
      <div className="flex h-full w-full items-end rounded-[10px] bg-black/20 p-2">
        {kind === "food" ? <ChefHatIcon className="h-5 w-5 text-white" /> : null}
        {kind === "cleaning" ? <SparklesCleanIcon className="h-5 w-5 text-white" /> : null}
        {kind === "car" ? <CarIcon className="h-5 w-5 text-white" /> : null}
      </div>
    </div>
  );
}

function badgeToneClass(tone: Booking["badgeTone"]) {
  if (tone === "green") {
    return "bg-[#e9f9ec] text-[#16a34a]";
  }

  if (tone === "amber") {
    return "bg-[#fff3e3] text-[#f59e0b]";
  }

  return "bg-[#eef2f7] text-[#64748b]";
}

function bookingTone(booking: Booking) {
  if (booking.status === "cancelled") {
    return "cancelled" as const;
  }

  if (booking.status === "completed") {
    return "completed" as const;
  }

  if (booking.statusLabel.toLowerCase().includes("confirm")) {
    return "accepted" as const;
  }

  if (booking.statusLabel.toLowerCase().includes("declin")) {
    return "declined" as const;
  }

  return "pending" as const;
}

function SettingIcon({
  name,
  className,
}: {
  name: SettingGroup["items"][number]["icon"];
  className?: string;
}) {
  switch (name) {
    case "user":
      return <UserIcon className={className} />;
    case "lock":
      return <LockIcon className={className} />;
    case "bell":
      return <BellIcon className={className} />;
    case "help":
      return <HelpIcon className={className} />;
    case "alert":
      return <AlertIcon className={className} />;
    case "privacy":
      return <PrivacyIcon className={className} />;
    case "terms":
      return <DocumentIcon className={className} />;
    case "trash":
      return <TrashIcon className={className} />;
    case "logout":
      return <LogoutIcon className={className} />;
    default:
      return <UserIcon className={className} />;
  }
}

function AddressKindIcon({
  kind,
  className,
}: {
  kind: Address["kind"];
  className?: string;
}) {
  if (kind === "home") return <HomeIcon className={className} />;
  if (kind === "office") return <OfficeIcon className={className} />;
  return <PinIcon className={className} />;
}

function iconClass(className?: string) {
  return className ?? "h-5 w-5 stroke-[1.9]";
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" className={iconClass(className)}>
      <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={iconClass(className)}>
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="m5 7 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotsVerticalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass(className)}>
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.7-3 4.4-4.5 8-4.5s6.3 1.5 8 4.5" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M6.6 3h3.1l1.2 4.6-1.8 1.8a15 15 0 0 0 5.4 5.4l1.8-1.8L21 14.3v3.1c0 .9-.7 1.6-1.6 1.6C10.8 19 5 13.2 5 6.6 5 5.7 5.7 5 6.6 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M6 16.5h12l-1.2-1.4a3 3 0 0 1-.8-2V10a4 4 0 1 0-8 0v3.1a3 3 0 0 1-.8 2L6 16.5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="m4 11 8-7 8 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10.5V20h12v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OfficeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M4 21h16" strokeLinecap="round" />
      <path d="M7 21V7l10-3v17" />
      <path d="M10 10h.01M10 14h.01M14 10h.01M14 14h.01" strokeLinecap="round" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 1 1 5.4 1.8c-.7.9-1.5 1.3-2 2.2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M12 4v8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
      <path d="M4 20h16" strokeLinecap="round" />
      <path d="M6 20V6a6 6 0 1 1 12 0v14" />
    </svg>
  );
}

function PrivacyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.8 1.8L15 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v6h6M10 13h6M10 17h6" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M10 17v2a2 2 0 0 0 2 2h6V3h-6a2 2 0 0 0-2 2v2" />
      <path d="M15 12H4m0 0 3-3m-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M6 17.5 3 20V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6Z" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M4 8h3l1.2-2h7.6L17 8h3v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={iconClass(className)}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.3 2.3 4.7-4.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" strokeLinecap="round" />
    </svg>
  );
}

function CheckShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M12 3 5.5 5.7v5.1c0 4.2 2.6 7 6.5 8.9 3.9-1.9 6.5-4.7 6.5-8.9V5.7L12 3Z" />
      <path d="m9.5 11.8 1.8 1.8 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M16 12h3" strokeLinecap="round" />
    </svg>
  );
}

function FavoriteHeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path
        d="M12 20.4s-6.7-4.2-9.2-8.1C.9 9.3 2 5.6 5.4 4.8c2-.5 4 .2 5.2 1.8 1.2-1.6 3.2-2.3 5.2-1.8 3.4.8 4.5 4.5 2.6 7.5-2.5 3.9-9.2 8.1-9.2 8.1Z"
      />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="m12 3.5 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6L3.27 9.85l6.03-.88L12 3.5Z" />
    </svg>
  );
}

function MalaysiaFlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className}>
      <rect width="28" height="20" rx="3" fill="#ffffff" />
      <path d="M0 0h14v10H0z" fill="#1d4ed8" />
      <path d="M0 0h28v2H0zm0 4h28v2H0zm0 8h28v2H0zm0 12h28v2H0z" fill="#ef4444" />
      <path d="M0 8h28v2H0zm0 8h28v2H0z" fill="#ef4444" />
      <circle cx="7" cy="5" r="3.3" fill="#facc15" />
      <circle cx="8.1" cy="5" r="2.6" fill="#1d4ed8" />
      <path d="m10.2 2.4.6 1.5 1.6.1-1.2 1 .4 1.5-1.4-.8-1.4.8.4-1.5-1.2-1 1.6-.1.6-1.5Z" fill="#facc15" />
    </svg>
  );
}

function ChefHatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M8 10a3 3 0 1 1 0-6 3.7 3.7 0 0 1 4 2 3.8 3.8 0 0 1 6 3 3 3 0 0 1-2 5H8a3 3 0 0 1 0-4Z" />
      <path d="M9 14v4h6v-4" strokeLinecap="round" />
    </svg>
  );
}

function SparklesCleanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M12 4l1.3 3.7L17 9l-3.7 1.3L12 14l-1.3-3.7L7 9l3.7-1.3L12 4Z" />
      <path d="M6 15l.8 2.2L9 18l-2.2.8L6 21l-.8-2.2L3 18l2.2-.8L6 15Z" />
    </svg>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M5 16V9l2-3h10l2 3v7" />
      <path d="M3 13h18M7 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}
