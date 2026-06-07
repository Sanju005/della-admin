"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  LoaderCircle,
  MapPin,
  MessageCircleMore,
  ShieldCheck,
} from "lucide-react";

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";
type StatusTone = "pending" | "accepted" | "declined" | "completed" | "cancelled" | "info";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function MobilePage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(187,247,208,0.36),transparent_32%),linear-gradient(180deg,#f7fff8_0%,#eef9f1_100%)]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:px-5">
        <div className={cx("min-h-[100dvh] py-4", className)}>{children}</div>
      </div>
    </main>
  );
}

export function AppCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[24px] border border-[#e4ece7] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Back"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4faf5] text-[#16a34a]"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Link>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-[1.65rem] font-extrabold leading-tight tracking-[-0.05em] text-[#0f172a] sm:text-[1.9rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-[14px] leading-6 text-[#64748b] sm:text-[15px]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[18px] font-extrabold tracking-[-0.04em] text-[#0f172a]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-[13px] leading-5 text-[#64748b]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AppButton({
  children,
  className,
  disabled,
  href,
  icon,
  onClick,
  tone = "primary",
  type = "button",
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
  tone?: ButtonTone;
  type?: "button" | "submit";
}) {
  const classes = cx(
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-4 text-[14px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:px-5 sm:text-[15px]",
    tone === "primary" &&
      "bg-[#16a34a] text-white shadow-[0_16px_30px_rgba(22,163,74,0.22)] hover:bg-[#14863f]",
    tone === "secondary" &&
      "border border-[#dce7df] bg-white text-[#0f172a] shadow-[0_10px_22px_rgba(15,23,42,0.04)] hover:bg-[#f8fbf9]",
    tone === "ghost" && "bg-[#eef9f1] text-[#16a34a] hover:bg-[#e3f5e7]",
    tone === "danger" && "bg-[#fff1f1] text-[#dc2626] hover:bg-[#ffe4e6]",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {icon}
      {children}
    </button>
  );
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  return (
    <span
      className={cx(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
        tone === "pending" && "bg-[#fff7e8] text-[#b45309] ring-[#fcd34d]",
        tone === "accepted" && "bg-[#e9f9ec] text-[#15803d] ring-[#86efac]",
        tone === "declined" && "bg-[#fff1f2] text-[#dc2626] ring-[#fecdd3]",
        tone === "completed" && "bg-[#ecfeff] text-[#0f766e] ring-[#99f6e4]",
        tone === "cancelled" && "bg-[#eef2f7] text-[#475569] ring-[#d6dde6]",
        tone === "info" && "bg-[#eff6ff] text-[#1d4ed8] ring-[#bfdbfe]"
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#d8e3dc] bg-[#fbfefc] px-4 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef9f1] text-[#16a34a]">
        {icon ?? <Bell className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 text-[16px] font-extrabold text-[#0f172a]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[18rem] text-[14px] leading-6 text-[#64748b]">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingState({
  title = "Loading",
  description = "Please wait while we prepare this screen.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#e4ece7] bg-white px-4 py-8 text-center shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#16a34a]" />
      <h3 className="mt-4 text-[16px] font-extrabold text-[#0f172a]">{title}</h3>
      <p className="mt-2 text-[14px] leading-6 text-[#64748b]">{description}</p>
    </div>
  );
}

export function ProviderCard({
  href,
  name,
  service,
  priceLabel,
  rating,
  reviews,
  distanceLabel,
  portraitSrc,
  badge,
  subtitle,
}: {
  href: string;
  name: string;
  service: string;
  priceLabel: string;
  rating: string;
  reviews: string;
  distanceLabel: string;
  portraitSrc: string;
  badge?: ReactNode;
  subtitle?: string;
}) {
  return (
    <AppCard className="overflow-hidden p-0">
      <div className="relative h-40 bg-[#eef4ef]">
        <Image
          src={portraitSrc}
          alt={name}
          fill
          sizes="(max-width: 430px) 100vw, 320px"
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0f172a]/55 to-transparent" />
        {badge ? <div className="absolute left-3 top-3">{badge}</div> : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-extrabold text-[#0f172a]">{name}</h3>
            <p className="mt-1 text-[14px] font-medium text-[#334155]">{service}</p>
            {subtitle ? (
              <p className="mt-1 text-[12px] font-semibold text-[#16a34a]">{subtitle}</p>
            ) : null}
          </div>
          <Link
            href={href}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-[0_12px_24px_rgba(22,163,74,0.2)]"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-[#475569]">
          <span className="font-semibold text-[#0f172a]">⭐ {rating}</span>
          <span>{reviews}</span>
          <span>{distanceLabel}</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[#e8eeea] pt-4">
          <div>
            <p className="text-[12px] text-[#64748b]">From</p>
            <p className="text-[18px] font-extrabold text-[#16a34a]">{priceLabel}</p>
          </div>
          <AppButton href={href}>View Profile</AppButton>
        </div>
      </div>
    </AppCard>
  );
}

export function BookingCard({
  title,
  provider,
  schedule,
  location,
  statusLabel,
  statusTone,
  image,
  primaryAction,
  secondaryAction,
  notes,
}: {
  title: string;
  provider: string;
  schedule: string;
  location: string;
  statusLabel: string;
  statusTone: StatusTone;
  image?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  notes?: ReactNode;
}) {
  return (
    <AppCard>
      <div className="flex gap-3">
        <div className="flex h-[4.8rem] w-[4.8rem] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#eef9f1]">
          {image ?? <CalendarDays className="h-8 w-8 text-[#16a34a]" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-extrabold text-[#0f172a]">{title}</h3>
              <p className="mt-1 text-[14px] text-[#475569]">{provider}</p>
            </div>
            <StatusBadge label={statusLabel} tone={statusTone} />
          </div>
          <div className="mt-3 space-y-2 text-[13px] text-[#475569]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#16a34a]" />
              <span>{schedule}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#16a34a]" />
              <span>{location}</span>
            </div>
          </div>
          {notes ? <div className="mt-3">{notes}</div> : null}
          {primaryAction || secondaryAction ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {secondaryAction}
              {primaryAction}
            </div>
          ) : null}
        </div>
      </div>
    </AppCard>
  );
}

export function BottomNav({
  items,
}: {
  items: Array<{
    href: string;
    label: string;
    icon: ReactNode;
    active?: boolean;
  }>;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t border-[#e8ece8] bg-white/97 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur">
      <div className="flex items-center justify-between gap-1 text-[10.5px] font-medium text-[#8a94a6]">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "flex min-w-[3.1rem] flex-col items-center gap-1",
              item.active ? "text-[#16a34a]" : "text-[#8a94a6]"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            <span className="flex h-3 items-end">
              <span
                className={cx(
                  "rounded-full transition-all",
                  item.active ? "h-[3px] w-10 bg-[#16a34a]" : "h-[3px] w-6 bg-transparent"
                )}
              />
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function AuthInfoPanel({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <AppCard className="rounded-[30px] px-6 py-7">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f7ea] text-[#16a34a]">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#16a34a]">
            DELLA
          </p>
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">{title}</h1>
        </div>
      </div>
      <p className="mt-5 text-[15px] leading-7 text-[#64748b]">{description}</p>
    </AppCard>
  );
}

export function FeaturePill({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f7ea] px-4 py-2 text-[13px] font-bold text-[#15803d]">
      {icon}
      <span>{label}</span>
    </div>
  );
}

export function MessagePlaceholderCard() {
  return (
    <EmptyState
      title="Messages are coming next"
      description="Your booking conversations will appear here as soon as provider messaging is connected."
      icon={<MessageCircleMore className="h-6 w-6" />}
      action={
        <AppButton href="/profile/bookings" tone="secondary">
          View Bookings
        </AppButton>
      }
    />
  );
}

export function SecureNotice() {
  return (
    <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-[#64748b]">
      <ShieldCheck className="h-4 w-4 text-[#16a34a]" />
      <span>Secure marketplace experience powered by DELLA</span>
    </div>
  );
}
