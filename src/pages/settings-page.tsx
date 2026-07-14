import { CheckCircle2, Globe2, LockKeyhole, Save, Shield, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  listServiceCommissionSettings,
  saveServiceCommissionSettings,
  type ServiceCommissionSetting,
} from "../lib/admin-settings";

const settingsGroups = [
  {
    title: "Sign in",
    icon: LockKeyhole,
    items: [
      "Supabase Auth handles sign-in with email and password.",
      "Correct credentials sign in immediately.",
      "Wrong credentials show a simple error message.",
    ],
  },
  {
    title: "Platform controls",
    icon: Shield,
    items: [
      "Review approval queues before exposing new provider listings.",
      "Use complaints and reviews to monitor trust and quality signals.",
      "Keep payout review tightly scoped to finance and management roles.",
    ],
  },
  {
    title: "Deployment",
    icon: Globe2,
    items: [
      "Deploy this app separately to Cloudflare Workers.",
      "Map the Worker to admin.dellaapp.com after deploy.",
      "Reuse the same Supabase project but keep frontend code isolated.",
    ],
  },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<ServiceCommissionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextSettings = await listServiceCommissionSettings();

        if (!active) {
          return;
        }

        setSettings(
          nextSettings.map((item) => ({
            ...item,
            commissionPercent: Number(item.commissionPercent ?? 5),
          })),
        );
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load settings.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const averageCommission = useMemo(() => {
    if (!settings.length) {
      return 5;
    }

    const total = settings.reduce((sum, item) => sum + Number(item.commissionPercent || 0), 0);
    return total / settings.length;
  }, [settings]);

  function updateCommission(serviceKey: string, value: string) {
    const parsed = Number(value);
    const normalized = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;

    setSettings((current) =>
      current.map((item) =>
        item.serviceKey === serviceKey
          ? {
              ...item,
              commissionPercent: normalized,
            }
          : item,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await saveServiceCommissionSettings(settings);
      setMessage("Service commission settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,#08140f,#0f8b3d_48%,#6d28d9)] p-6 text-white shadow-[0_28px_90px_rgba(8,20,15,0.24)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-100">
              DELLA admin settings
            </p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight">
              Operational guardrails, not just UI preferences.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90">
              Manage platform defaults like service commission percentages while keeping admin deployment and routing isolated from the consumer app.
            </p>
          </div>
          <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-emerald-100" />
              <p className="font-semibold">Default commission</p>
            </div>
            <p className="mt-3 text-sm text-emerald-50/90">
              New services start at `5%`. Admin can override each service below and save the live commission defaults.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-950">Service Commission Settings</h3>
            <p className="mt-2 text-sm text-slate-500">
              Set how much commission DELLA keeps for each service category.
            </p>
          </div>
          <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Average</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-900">{averageCommission.toFixed(1)}%</p>
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-5 grid min-h-[220px] place-items-center rounded-[24px] border border-slate-200 bg-slate-50">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {settings.map((item) => (
                <div
                  key={item.serviceKey}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{item.serviceLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">Default is 5%</p>
                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={item.commissionPercent}
                      onChange={(event) => updateCommission(item.serviceKey, event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    />
                    <span className="text-sm font-semibold text-slate-500">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || loading || settings.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f8b3d,#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,139,61,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="size-4" />
                {saving ? "Saving..." : "Save Commission Settings"}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {settingsGroups.map((group) => {
          const Icon = group.icon;

          return (
            <article
              key={group.title}
              className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold text-slate-950">
                {group.title}
              </h3>
              <div className="mt-5 space-y-3">
                {group.items.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-slate-50/90 p-4">
                    <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                    <p className="text-sm leading-7 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
