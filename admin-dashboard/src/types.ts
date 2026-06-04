import type { LucideIcon } from "lucide-react";

export type AdminRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "customer_care"
  | "customer"
  | "provider"
  | string;

export type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AdminRole | null;
  status: string | null;
};

export type AuthAccess = "guest" | "allowed" | "denied";

export type MetricCard = {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  accent: string;
};

export type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
};

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  count?: number;
  disabled?: boolean;
};

export type StatusTone =
  | "emerald"
  | "green"
  | "sky"
  | "amber"
  | "rose"
  | "slate"
  | "violet";

export type DashboardBooking = {
  id: string;
  service: string;
  provider: string;
  customer: string;
  status: string;
  amount: string;
  schedule: string;
};

export type PaymentRow = {
  id: string;
  customer: string;
  provider: string;
  amount: string;
  method: string;
  status: string;
  date: string;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  city: string;
  joined: string;
};

export type ProviderRow = {
  id: string;
  provider: string;
  service: string;
  rating: string;
  status: string;
  zone: string;
  verification: string;
};

export type ReviewRow = {
  id: string;
  customer: string;
  provider: string;
  rating: string;
  comment: string;
  status: string;
  date: string;
};

export type ComplaintRow = {
  id: string;
  ticket: string;
  subject: string;
  customer: string;
  owner: string;
  status: string;
  priority: string;
  updated: string;
};

export type ApprovalItem = {
  title: string;
  pending: number;
  accent: string;
  note: string;
};

export type UserAddress = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  tag?: string;
};

export type UserTimelineItem = {
  id: string;
  title: string;
  note: string;
  time: string;
  tone: StatusTone;
};

export type UserActionItem = {
  id: string;
  label: string;
  time: string;
};

export type UserDocumentItem = {
  id: string;
  label: string;
  status: string;
  updated: string;
};

export type UserReportItem = {
  id: string;
  title: string;
  status: string;
  submitted: string;
};

export type UserReviewItem = {
  id: string;
  provider: string;
  rating: number;
  review: string;
  date: string;
};

export type UserMetric = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: StatusTone;
};

export type UserDetailRecord = {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone: string;
  dob: string;
  gender: string;
  city: string;
  joined: string;
  lastLogin: string;
  registeredAt: string;
  device: string;
  ipAddress: string;
  referrer: string;
  accountType: string;
  loginCount: string;
  failedLogins: string;
  twoFactorAuth: string;
  walletBalance: string;
  totalSpent: string;
  reviewsGiven: string;
  reportsSubmitted: string;
  completionRate: string;
  cancellationRate: string;
  averageRating: string;
  emailVerifiedAt: string;
  phoneVerifiedAt: string;
  kycVerifiedAt: string;
  addresses: UserAddress[];
  timeline: UserTimelineItem[];
  recentActions: UserActionItem[];
  documents: UserDocumentItem[];
  reports: UserReportItem[];
  recentReviews: UserReviewItem[];
  metrics: UserMetric[];
};
