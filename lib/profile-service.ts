import "server-only";

import type {
  Address,
  Booking,
  CustomerProfile,
  PaymentHistoryItem,
  ProfileOverviewData,
  SettingGroup,
} from "./profile-types";
import { listCustomerBookings } from "./customer-booking-storage";
import {
  buildProviderPortraitSrc,
  type ProviderCategoryKey,
} from "./provider-catalog";

const mockProfile: CustomerProfile = {
  firstName: "Sanju",
  lastName: "Kumar",
  sex: "Male",
  dateOfBirth: "15/04/1995",
  email: "sanju@gmail.com",
  phoneNumber: "12-345 6789",
  countryCode: "+60",
  city: "Kuala Lumpur",
  region: "Kuala Lumpur",
  country: "Malaysia",
  verified: true,
  completion: 80,
};

const favoriteProviders = [
  {
    id: "mock-chef-chef-amina",
    name: "Chef Amina",
    role: "Chef",
    initials: "CA",
    accent: "from-emerald-500 to-green-700",
    serviceKey: "chef",
    location: "Kajang, Selangor",
    rating: 4.9,
    priceLabel: "RM260",
    portraitSrc: buildProviderPortraitSrc({ name: "Chef Amina", serviceKey: "chef" }),
    bookHref: "/providers/mock-chef-chef-amina/book?service=chef",
  },
  {
    id: "mock-maid-siti-maid-service",
    name: "Maid Siti",
    role: "Cleaning",
    initials: "MS",
    accent: "from-teal-500 to-emerald-700",
    serviceKey: "maid",
    location: "Setapak, Kuala Lumpur",
    rating: 4.8,
    priceLabel: "RM180",
    portraitSrc: buildProviderPortraitSrc({ name: "Siti Maid Service", serviceKey: "maid" }),
    bookHref: "/providers/mock-maid-siti-maid-service/book?service=maid",
  },
  {
    id: "mock-driver-driver-kumar",
    name: "Driver Kumar",
    role: "Driver",
    initials: "DK",
    accent: "from-sky-500 to-slate-700",
    serviceKey: "driver",
    location: "Ampang, Selangor",
    rating: 4.7,
    priceLabel: "RM205",
    portraitSrc: buildProviderPortraitSrc({ name: "Driver Kumar", serviceKey: "driver" }),
    bookHref: "/providers/mock-driver-driver-kumar/book?service=driver",
  },
  {
    id: "mock-plumber-home-pipe-expert",
    name: "Murugan",
    role: "Plumber",
    initials: "MU",
    accent: "from-orange-500 to-amber-700",
    serviceKey: "plumber",
    location: "Shah Alam, Selangor",
    rating: 4.8,
    priceLabel: "RM360",
    portraitSrc: buildProviderPortraitSrc({ name: "Home Pipe Expert", serviceKey: "plumber" }),
    bookHref: "/providers/mock-plumber-home-pipe-expert/book?service=plumber",
  },
  {
    id: "mock-tutor-tutor-farah",
    name: "Tutor Farah",
    role: "Tutor",
    initials: "TF",
    accent: "from-violet-500 to-fuchsia-700",
    serviceKey: "tutor",
    location: "Subang Jaya, Selangor",
    rating: 4.8,
    priceLabel: "RM260",
    portraitSrc: buildProviderPortraitSrc({ name: "Tutor Farah", serviceKey: "tutor" }),
    bookHref: "/providers/mock-tutor-tutor-farah/book?service=tutor",
  },
];

const paymentMethods = [
  { id: "cash", label: "Cash", type: "Cash", isDefault: true },
  { id: "fpx", label: "Online Payment", type: "Card / FPX" },
];

const paymentHistory: PaymentHistoryItem[] = [
  {
    id: "payment-1",
    serviceCategory: "Cleaning",
    serviceTitle: "Deep Cleaning",
    provider: "Maid Siti",
    amount: 180,
    paidAt: "2026-06-01T10:30:00+08:00",
    paymentMethod: "Card / FPX",
    status: "paid",
  },
  {
    id: "payment-2",
    serviceCategory: "Chef",
    serviceTitle: "Dinner Chef Service",
    provider: "Chef Amina",
    amount: 260,
    paidAt: "2026-05-28T19:15:00+08:00",
    paymentMethod: "Card / FPX",
    status: "paid",
  },
  {
    id: "payment-3",
    serviceCategory: "Driver",
    serviceTitle: "Airport Transfer",
    provider: "Driver Kumar",
    amount: 95,
    paidAt: "2026-05-18T06:45:00+08:00",
    paymentMethod: "Cash",
    status: "paid",
  },
  {
    id: "payment-4",
    serviceCategory: "Plumber",
    serviceTitle: "Leak Repair",
    provider: "Murugan",
    amount: 320,
    paidAt: "2026-04-30T14:05:00+08:00",
    paymentMethod: "Card / FPX",
    status: "paid",
  },
  {
    id: "payment-5",
    serviceCategory: "Babysitter",
    serviceTitle: "Evening Childcare",
    provider: "Sara",
    amount: 210,
    paidAt: "2026-04-15T18:20:00+08:00",
    paymentMethod: "Cash",
    status: "paid",
  },
  {
    id: "payment-6",
    serviceCategory: "Tutor",
    serviceTitle: "Mathematics Home Tuition",
    provider: "Tutor Farah",
    amount: 245,
    paidAt: "2026-03-12T16:00:00+08:00",
    paymentMethod: "Card / FPX",
    status: "paid",
  },
];

