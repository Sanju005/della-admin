"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  LogOut,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Save,
  ShieldCheck,
} from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

type ProviderDashboardData = {
  providerId: string;
  fullName: string;
  email: string;
  phone: string;
  accountStatus: string;
  marketingName: string;
  serviceLocation: string;
  serviceRadiusKm: number;
  bio: string;
  approvalStatus: string;
  isVisible: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  kycVerified: boolean;
  backgroundCheckVerified: boolean;
  services: Array<{
    id: string;
    serviceType: string;
    yearsExperience: string;
    hourlyRate: number;
    dailyRate: number;
    specialties: string[];
  }>;
};

function VerificationPill({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold ${
        active
          ? "bg-[#EAF8EE] text-[#15803D]"
          : "bg-[#F3F4F6] text-[#6B7280]"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          active ? "bg-[#16A34A]" : "bg-[#9CA3AF]"
        }`}
      />
      {label}
    </span>
  );
}

export function ProviderDashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<ProviderDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const [form, setForm] = useState({
    fullName: "",
    marketingName: "",
    serviceLocation: "",
    serviceRadiusKm: "0",
    bio: "",
  });

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();

    async function loadDashboard() {
      if (!client) {
        if (active) {
          setError("Supabase is not configured yet.");
          setLoading(false);
        }
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!active) {
        return;
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/provider/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = (await response.json()) as ProviderDashboardData | { error?: string };

      if (!active) {
        return;
      }

      if (!response.ok || !("providerId" in result)) {
        setError("error" in result && result.error ? result.error : "Unable to load provider dashboard.");
        setLoading(false);
        return;
      }

      setData(result);
      setForm({
        fullName: result.fullName,
        marketingName: result.marketingName,
        serviceLocation: result.serviceLocation,
        serviceRadiusKm: String(result.serviceRadiusKm),
        bio: result.bio,
      });
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  const serviceSummary = useMemo(() => {
    return data?.services.map((service) => ({
      ...service,
      label: service.serviceType
        .replaceAll("_", " ")
        .split(" ")
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" "),
    })) ?? [];
  }, [data]);

  async function handleSignOut() {
    const client = getSupabaseClient();
    if (!client) {
      router.replace("/login");
      return;
    }

    await client.auth.signOut();
    router.replace("/login");
  }

  function handleSave() {
    const client = getSupabaseClient();

    startTransition(async () => {
      setError("");
      setNotice("");

      if (!client) {
        setError("Supabase is not configured yet.");
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/provider/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: form.fullName,
          marketingName: form.marketingName,
          serviceLocation: form.serviceLocation,
          serviceRadiusKm: Number(form.serviceRadiusKm),
          bio: form.bio,
        }),
      });

      const result = (await response.json()) as ProviderDashboardData | { error?: string };

      if (!response.ok || !("providerId" in result)) {
        setError("error" in result && result.error ? result.error : "Unable to update listing.");
        return;
      }

      setData(result);
      setEditing(false);
      setNotice("Provider listing updated.");
    });
  }

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-[#f6fff8] px-4 py-6">
        <div className="mx-auto grid max-w-[430px] min-h-[40vh] place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-[100dvh] bg-[#f6fff8] px-4 py-6">
        <div className="mx-auto max-w-[430px] rounded-[28px] border border-[#dbe8df] bg-white p-5 shadow-[0_20px_60px_rgba(22,163,74,0.08)]">
          <h1 className="text-[28px] font-extrabold tracking-[-0.05em] text-[#16a34a]">
            Provider Dashboard
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#6b7280]">
            {error || "We couldn't load your provider account right now."}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[12px] bg-[#16a34a] px-4 text-[14px] font-extrabold text-white"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f6fff8] px-4 py-6">
      <div className="mx-auto max-w-[430px] space-y-4">
        <section className="rounded-[28px] border border-[#dbe8df] bg-white p-5 shadow-[0_20px_60px_rgba(22,163,74,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#16a34a]">
                Provider Dashboard
              </p>
              <h1 className="mt-2 text-[28px] font-extrabold tracking-[-0.05em] text-[#111827]">
                {data.marketingName || data.fullName}
              </h1>
              <p className="mt-1 text-[14px] text-[#4b5563]">{data.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe8df] text-[#16a34a]"
              aria-label="Sign out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <VerificationPill label={`Account ${data.accountStatus}`} active={true} />
            <VerificationPill label={data.emailVerified ? "Email Verified" : "Email Not Verified"} active={data.emailVerified} />
            <VerificationPill label={data.approvalStatus === "Approved" ? "Admin Approved" : "Pending Admin Review"} active={data.approvalStatus === "Approved"} />
            <VerificationPill label={data.isVisible ? "Listing Live" : "Listing Hidden"} active={data.isVisible} />
          </div>

          <div className="mt-4 rounded-[18px] border border-[#e4ece7] bg-[#fbfffc] p-4 text-[13px] leading-6 text-[#4b5563]">
            Your listing can stay live while verification is still in progress. The public verified badge only appears after the required checks are complete.
          </div>

          {error ? (
            <p className="mt-4 rounded-[14px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[13px] font-semibold text-[#dc2626]">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="mt-4 rounded-[14px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[13px] font-semibold text-[#15803d]">
              {notice}
            </p>
          ) : null}
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-extrabold text-[#111827]">Manage Listing</h2>
            <button
              type="button"
              onClick={() => setEditing((current) => !current)}
              className="inline-flex items-center gap-2 rounded-[12px] border border-[#dbe8df] px-3 py-2 text-[13px] font-bold text-[#16a34a]"
            >
              <PencilLine className="h-4 w-4" />
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Full Name" value={form.fullName} editing={editing} onChange={(value) => setForm((current) => ({ ...current, fullName: value }))} />
            <Field label="Marketing Name" value={form.marketingName} editing={editing} onChange={(value) => setForm((current) => ({ ...current, marketingName: value }))} />
            <Field label="Service Location" value={form.serviceLocation} editing={editing} onChange={(value) => setForm((current) => ({ ...current, serviceLocation: value }))} icon={<MapPin className="h-4 w-4 text-[#6b7280]" />} />
            <Field label="Service Radius (KM)" value={form.serviceRadiusKm} editing={editing} onChange={(value) => setForm((current) => ({ ...current, serviceRadiusKm: value }))} />
            <FieldArea label="Bio" value={form.bio} editing={editing} onChange={(value) => setForm((current) => ({ ...current, bio: value }))} />
          </div>

          {editing ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#16a34a] px-4 text-[14px] font-extrabold text-white disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Listing"}
            </button>
          ) : null}
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <h2 className="text-[18px] font-extrabold text-[#111827]">Verification Status</h2>
          <div className="mt-4 grid gap-3">
            <StatusRow icon={<Mail className="h-4.5 w-4.5 text-[#16a34a]" />} label="Email" value={data.emailVerified ? "Verified" : "Not verified"} />
            <StatusRow icon={<Phone className="h-4.5 w-4.5 text-[#16a34a]" />} label="Phone" value={data.phoneVerified ? "Verified" : "Pending"} />
            <StatusRow icon={<ShieldCheck className="h-4.5 w-4.5 text-[#16a34a]" />} label="Identity" value={data.identityVerified ? "Verified" : "Pending"} />
            <StatusRow icon={<BadgeCheck className="h-4.5 w-4.5 text-[#16a34a]" />} label="Admin Approval" value={data.approvalStatus} />
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dbe8df] bg-white p-5 shadow-[0_18px_50px_rgba(22,163,74,0.07)]">
          <h2 className="text-[18px] font-extrabold text-[#111827]">Services</h2>
          <div className="mt-4 space-y-3">
            {serviceSummary.map((service) => (
              <div key={service.id} className="rounded-[18px] border border-[#e4ece7] bg-[#fbfffc] p-4">
                <p className="text-[15px] font-extrabold text-[#111827]">{service.label}</p>
                <p className="mt-1 text-[13px] text-[#4b5563]">
                  {service.yearsExperience || "Experience not set"} - RM{service.hourlyRate}/hr - RM{service.dailyRate}/day
                </p>
                <p className="mt-2 text-[12px] text-[#6b7280]">
                  {service.specialties.length > 0
                    ? service.specialties.join(", ")
                    : "No specialties added yet."}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  editing,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-[#111827]">{label}</span>
      <div className="flex items-center rounded-[12px] border border-[#dfe8e2] px-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={!editing}
          className="h-11 w-full border-0 bg-transparent text-[14px] text-[#111827] outline-none disabled:text-[#6b7280]"
        />
        {icon ? <span className="ml-3">{icon}</span> : null}
      </div>
    </label>
  );
}

function FieldArea({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-[#111827]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!editing}
        className="min-h-[110px] w-full rounded-[12px] border border-[#dfe8e2] px-4 py-3 text-[14px] text-[#111827] outline-none shadow-[0_8px_20px_rgba(15,23,42,0.03)] disabled:text-[#6b7280]"
      />
    </label>
  );
}

function StatusRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#e4ece7] bg-[#fbfffc] px-4 py-3">
      <div className="flex items-center gap-3 text-[14px] text-[#111827]">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <span className="text-[13px] font-bold text-[#16a34a]">{value}</span>
    </div>
  );
}
