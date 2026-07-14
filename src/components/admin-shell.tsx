import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
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
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/auth-provider";
import type { NavItem } from "../types";

const navigation: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Users", to: "/users", icon: Users },
  { label: "Admins", to: "/admins", icon: BadgeCheck },
  { label: "Providers", to: "/service-providers", icon: BriefcaseBusiness },
  { label: "Tasks / Bookings", to: "/tasks-bookings", icon: ClipboardList },
  { label: "Collections / Payments", to: "/payments", icon: CircleDollarSign },
  { label: "Services", to: "/provider-approvals", icon: ShieldCheck },
  { label: "Reviews", to: "/reviews", icon: MessageSquareHeart },
  { label: "Reports", to: "/complaints", icon: MessageSquareWarning, count: 5 },
  { label: "Settings", to: "/settings", icon: Settings },
];

const breadcrumbTitles: Array<{ match: RegExp; items: string[] }> = [
  { match: /^\/$/, items: ["Dashboard"] },
  { match: /^\/users\/[^/]+$/, items: ["Users", "User Details"] },
  { match: /^\/users$/, items: ["Users"] },
  { match: /^\/admins$/, items: ["Admins"] },
  { match: /^\/service-providers\/[^/]+$/, items: ["Providers", "Provider Details"] },
  { match: /^\/service-providers$/, items: ["Providers"] },
  { match: /^\/tasks-bookings$/, items: ["Bookings"] },
  { match: /^\/payments$/, items: ["Payments"] },
  { match: /^\/provider-approvals$/, items: ["Services"] },
  { match: /^\/reviews$/, items: ["Reviews"] },
  { match: /^\/complaints$/, items: ["Reports"] },
  { match: /^\/settings$/, items: ["Settings"] },
];