const addresses: Address[] = [
  {
    id: "home",
    label: "Home",
    line1: "No. 123, Jalan Mutiara 4,",
    line2: "Taman Mutiara, 43000",
    city: "Kajang",
    state: "Selangor",
    isDefault: true,
    kind: "home",
  },
  {
    id: "office",
    label: "Office",
    line1: "Level 10, Menara KL,",
    line2: "Jalan P. Ramlee, 50250",
    city: "Kuala Lumpur",
    state: "",
    kind: "office",
  },
  {
    id: "other",
    label: "Other",
    line1: "No. 45, Jalan 1/2,",
    line2: "Bandar Putra, 81000",
    city: "Johor Bahru",
    state: "Johor",
    kind: "other",
  },
];

const bookings: Booking[] = [
  {
    id: "booking-1",
    service: "Chef Service",
    provider: "Ex Chef Amina",
    schedule: "20 May 2024, 10:00 AM",
    location: "Kajang, Selangor",
    status: "upcoming",
    statusLabel: "Confirmed",
    badgeTone: "green",
    thumbnail: "food",
    imageSrc: buildProviderPortraitSrc({ name: "Chef Amina", serviceKey: "chef" }),
    paymentAmount: 260,
    paymentMethod: "Card / FPX",
    notes: "Dinner setup for 4 people",
    activitySteps: [
      { label: "Accepted", status: "done" },
      { label: "Confirmed", status: "current" },
      { label: "On the way", status: "pending" },
      { label: "Arrived", status: "pending" },
      { label: "Task Completed", status: "pending" },
      { label: "Payment Done", status: "pending" },
    ],
  },
  {
    id: "booking-2",
    service: "Maid Service",
    provider: "Maid Siti",
    schedule: "22 May 2024, 02:00 PM",
    location: "Kuala Lumpur",
    status: "upcoming",
    statusLabel: "Pending",
    badgeTone: "amber",
    thumbnail: "cleaning",
    imageSrc: buildProviderPortraitSrc({ name: "Siti Maid Service", serviceKey: "maid" }),
    paymentAmount: 180,
    paymentMethod: "Cash",
    notes: "Please bring vacuum and cleaning supplies",
    activitySteps: [
      { label: "Accepted", status: "current" },
      { label: "Confirmed", status: "pending" },
      { label: "On the way", status: "pending" },
      { label: "Arrived", status: "pending" },
      { label: "Task Completed", status: "pending" },
      { label: "Payment Done", status: "pending" },
    ],
  },
  {
    id: "booking-3",
    service: "Driver Service",
    provider: "Driver Kumar",
    schedule: "25 May 2024, 09:00 AM",
    location: "Kuala Lumpur",
    status: "completed",
    statusLabel: "Confirmed",
    badgeTone: "green",
    thumbnail: "car",
    imageSrc: buildProviderPortraitSrc({ name: "Driver Kumar", serviceKey: "driver" }),
    paymentAmount: 205,
    paymentMethod: "Card / FPX",
    notes: "Airport drop-off completed successfully",
    activitySteps: [
      { label: "Accepted", status: "done" },
      { label: "Confirmed", status: "done" },
      { label: "On the way", status: "done" },
      { label: "Arrived", status: "done" },
      { label: "Task Completed", status: "done" },
      { label: "Payment Done", status: "done" },
    ],
  },
  {
    id: "booking-4",
    service: "Tutor Service",
    provider: "Tutor Farah",
    schedule: "27 May 2024, 04:30 PM",
    location: "Subang Jaya, Selangor",
    status: "completed",
    statusLabel: "Completed",
    badgeTone: "green",
    thumbnail: "cleaning",
    imageSrc: buildProviderPortraitSrc({ name: "Tutor Farah", serviceKey: "tutor" }),
    paymentAmount: 260,
    paymentMethod: "Online Transfer",
    notes: "Weekly math lesson package",
    activitySteps: [
      { label: "Accepted", status: "done" },
      { label: "Confirmed", status: "done" },
      { label: "On the way", status: "done" },
      { label: "Arrived", status: "done" },
      { label: "Task Completed", status: "done" },
      { label: "Payment Done", status: "done" },
    ],
  },
  {
    id: "booking-5",
    service: "Plumber Service",
    provider: "Murugan",
    schedule: "18 May 2024, 11:15 AM",
    location: "Shah Alam, Selangor",
    status: "cancelled",
    statusLabel: "Cancelled",
    badgeTone: "slate",
    thumbnail: "car",
    imageSrc: buildProviderPortraitSrc({ name: "Home Pipe Expert", serviceKey: "plumber" }),
    paymentAmount: 0,
    paymentMethod: "Not charged",
    notes: "Booking was cancelled before the scheduled visit.",
    cancelledBy: "Service provider",
    cancellationReason: "Not available that day due to urgent work.",
    activitySteps: [
      { label: "Accepted", status: "done" },
      { label: "Confirmed", status: "pending" },
      { label: "On the way", status: "pending" },
      { label: "Arrived", status: "pending" },
      { label: "Task Completed", status: "pending" },
      { label: "Payment Done", status: "pending" },
    ],
  },
];

