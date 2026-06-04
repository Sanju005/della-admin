import {
  Bell,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MessageSquareHeart,
  MessageSquareWarning,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/auth-provider";
import type { NavItem } from "../types";

const navigation: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Users", to: "/users", icon: Users },
  { label: "Service Providers", to: "/service-providers", icon: BriefcaseBusiness },
  { label: "Provider Approvals", to: "/provider-approvals", icon: ShieldCheck, count: 14 },
  { label: "Tasks / Bookings", to: "/tasks-bookings", icon: ClipboardList },
  { label: "Payments", to: "/payments", icon: CircleDollarSign },
  { label: "Reviews", to: "/reviews", icon: MessageSquareHeart },
  { label: "Complaints", to: "/complaints", icon: MessageSquareWarning, count: 5 },
  { label: "Settings", to: "/settings", icon: Settings },
];

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/users": "Users",
  "/service-providers": "Service Providers",
  "/provider-approvals": "Provider Approvals",
  "/tasks-bookings": "Tasks / Bookings",
  "/payments": "Payments",
  "/reviews": "Reviews",
  "/complaints": "Complaints",
  "/settings": "Settings",
};

function formatToday() {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function AdminShell() {
  const location = useLocation();
  const { profile, session, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = profile?.full_name?.trim() || session?.user.email || "User";
  const displayRole = profile?.role?.replaceAll("_", " ") || "Signed in";

  const title = useMemo(() => routeTitles[location.pathname] ?? "DELLA Admin", [location.pathname]);
  const initials = useMemo(() => {
    const name = displayName.trim();

    if (!name) {
      return "DA";
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [displayName]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(103,232,170,0.3),_transparent_30%),linear-gradient(180deg,_#f6fff8_0%,_#eef8f0_38%,_#f8fafc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-4 lg:p-6">
        <aside
          className={`fixed inset-y-4 left-4 z-40 w-[290px] rounded-[30px] border border-white/80 bg-white/92 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur transition duration-300 lg:static lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-[120%]"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] text-white shadow-lg shadow-violet-500/25">
                <LayoutDashboard className="size-5" />
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold tracking-tight text-slate-950">
                  DELLA
                </p>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                  Admin Console
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-500 lg:hidden"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="mt-8 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] text-white shadow-lg shadow-violet-500/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`
                  }
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4.5" />
                    {item.label}
                  </span>
                  {item.count ? (
                    <span className="rounded-full bg-white/18 px-2 py-0.5 text-xs">
                      {item.count}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[24px] border border-emerald-100 bg-[linear-gradient(180deg,#0f8b3d_0%,#0a6f31_100%)] p-4 text-white shadow-[0_24px_60px_rgba(15,139,61,0.28)]">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-100">Live Control</p>
            <h3 className="mt-2 font-display text-xl font-bold">Ops snapshot is healthy</h3>
            <p className="mt-2 text-sm text-emerald-50/90">
              Approval queues are trending down and payment recovery is above target.
            </p>
          </div>

          <div className="mt-auto flex h-[calc(100%-44rem)] min-h-10 items-end">
            <div className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0f8b3d,#34d399)] text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">
                    {displayName}
                  </p>
                  <p className="truncate text-sm capitalize text-slate-500">
                    {displayRole}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {menuOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          />
        ) : null}

        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[34px] border border-white/70 bg-white/55 p-4 shadow-[0_30px_100px_rgba(15,23,42,0.06)] backdrop-blur lg:p-6">
          <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] lg:flex-row lg:items-center lg:justify-between lg:p-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white lg:hidden"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  DELLA Operations
                </p>
                <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <Search className="size-4" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
                <span className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-slate-400 ring-1 ring-slate-200">
                  Ctrl K
                </span>
              </label>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600"
              >
                <Bell className="size-5" />
              </button>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                {formatToday()}
              </div>
            </div>
          </header>

          <main className="mt-6 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
