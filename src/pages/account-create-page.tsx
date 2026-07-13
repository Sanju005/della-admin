import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createAdminManagedAccount,
  type CreateAccountInput,
} from "../lib/admin-account-creation";

type AccountCreatePageProps = {
  accountType: "customer" | "provider";
};

const availabilityDayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="space-y-2 text-sm font-medium text-slate-700">{children}</label>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 ${props.className ?? ""}`}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 ${props.className ?? ""}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 ${props.className ?? ""}`}
    />
  );
}

export function AccountCreatePage({ accountType }: AccountCreatePageProps) {
  const navigate = useNavigate();
  const isProvider = accountType === "provider";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    status: isProvider ? "pending" : "active",
    dob: "",
    gender: "",
    city: "",
    region: "",
    country: "Malaysia",
    marketingName: "",
    profilePhotoUrl: "",
    serviceType: "",
    serviceLocation: "",
    address: "",
    bio: "",
    serviceRadiusKm: "",
    yearsExperience: "",
    hourlyRate: "",
    dailyRate: "",
    availabilityPreset: "",
    availabilityStartTime: "",
    availabilityEndTime: "",
    approvalStatus: "pending",
    visible: false,
    emailVerified: true,
    phoneVerified: false,
    identityVerified: false,
    kycVerified: false,
    backgroundCheckVerified: false,
  });
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);

  function updateField(key: string, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleAvailabilityDay(day: string) {
    setAvailabilityDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = form.fullName.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPassword = form.password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setError("Full name, email, and password are required.");
      return;
    }

    const payload: CreateAccountInput = isProvider
      ? {
          accountType: "provider",
          fullName: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
          phone: form.phone.trim() || undefined,
          status: form.status,
          dob: form.dob || undefined,
          gender: form.gender || undefined,
          city: form.city.trim() || undefined,
          region: form.region.trim() || undefined,
          country: form.country.trim() || undefined,
          marketingName: form.marketingName.trim() || undefined,
          profilePhotoUrl: form.profilePhotoUrl.trim() || undefined,
          serviceType: form.serviceType.trim() || undefined,
          serviceLocation: form.serviceLocation.trim() || undefined,
          address: form.address.trim() || undefined,
          bio: form.bio.trim() || undefined,
          serviceRadiusKm: form.serviceRadiusKm ? Number(form.serviceRadiusKm) : undefined,
          yearsExperience: form.yearsExperience.trim() || undefined,
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
          dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
          availabilityDays,
          availabilityPreset: form.availabilityPreset.trim() || undefined,
          availabilityStartTime: form.availabilityStartTime || undefined,
          availabilityEndTime: form.availabilityEndTime || undefined,
          approvalStatus: form.approvalStatus,
          visible: form.visible,
          emailVerified: form.emailVerified,
          phoneVerified: form.phoneVerified,
          identityVerified: form.identityVerified,
          kycVerified: form.kycVerified,
          backgroundCheckVerified: form.backgroundCheckVerified,
        }
      : {
          accountType: "customer",
          fullName: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
          phone: form.phone.trim() || undefined,
          status: form.status,
          dob: form.dob || undefined,
          gender: form.gender || undefined,
          city: form.city.trim() || undefined,
          region: form.region.trim() || undefined,
          country: form.country.trim() || undefined,
        };

    setSaving(true);
    setError(null);

    const result = await createAdminManagedAccount(payload);

    setSaving(false);

    if (result.error || !result.userId) {
      setError(result.error || "Unable to create account.");
      return;
    }

    navigate(isProvider ? `/service-providers/${result.userId}` : `/users/${result.userId}`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950">
              {isProvider ? "Create Service Provider" : "Create User"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Create a real app account from admin. After save, the new {isProvider ? "provider" : "user"} can sign in from the app with this email and password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(isProvider ? "/service-providers" : "/users")}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Back
          </button>
        </div>
      </section>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
        <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
          <h2 className="text-lg font-bold text-slate-950">Account Details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FieldLabel>
              <span>Full Name</span>
              <TextInput
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="Enter full name"
                required
              />
            </FieldLabel>
            <FieldLabel>
              <span>Email</span>
              <TextInput
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="name@email.com"
                required
              />
            </FieldLabel>
            <FieldLabel>
              <span>Password</span>
              <TextInput
                type="text"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Temporary login password"
                required
              />
            </FieldLabel>
            <FieldLabel>
              <span>Phone</span>
              <TextInput
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+60123456789"
              />
            </FieldLabel>
            <FieldLabel>
              <span>Status</span>
              <SelectInput
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="paused">Paused</option>
                <option value="suspended">Suspended</option>
              </SelectInput>
            </FieldLabel>
            <FieldLabel>
              <span>Date of Birth</span>
              <TextInput
                type="date"
                value={form.dob}
                onChange={(event) => updateField("dob", event.target.value)}
              />
            </FieldLabel>
            <FieldLabel>
              <span>Gender</span>
              <SelectInput
                value={form.gender}
                onChange={(event) => updateField("gender", event.target.value)}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </SelectInput>
            </FieldLabel>
            <FieldLabel>
              <span>City</span>
              <TextInput
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                placeholder="Kuala Lumpur"
              />
            </FieldLabel>
            <FieldLabel>
              <span>Region / State</span>
              <TextInput
                value={form.region}
                onChange={(event) => updateField("region", event.target.value)}
                placeholder="Kuala Lumpur"
              />
            </FieldLabel>
            <FieldLabel>
              <span>Country</span>
              <TextInput
                value={form.country}
                onChange={(event) => updateField("country", event.target.value)}
                placeholder="Malaysia"
              />
            </FieldLabel>
          </div>
        </section>

        {isProvider ? (
          <>
            <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
              <h2 className="text-lg font-bold text-slate-950">Provider Profile</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FieldLabel>
                  <span>Marketing Name</span>
                  <TextInput
                    value={form.marketingName}
                    onChange={(event) => updateField("marketingName", event.target.value)}
                    placeholder="Display / business name"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Service Type</span>
                  <TextInput
                    value={form.serviceType}
                    onChange={(event) => updateField("serviceType", event.target.value)}
                    placeholder="Driver, Cleaner, Electrician"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Service Location</span>
                  <TextInput
                    value={form.serviceLocation}
                    onChange={(event) => updateField("serviceLocation", event.target.value)}
                    placeholder="Kuala Lumpur"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Profile Image URL</span>
                  <TextInput
                    value={form.profilePhotoUrl}
                    onChange={(event) => updateField("profilePhotoUrl", event.target.value)}
                    placeholder="https://..."
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Service Radius (km)</span>
                  <TextInput
                    type="number"
                    min="0"
                    step="1"
                    value={form.serviceRadiusKm}
                    onChange={(event) => updateField("serviceRadiusKm", event.target.value)}
                    placeholder="15"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Years Experience</span>
                  <TextInput
                    value={form.yearsExperience}
                    onChange={(event) => updateField("yearsExperience", event.target.value)}
                    placeholder="3 years"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Hourly Rate</span>
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.hourlyRate}
                    onChange={(event) => updateField("hourlyRate", event.target.value)}
                    placeholder="40"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Daily Rate</span>
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.dailyRate}
                    onChange={(event) => updateField("dailyRate", event.target.value)}
                    placeholder="250"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Approval Status</span>
                  <SelectInput
                    value={form.approvalStatus}
                    onChange={(event) => updateField("approvalStatus", event.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="document_review">Document Review</option>
                    <option value="approved">Approved</option>
                  </SelectInput>
                </FieldLabel>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <FieldLabel>
                  <span>Residential Address</span>
                  <TextArea
                    rows={4}
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="Enter full address"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>About</span>
                  <TextArea
                    rows={4}
                    value={form.bio}
                    onChange={(event) => updateField("bio", event.target.value)}
                    placeholder="Short provider bio"
                  />
                </FieldLabel>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]">
              <h2 className="text-lg font-bold text-slate-950">Availability & Verification</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FieldLabel>
                  <span>Availability Preset</span>
                  <TextInput
                    value={form.availabilityPreset}
                    onChange={(event) => updateField("availabilityPreset", event.target.value)}
                    placeholder="Weekdays / Full day / Custom time"
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>Start Time</span>
                  <TextInput
                    type="time"
                    value={form.availabilityStartTime}
                    onChange={(event) => updateField("availabilityStartTime", event.target.value)}
                  />
                </FieldLabel>
                <FieldLabel>
                  <span>End Time</span>
                  <TextInput
                    type="time"
                    value={form.availabilityEndTime}
                    onChange={(event) => updateField("availabilityEndTime", event.target.value)}
                  />
                </FieldLabel>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-700">Availability Days</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availabilityDayOptions.map((day) => {
                    const active = availabilityDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleAvailabilityDay(day)}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {([
                  ["visible", "Visible in admin/app"],
                  ["emailVerified", "Email verified"],
                  ["phoneVerified", "Phone verified"],
                  ["identityVerified", "Identity verified"],
                  ["kycVerified", "KYC verified"],
                  ["backgroundCheckVerified", "Background check verified"],
                ] as Array<[string, string]>).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form[key as keyof typeof form])}
                      onChange={(event) => updateField(key, event.target.checked)}
                      className="size-4 rounded border-slate-300"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(isProvider ? "/service-providers" : "/users")}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[linear-gradient(135deg,#0f8b3d,#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,139,61,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : isProvider ? "Create Provider" : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}
