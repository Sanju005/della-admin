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
