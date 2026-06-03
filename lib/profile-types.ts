export type CustomerProfile = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  city: string;
  region: string;
  verified: boolean;
  completion: number;
};

export type FavoriteProvider = {
  id: string;
  name: string;
  role: string;
  initials: string;
  accent: string;
  serviceKey?: string;
  location?: string;
  rating?: number;
  priceLabel?: string;
  portraitSrc?: string;
  bookHref?: string;
};

export type PaymentMethod = {
  id: string;
  label: string;
  type: string;
  isDefault?: boolean;
};

export type PaymentHistoryItem = {
  id: string;
  serviceCategory: string;
  serviceTitle: string;
  provider: string;
  amount: number;
  paidAt: string;
  paymentMethod: string;
  status: "paid" | "refunded";
};

export type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  isDefault?: boolean;
  kind: "home" | "office" | "other";
};

export type BookingStatus = "upcoming" | "completed" | "cancelled";

export type Booking = {
  id: string;
  service: string;
  provider: string;
  schedule: string;
  location: string;
  status: BookingStatus;
  statusLabel: string;
  badgeTone: "green" | "amber" | "slate";
  thumbnail: string;
};

export type SettingItem = {
  id: string;
  label: string;
  tone?: "default" | "danger";
  icon: "user" | "lock" | "bell" | "help" | "alert" | "privacy" | "terms" | "trash" | "logout";
};

export type SettingGroup = {
  title: string;
  items: SettingItem[];
};

export type ProfileOverviewData = {
  profile: CustomerProfile;
  favoriteProviders: FavoriteProvider[];
  paymentMethods: PaymentMethod[];
  paymentSummary: {
    totalPaid: number;
    lastPaymentLabel: string;
  };
  bookingSummary: {
    upcoming: number;
    completed: number;
    cancelled: number;
  };
};