const settings: SettingGroup[] = [
  {
    title: "Account",
    items: [
      { id: "edit", label: "Edit Personal Information", icon: "user" },
      { id: "password", label: "Change Password", icon: "lock" },
      { id: "notifications", label: "Notification Settings", icon: "bell" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", label: "Help & Support", icon: "help" },
      { id: "report", label: "Report an Issue", icon: "alert" },
      { id: "privacy", label: "Privacy Policy", icon: "privacy" },
      { id: "terms", label: "Terms & Conditions", icon: "terms" },
    ],
  },
  {
    title: "Account Actions",
    items: [
      { id: "delete", label: "Delete Account", icon: "trash", tone: "danger" },
      { id: "logout", label: "Logout", icon: "logout", tone: "danger" },
    ],
  },
];

export async function getProfileOverviewData(): Promise<ProfileOverviewData> {
  const storedBookings = await listCustomerBookings();
  const totalPaid = paymentHistory.reduce((sum, item) => sum + item.amount, 0);
  const latestPayment = paymentHistory[0];

  return {
    profile: structuredClone(mockProfile),
    favoriteProviders: structuredClone(favoriteProviders),
    paymentMethods: structuredClone(paymentMethods),
    paymentSummary: {
      totalPaid,
      lastPaymentLabel: latestPayment
        ? `${latestPayment.serviceTitle} on ${new Intl.DateTimeFormat("en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(new Date(latestPayment.paidAt))}`
        : "No payment yet",
    },
    bookingSummary: {
      upcoming: storedBookings.length || 3,
      completed: 12,
      cancelled: 2,
    },
  };
}

export async function getEditableProfileData(): Promise<CustomerProfile> {
  return structuredClone(mockProfile);
}

export async function getSavedAddresses(): Promise<Address[]> {
  return structuredClone(addresses);
}

export async function getBookings(): Promise<Booking[]> {
  const storedBookings = await listCustomerBookings();

  if (storedBookings.length === 0) {
    return structuredClone(bookings);
  }

  return storedBookings.map((booking) => ({
    ...(function () {
      const serviceKey = booking.serviceKey as ProviderCategoryKey;
      return {
        id: booking.id,
        service: `${booking.serviceLabel} Service`,
        provider: booking.providerName,
        schedule: `${booking.dateLabel}, ${booking.timeLabel}`,
        location: booking.location,
        status: booking.status === "pending" ? "upcoming" : "completed",
        statusLabel: booking.status === "pending" ? "Pending" : "Confirmed",
        badgeTone: booking.status === "pending" ? "amber" : "green",
        thumbnail:
          serviceKey === "chef"
            ? "food"
            : serviceKey === "driver"
              ? "car"
              : "cleaning",
        imageSrc: buildProviderPortraitSrc({
          name: booking.providerName,
          serviceKey,
        }),
        paymentAmount: booking.totalAmount,
        paymentMethod: booking.bookingMode === "hourly" ? "Card / FPX" : "Cash",
        notes: booking.notes,
        activitySteps:
          booking.status === "pending"
            ? [
                { label: "Accepted", status: "done" },
                { label: "Confirmed", status: "current" },
                { label: "On the way", status: "pending" },
                { label: "Arrived", status: "pending" },
                { label: "Task Completed", status: "pending" },
                { label: "Payment Done", status: "pending" },
              ]
            : [
                { label: "Accepted", status: "done" },
                { label: "Confirmed", status: "done" },
                { label: "On the way", status: "done" },
                { label: "Arrived", status: "done" },
                { label: "Task Completed", status: "done" },
                { label: "Payment Done", status: "done" },
              ],
      } satisfies Booking;
    })(),
  }));
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const allBookings = await getBookings();
  return allBookings.find((booking) => booking.id === id) ?? null;
}

export async function getProfileSettings(): Promise<SettingGroup[]> {
  return structuredClone(settings);
}

export async function getPaymentHistory(): Promise<PaymentHistoryItem[]> {
  return structuredClone(paymentHistory);
}

export async function getFavoriteProviders() {
  return structuredClone(favoriteProviders);
}