export function AdminShell() {
  const location = useLocation();
  const { profile, session, signOut, updateProfile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const profilePanelRef = useRef<HTMLDivElement | null>(null);
  const displayName = profile?.full_name?.trim() || session?.user.email || "User";
  const displayRole = profile?.role?.replaceAll("_", " ") || "Signed in";

  const breadcrumbs = useMemo(
    () => breadcrumbTitles.find((entry) => entry.match.test(location.pathname))?.items ?? ["Dashboard"],
    [location.pathname]
  );
  const pageTitle = breadcrumbs[breadcrumbs.length - 1] ?? "Dashboard";
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

  useEffect(() => {
    setProfileName(profile?.full_name?.trim() || "");
  }, [profile?.full_name]);

  useEffect(() => {
    if (!profileOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!profilePanelRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
        setProfileEditing(false);
        setProfileMessage(null);
        setProfileError(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [profileOpen]);

  async function handleSaveProfile() {
    setProfileSaving(true);
    setProfileMessage(null);
    setProfileError(null);

    const error = await updateProfile({
      full_name: profileName,
    });

    setProfileSaving(false);

    if (error) {
      setProfileError(error);
      return;
    }

    setProfileEditing(false);
    setProfileMessage("Profile updated.");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,66,145,0.08),transparent_20%),linear-gradient(180deg,#fffafc_0%,#f7f6f8_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1720px] gap-4 p-3 lg:p-4">
        <aside
          className={`fixed inset-y-3 left-3 z-40 flex w-[255px] flex-col overflow-y-auto rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#052E25_0%,#06352A_38%,#0B2A24_100%)] px-3 py-4 shadow-[0_30px_90px_rgba(5,46,37,0.28)] transition duration-300 lg:left-4 lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-[120%]"
          }`}
        >
          <div className="flex items-center justify-between px-2">
            <Link to="/" className="block h-10 w-24" aria-label="Admin dashboard home" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid size-9 place-items-center rounded-2xl bg-white/10 text-white lg:hidden"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="mt-7 space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between rounded-[14px] px-3 py-3 text-[15px] font-semibold transition ${
                    isActive
                      ? "bg-[linear-gradient(135deg,#E13A81,#F45DA0)] text-white shadow-[0_14px_36px_rgba(225,58,129,0.32)]"
                      : "text-white/90 hover:bg-white/8"
                  }`}
                >
                  <span className="flex items-center gap-3 text-white">
                    <Icon className="size-4.5 shrink-0 text-white" />
                    {item.label}
                  </span>
                  {item.count ? (
                    <span className="rounded-full bg-white/18 px-2 py-0.5 text-[11px] text-white">
                      {item.count}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-white/10 pt-4" />

          <div className="mt-auto flex min-h-[120px] items-end px-1">
            <div className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-[linear-gradient(135deg,#0E7A57,#12A56E)] text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-xs capitalize text-white/65">
                    {displayRole}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-3 w-full rounded-2xl border border-[#FFB8D6]/20 bg-[linear-gradient(135deg,#E13A81,#F45DA0)] px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
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

        <div className="flex min-h-[calc(100vh-1.5rem)] flex-1 flex-col rounded-[30px] bg-transparent p-1 lg:ml-[271px] lg:p-2">
          <header className="flex flex-col gap-4 rounded-[22px] border border-[#EEE5EC] bg-white px-5 py-3 shadow-[0_12px_30px_rgba(225,58,129,0.06)] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="grid size-11 place-items-center rounded-2xl bg-[#E13A81] text-white lg:hidden"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <h1 className="font-display text-[2.1rem] font-extrabold tracking-tight text-slate-950">
                  {pageTitle}
                </h1>
                <p className="text-sm text-slate-500">
                  {breadcrumbs.length > 1 ? breadcrumbs.slice(0, -1).join(" / ") : "Admin overview"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="flex min-w-[280px] items-center gap-3 rounded-full border border-[#EEE5EC] bg-white px-5 py-3 text-sm text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] md:min-w-[350px] xl:min-w-[420px]">
                <Search className="size-4" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                className="relative grid size-11 place-items-center rounded-full border border-[#EEE5EC] bg-white text-slate-600"
              >
                <Bell className="size-5" />
                <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-[#EF233C] text-[10px] font-bold text-white">
                  2
                </span>
              </button>
              <div ref={profilePanelRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((current) => !current);
                    setProfileEditing(false);
                    setProfileMessage(null);
                    setProfileError(null);
                    setProfileName(profile?.full_name?.trim() || "");
                  }}
                  className="flex items-center gap-3 rounded-full border border-[#EEE5EC] bg-white px-3 py-2 text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
                >
                  <div className="grid size-10 place-items-center rounded-full bg-[linear-gradient(135deg,#0E7A57,#0A563D)] text-sm font-bold text-white">
                    {initials}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="max-w-[120px] truncate text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="max-w-[120px] truncate text-xs capitalize text-slate-500">{displayRole}</p>
                  </div>
                  <ChevronDown className="size-4 text-slate-500" />
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-40 w-[340px] rounded-[24px] border border-[#EEE5EC] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                    <div className="flex items-center gap-3">
                      <div className="grid size-12 place-items-center rounded-full bg-[linear-gradient(135deg,#0E7A57,#0A563D)] text-base font-bold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-slate-950">{displayName}</p>
                        <p className="truncate text-sm text-slate-500">{profile?.email ?? session?.user.email ?? "No email"}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-[20px] bg-slate-50 p-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Role</p>
                        <p className="mt-1 text-sm font-semibold capitalize text-slate-700">{displayRole}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Status</p>
                        <p className="mt-1 text-sm font-semibold capitalize text-slate-700">{profile?.status ?? "Active"}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-950">User Profile</h3>
                        {!profileEditing ? (
                          <button
                            type="button"
                            onClick={() => {
                              setProfileEditing(true);
                              setProfileMessage(null);
                              setProfileError(null);
                            }}
                            className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700"
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>

                      <label className="mt-3 block text-sm font-medium text-slate-700">
                        Full Name
                        <input
                          type="text"
                          value={profileName}
                          onChange={(event) => setProfileName(event.target.value)}
                          disabled={!profileEditing || profileSaving}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </label>

                      <label className="mt-3 block text-sm font-medium text-slate-700">
                        Email
                        <input
                          type="text"
                          value={profile?.email ?? session?.user.email ?? ""}
                          disabled
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                        />
                      </label>

                      {profileMessage ? (
                        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                          {profileMessage}
                        </div>
                      ) : null}

                      {profileError ? (
                        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                          {profileError}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap justify-between gap-3">
                        {profileEditing ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileEditing(false);
                                setProfileName(profile?.full_name?.trim() || "");
                                setProfileMessage(null);
                                setProfileError(null);
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSaveProfile()}
                              disabled={profileSaving}
                              className="rounded-xl bg-[linear-gradient(135deg,#0f8b3d,#16a34a)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              {profileSaving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        ) : <span />}

                        <button
                          type="button"
                          onClick={() => void signOut()}
                          className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700"
                        >
                          Log out
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="mt-4 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
