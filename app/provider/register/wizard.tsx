"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import {
  availabilityDays,
  createDefaultProviderRegistration,
  documentTypes,
  sexOptions,
  serviceIcons,
  serviceSpecialties,
  timePresets,
} from "@/lib/provider-registration-config";
import type {
  ProviderRegistrationData,
  ProviderService,
} from "@/lib/provider-registration-types";
import { providerServices } from "@/lib/provider-registration-types";

type FlowStep =
  | { type: "basic"; label: string }
  | { type: "account"; label: string }
  | { type: "services"; label: string }
  | { type: "service-detail"; label: string; service: ProviderService }
  | { type: "availability"; label: string }
  | { type: "location"; label: string }
  | { type: "review"; label: string }
  | { type: "verification"; label: string }
  | { type: "identity"; label: string }
  | { type: "success"; label: string };

export function ProviderRegistrationWizard() {
  const [data, setData] = useState<ProviderRegistrationData>(
    createDefaultProviderRegistration()
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [registrationId, setRegistrationId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, startTransition] = useTransition();

  const steps = useMemo<FlowStep[]>(() => {
    const dynamicServiceSteps = data.selectedServices.map((service) => ({
      type: "service-detail" as const,
      label: `${service} Service Details`,
      service,
    }));

    return [
      { type: "basic", label: "Basic Profile" },
      { type: "account", label: "Account Details" },
      { type: "services", label: "Select Services" },
      ...dynamicServiceSteps,
      { type: "availability", label: "Availability" },
      { type: "location", label: "Provider Location" },
      { type: "review", label: "Review & Submit" },
      { type: "verification", label: "Verification - Step 1" },
      { type: "identity", label: "Verification - Step 2" },
      { type: "success", label: "Success" },
    ];
  }, [data.selectedServices]);

  const activeStep = steps[Math.min(stepIndex, steps.length - 1)];

  const goNext = () => {
    if (activeStep.type === "services" && data.selectedServices.length === 0) {
      return;
    }

    if (activeStep.type === "identity") {
      startTransition(async () => {
        setSubmitError("");

        const response = await fetch("/api/provider/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = (await response.json()) as
          | {
              id: string;
              status: string;
              phoneVerified: boolean;
              emailVerified: boolean;
              identityVerified: boolean;
            }
          | { error?: string };

        if (!response.ok || !("id" in result)) {
          setSubmitError(
            "error" in result && result.error
              ? result.error
              : "Unable to submit registration."
          );
          return;
        }

        setRegistrationId(result.id);
        setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      });

      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const updateBasic = (
    field: keyof ProviderRegistrationData["basicProfile"],
    value: string | number
  ) => {
    setData((current) => ({
      ...current,
      basicProfile: { ...current.basicProfile, [field]: value },
    }));
  };

  const updateAccount = (
    field: keyof ProviderRegistrationData["account"],
    value: string
  ) => {
    setData((current) => ({
      ...current,
      account: { ...current.account, [field]: value },
    }));
  };

  const toggleService = (service: ProviderService) => {
    setData((current) => {
      const selected = current.selectedServices.includes(service)
        ? current.selectedServices.filter((item) => item !== service)
        : [...current.selectedServices, service];

      return {
        ...current,
        selectedServices: selected,
      };
    });
  };

  const updateServiceDetail = (
    service: ProviderService,
    field: keyof ProviderRegistrationData["serviceDetails"][ProviderService],
    value: string | string[]
  ) => {
    setData((current) => ({
      ...current,
      serviceDetails: {
        ...current.serviceDetails,
        [service]: {
          ...current.serviceDetails[service],
          [field]: value,
        },
      },
    }));
  };

  const toggleSpecialty = (service: ProviderService, specialty: string) => {
    setData((current) => {
      const currentList = current.serviceDetails[service].specialties;
      const nextList = currentList.includes(specialty)
        ? currentList.filter((item) => item !== specialty)
        : [...currentList, specialty];

      return {
        ...current,
        serviceDetails: {
          ...current.serviceDetails,
          [service]: {
            ...current.serviceDetails[service],
            specialties: nextList,
          },
        },
      };
    });
  };

  const toggleAvailabilityDay = (day: string) => {
    setData((current) => {
      const days = current.availability.days.includes(day)
        ? current.availability.days.filter((item) => item !== day)
        : [...current.availability.days, day];

      return {
        ...current,
        availability: {
          ...current.availability,
          days,
        },
      };
    });
  };

  const updateAvailability = (
    field: keyof ProviderRegistrationData["availability"],
    value: string | string[]
  ) => {
    setData((current) => ({
      ...current,
      availability: { ...current.availability, [field]: value },
    }));
  };

  const updateVerification = (
    field: keyof ProviderRegistrationData["verification"],
    value: string | string[]
  ) => {
    setData((current) => ({
      ...current,
      verification: { ...current.verification, [field]: value },
    }));
  };

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f6fff8]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-4 py-4 sm:justify-center">
        <div className="safe-top safe-bottom-lg overflow-hidden rounded-[34px] border border-[#dbe8df] bg-white shadow-[0_20px_60px_rgba(22,163,74,0.08)]">
          <div className="px-5 pt-3">
            <StatusBar />
          </div>

          <div className="px-5 pb-6 pt-3">
            <div className="mb-5 flex items-center gap-3">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#111827]"
                  aria-label="Back"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
              ) : (
                <span className="inline-flex h-8 w-8" aria-hidden />
              )}
              <div className="min-w-0 flex-1 text-center">
                <h1 className="text-[22px] font-extrabold tracking-[-0.04em] text-[#111827]">
                  {screenHeading(activeStep)}
                </h1>
                <p className="mt-1 text-[12px] leading-5 text-[#6b7280]">
                  {screenSubtitle(activeStep)}
                </p>
              </div>
              <span className="inline-flex h-8 w-8" aria-hidden />
            </div>

            <ProgressHeader current={stepIndex} total={steps.length} label={activeStep.label} />

            {activeStep.type === "basic" ? (
              <BasicProfileStep data={data} updateBasic={updateBasic} />
            ) : null}
            {activeStep.type === "account" ? (
              <AccountDetailsStep data={data} updateAccount={updateAccount} />
            ) : null}
            {activeStep.type === "services" ? (
              <SelectServicesStep
                selectedServices={data.selectedServices}
                onToggle={toggleService}
              />
            ) : null}
            {activeStep.type === "service-detail" ? (
              <ServiceDetailsStep
                service={activeStep.service}
                details={data.serviceDetails[activeStep.service]}
                onUpdate={updateServiceDetail}
                onToggleSpecialty={toggleSpecialty}
              />
            ) : null}
            {activeStep.type === "availability" ? (
              <AvailabilityStep data={data} onToggleDay={toggleAvailabilityDay} onUpdate={updateAvailability} />
            ) : null}
            {activeStep.type === "location" ? (
              <ProviderLocationStep
                data={data}
                onUpdate={(field, value) =>
                  setData((current) => ({
                    ...current,
                    providerLocation: { ...current.providerLocation, [field]: value },
                  }))
                }
              />
            ) : null}
            {activeStep.type === "review" ? <ReviewStep data={data} /> : null}
            {activeStep.type === "verification" ? (
              <VerificationStep data={data} onUpdate={updateVerification} />
            ) : null}
            {activeStep.type === "identity" ? (
              <IdentityStep data={data} onUpdate={updateVerification} />
            ) : null}
            {activeStep.type === "success" ? (
              <SuccessStep data={data} registrationId={registrationId} />
            ) : null}

            {submitError ? (
              <p className="mt-4 rounded-[12px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[13px] font-semibold text-[#dc2626]">
                {submitError}
              </p>
            ) : null}

            {activeStep.type !== "success" ? (
              <button
                type="button"
                onClick={goNext}
                disabled={isSubmitting}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-[#16a34a] text-[15px] font-extrabold text-white shadow-[0_16px_30px_rgba(22,163,74,0.2)]"
              >
                {isSubmitting ? "Submitting..." : buttonLabel(activeStep)}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function BasicProfileStep({
  data,
  updateBasic,
}: {
  data: ProviderRegistrationData;
  updateBasic: (
    field: keyof ProviderRegistrationData["basicProfile"],
    value: string | number
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-[18px] bg-[#f8fbf8] p-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf8ee] text-[#16a34a]">
          <ProfilePhotoIcon className="h-8 w-8" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#111827]">Profile Image</p>
          <p className="mt-1 text-[12px] text-[#6b7280]">Select from phone</p>
        </div>
      </div>

      <InputField label="First Name" value={data.basicProfile.firstName} onChange={(value) => updateBasic("firstName", value)} />
      <InputField label="Last Name" value={data.basicProfile.lastName} onChange={(value) => updateBasic("lastName", value)} />
      <SelectField label="Sex" value={data.basicProfile.sex} onChange={(value) => updateBasic("sex", value)} options={sexOptions} placeholder="Select sex" />
      <InputField label="Marketing Name" hint="e.g. Ex Chef Amina" value={data.basicProfile.marketingName} onChange={(value) => updateBasic("marketingName", value)} />
      <InputField label="Date of Birth" value={data.basicProfile.dateOfBirth} onChange={(value) => updateBasic("dateOfBirth", value)} rightIcon={<CalendarIcon className="h-4 w-4 text-[#6b7280]" />} />
      <InputField label="Residential Address" value={data.basicProfile.residentialAddress} onChange={(value) => updateBasic("residentialAddress", value)} />

      <div>
        <p className="mb-2 text-[13px] font-semibold text-[#111827]">Service Location</p>
        <div className="rounded-[14px] border border-[#dfe8e2] bg-[linear-gradient(180deg,#f6fbf7_0%,#eef8ef_100%)] p-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[12px] font-bold text-[#16a34a] shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
            <PinIcon className="h-4 w-4" />
            Select current location
          </div>
        </div>
      </div>

      <RangeField
        label="Service Radius"
        value={data.basicProfile.serviceRadius}
        min={5}
        max={30}
        suffix="KM"
        onChange={(value) => updateBasic("serviceRadius", value)}
      />
    </div>
  );
}

function AccountDetailsStep({
  data,
  updateAccount,
}: {
  data: ProviderRegistrationData;
  updateAccount: (
    field: keyof ProviderRegistrationData["account"],
    value: string
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <InputField label="Email" value={data.account.email} onChange={(value) => updateAccount("email", value)} />
      <div>
        <p className="mb-2 text-[13px] font-semibold text-[#111827]">Phone</p>
        <div className="flex gap-2">
          <div className="flex h-11 w-[6.2rem] items-center rounded-[12px] border border-[#dfe8e2] px-3 text-[13px]">
            <MalaysiaFlagIcon className="mr-2 h-4 w-6 rounded-[3px]" />
            <span>{data.account.phoneCountryCode}</span>
            <ChevronDownIcon className="ml-auto h-4 w-4 text-[#6b7280]" />
          </div>
          <div className="flex flex-1 items-center rounded-[12px] border border-[#dfe8e2] px-4">
            <input
              value={data.account.phoneNumber}
              onChange={(event) => updateAccount("phoneNumber", event.target.value)}
              className="h-11 w-full border-0 bg-transparent text-[14px] text-[#111827] outline-none"
            />
          </div>
        </div>
      </div>
      <InputField label="Password" value={data.account.password} onChange={(value) => updateAccount("password", value)} rightIcon={<EyeIcon className="h-4 w-4 text-[#6b7280]" />} type="password" />
      <InputField label="Retype Password" value={data.account.confirmPassword} onChange={(value) => updateAccount("confirmPassword", value)} rightIcon={<EyeIcon className="h-4 w-4 text-[#6b7280]" />} type="password" />
    </div>
  );
}

function SelectServicesStep({
  selectedServices,
  onToggle,
}: {
  selectedServices: ProviderService[];
  onToggle: (service: ProviderService) => void;
}) {
  return (
    <div className="space-y-3">
      {providerServices.map((service) => {
        const active = selectedServices.includes(service);
        return (
          <button
            key={service}
            type="button"
            onClick={() => onToggle(service)}
            className="flex w-full items-center justify-between rounded-[16px] border border-[#e1e9e4] bg-white px-4 py-4 text-left shadow-[0_8px_20px_rgba(15,23,42,0.03)]"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f5faf6] text-[#111827]">
                <ServiceIcon kind={serviceIcons[service]} className="h-5 w-5" />
              </span>
              <span className="text-[15px] font-semibold text-[#111827]">{service}</span>
            </div>
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-[6px] border ${active ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-[#cfd8d2] bg-white text-transparent"}`}>
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ServiceDetailsStep({
  service,
  details,
  onUpdate,
  onToggleSpecialty,
}: {
  service: ProviderService;
  details: ProviderRegistrationData["serviceDetails"][ProviderService];
  onUpdate: (
    service: ProviderService,
    field: keyof ProviderRegistrationData["serviceDetails"][ProviderService],
    value: string | string[]
  ) => void;
  onToggleSpecialty: (service: ProviderService, specialty: string) => void;
}) {
  const specialties = serviceSpecialties[service];

  return (
    <div className="space-y-4">
      <SelectField label="Years of Experience" value={details.yearsExperience} onChange={(value) => onUpdate(service, "yearsExperience", value)} options={["1 Year", "2 Years", "3 Years", "4 Years", "5 Years", "6 Years", "7 Years", "8+ Years"]} />

      <div>
        <p className="mb-2 text-[13px] font-semibold text-[#111827]">{service} Specialties</p>
        <div className="flex flex-wrap gap-2">
          {specialties.map((specialty) => {
            const active = details.specialties.includes(specialty);
            return (
              <button
                key={specialty}
                type="button"
                onClick={() => onToggleSpecialty(service, specialty)}
                className={`inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] font-semibold ${active ? "border-[#16a34a] bg-[#eff9f0] text-[#16a34a]" : "border-[#d8e4dc] bg-white text-[#6b7280]"}`}
              >
                <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-[4px] ${active ? "bg-[#16a34a] text-white" : "border border-[#d8e4dc] bg-white text-transparent"}`}>
                  <CheckIcon className="h-3 w-3" />
                </span>
                {specialty}
              </button>
            );
          })}
        </div>
      </div>

      <AssetStrip
        label="Images (3) with caption"
        captions={details.imageCaptions}
        tone="media"
      />
      <AssetStrip
        label="Certificates (3) with caption"
        captions={details.certificateCaptions}
        tone="certificate"
      />

      <div>
        <p className="mb-2 text-[13px] font-semibold text-[#111827]">Rate</p>
        <div className="grid grid-cols-2 gap-3">
          <InputField compact label="Per Hour (RM)" value={details.hourlyRate} onChange={(value) => onUpdate(service, "hourlyRate", value)} />
          <InputField compact label="Per Day (RM)" value={details.dailyRate} onChange={(value) => onUpdate(service, "dailyRate", value)} />
        </div>
      </div>
    </div>
  );
}

function AvailabilityStep({
  data,
  onToggleDay,
  onUpdate,
}: {
  data: ProviderRegistrationData;
  onToggleDay: (day: string) => void;
  onUpdate: (
    field: keyof ProviderRegistrationData["availability"],
    value: string | string[]
  ) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-[#111827]">Days</p>
          <button
            type="button"
            onClick={() => onUpdate("days", [...availabilityDays])}
            className="text-[12px] font-bold text-[#16a34a]"
          >
            Select All
          </button>
        </div>
        <div className="space-y-2">
          {availabilityDays.map((day) => {
            const active = data.availability.days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => onToggleDay(day)}
                className="flex w-full items-center justify-between rounded-[12px] px-1 py-1 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-[6px] border ${active ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-[#cfd8d2] bg-white text-transparent"}`}>
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[14px] text-[#111827]">{day}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-[#111827]">Time</p>
        <div className="space-y-2">
          {timePresets.map((preset) => {
            const active = data.availability.timePreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onUpdate("timePreset", preset)}
                className="flex w-full items-center gap-3 rounded-[12px] px-1 py-1 text-left"
              >
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-[#16a34a]" : "border-[#cfd8d2]"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-[#16a34a]" : "bg-transparent"}`} />
                </span>
                <span className="text-[14px] text-[#111827]">{preset}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InputField compact label="Start Time" value={data.availability.startTime} onChange={(value) => onUpdate("startTime", value)} />
        <InputField compact label="End Time" value={data.availability.endTime} onChange={(value) => onUpdate("endTime", value)} />
      </div>
    </div>
  );
}

function ProviderLocationStep({
  data,
  onUpdate,
}: {
  data: ProviderRegistrationData;
  onUpdate: (
    field: keyof ProviderRegistrationData["providerLocation"],
    value: string | number
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[18px] border border-[#dfe8e2] bg-[linear-gradient(180deg,#f7fbf7_0%,#eff7ef_100%)]">
        <div className="relative h-[18rem] overflow-hidden bg-[radial-gradient(circle_at_50%_48%,rgba(22,163,74,0.12),transparent_36%),linear-gradient(90deg,rgba(17,24,39,0.03)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.03)_1px,transparent_1px)] bg-[size:auto,28px_28px,28px_28px]">
          <div className="absolute inset-8 rounded-full border-2 border-[#49bf73] bg-[#16a34a]/8" />
          <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#16a34a] ring-8 ring-[#16a34a]/12" />
          <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-[#16a34a] shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
            {data.providerLocation.radius} KM
          </span>
        </div>
      </div>

      <RangeField
        label="Service Radius"
        value={data.providerLocation.radius}
        min={5}
        max={30}
        suffix="KM"
        onChange={(value) => onUpdate("radius", value)}
      />
    </div>
  );
}

function ReviewStep({ data }: { data: ProviderRegistrationData }) {
  return (
    <div className="space-y-5">
      <ReviewCard title="Profile">
        <ReviewLine icon={<UserIcon className="h-4 w-4" />} text={`${getProviderFullName(data)} (${data.basicProfile.marketingName})`} />
        <ReviewLine icon={<UserIcon className="h-4 w-4" />} text={`Sex: ${data.basicProfile.sex || "Not selected"}`} />
        <ReviewLine icon={<PhoneIcon className="h-4 w-4" />} text={`${data.account.phoneCountryCode} ${data.account.phoneNumber}`} />
        <ReviewLine icon={<PinIcon className="h-4 w-4" />} text={data.basicProfile.serviceLocation} />
        <ReviewLine icon={<RangeIcon className="h-4 w-4" />} text={`${data.providerLocation.radius} KM`} />
      </ReviewCard>

      <ReviewCard title="Services">
        <div className="space-y-4">
          {data.selectedServices.map((service) => {
            const details = data.serviceDetails[service];
            return (
              <div key={service} className="border-t border-[#ecf1ed] pt-4 first:border-t-0 first:pt-0">
                <h3 className="text-[14px] font-extrabold text-[#111827]">{service}</h3>
                <p className="mt-1 text-[13px] text-[#4b5563]">
                  RM{details.hourlyRate}/hr - RM{details.dailyRate}/day
                </p>
                <p className="mt-1 text-[13px] text-[#4b5563]">{details.yearsExperience} Exp</p>
              </div>
            );
          })}
        </div>
      </ReviewCard>

      <ReviewCard title="Availability">
        <p className="text-[13px] text-[#374151]">
          {formatAvailabilityDays(data.availability.days)} - {data.availability.timePreset === "Custom Time" ? `${data.availability.startTime} - ${data.availability.endTime}` : data.availability.timePreset}
        </p>
      </ReviewCard>
    </div>
  );
}

function VerificationStep({
  data,
  onUpdate,
}: {
  data: ProviderRegistrationData;
  onUpdate: (
    field: keyof ProviderRegistrationData["verification"],
    value: string | string[]
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <OtpGroup
        label="Phone Number Verification"
        value={`${data.account.phoneCountryCode} ${data.account.phoneNumber}`}
        otp={data.verification.phoneOtp}
        onChange={(next) => onUpdate("phoneOtp", next)}
      />
      <OtpGroup
        label="Email Verification"
        value={data.account.email}
        otp={data.verification.emailOtp}
        onChange={(next) => onUpdate("emailOtp", next)}
      />
    </div>
  );
}

function IdentityStep({
  data,
  onUpdate,
}: {
  data: ProviderRegistrationData;
  onUpdate: (
    field: keyof ProviderRegistrationData["verification"],
    value: string | string[]
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <SelectField
        label="Document Type"
        value={data.verification.documentType}
        onChange={(value) => onUpdate("documentType", value)}
        options={documentTypes}
      />
      <UploadCard
        label="Upload Document (Front)"
        fileName={data.verification.frontImageName}
        onSelect={(value) => onUpdate("frontImageName", value)}
      />
      <UploadCard
        label="Upload Document (Back)"
        fileName={data.verification.backImageName}
        onSelect={(value) => onUpdate("backImageName", value)}
      />
    </div>
  );
}

function SuccessStep({
  data,
  registrationId,
}: {
  data: ProviderRegistrationData;
  registrationId: string;
}) {
  const firstService = data.selectedServices[0] ?? "Chef";
  const firstDetails = data.serviceDetails[firstService];

  return (
    <div className="space-y-6">
      <div className="rounded-[20px] border border-[#e4ece7] bg-white p-5 text-center shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-[0_18px_30px_rgba(22,163,74,0.22)]">
          <CheckIcon className="h-10 w-10" />
        </div>
        <h2 className="mt-5 text-[24px] font-extrabold tracking-[-0.04em] text-[#111827]">
          Congratulations!
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-[#4b5563]">
          Your profile has been submitted and is now live, pending admin approval.
        </p>
      </div>

      <div className="rounded-[20px] border border-[#e4ece7] bg-[linear-gradient(180deg,#fcfffd_0%,#f4fbf5_100%)] p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
        <h3 className="text-[22px] font-extrabold tracking-[-0.04em] text-[#16a34a]">
          How Your Listing Appears
        </h3>
        <p className="mt-1 text-[13px] text-[#4b5563]">
          Your listing will be visible even before verification is complete.
        </p>

        <div className="mt-4 grid gap-4">
          <ListingCard
            title="Unverified Listing (No Badges)"
            service={firstService}
            marketingName={data.basicProfile.marketingName}
            location={data.providerLocation.areaLabel}
            radius={data.providerLocation.radius}
            hourlyRate={firstDetails.hourlyRate}
            dailyRate={firstDetails.dailyRate}
            specialties={firstDetails.specialties}
            showBadges={false}
          />
          <ListingCard
            title="Verified Listing (With Badges)"
            service={firstService}
            marketingName={data.basicProfile.marketingName}
            location={data.providerLocation.areaLabel}
            radius={data.providerLocation.radius}
            hourlyRate={firstDetails.hourlyRate}
            dailyRate={firstDetails.dailyRate}
            specialties={firstDetails.specialties}
            showBadges
          />
        </div>

        <div className="mt-4 rounded-[16px] border border-[#bfe8c9] bg-white p-4">
          <h4 className="text-[15px] font-extrabold text-[#16a34a]">Verification Badges</h4>
          <p className="mt-1 text-[13px] text-[#4b5563]">
            After verification, these badges will appear on your listing.
          </p>
          <div className="mt-4 space-y-3">
            <BadgeLine label="Phone number verified" />
            <BadgeLine label="IC/PP Verified" />
          </div>
        </div>
      </div>

      <Link
        href="/provider/dashboard"
        className="inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-[#16a34a] text-[15px] font-extrabold text-white shadow-[0_16px_30px_rgba(22,163,74,0.2)]"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

function ProgressHeader({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between text-[12px]">
        <span className="font-bold text-[#16a34a]">Step {current + 1}</span>
        <span className="text-[#6b7280]">{current + 1}/{total}</span>
      </div>
      <div className="h-2 rounded-full bg-[#e6ece8]">
        <div
          className="h-2 rounded-full bg-[#16a34a]"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-[12px] font-semibold text-[#111827]">{label}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  hint,
  rightIcon,
  compact = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rightIcon?: React.ReactNode;
  compact?: boolean;
  type?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";

  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-[#111827]">
        {label}
      </span>
      {hint ? <p className="-mt-1 mb-2 text-[11px] text-[#6b7280]">{hint}</p> : null}
      <div className="flex items-center rounded-[12px] border border-[#dfe8e2] px-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
        <input
          type={isPasswordField && showPassword ? "text" : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${compact ? "h-10" : "h-11"} w-full border-0 bg-transparent text-[14px] text-[#111827] outline-none`}
        />
        {rightIcon ? (
          <button
            type="button"
            aria-label={isPasswordField && showPassword ? "Hide password" : "Show password"}
            onClick={() => {
              if (isPasswordField) {
                setShowPassword((current) => !current);
              }
            }}
            className="ml-3"
          >
            {rightIcon}
          </button>
        ) : null}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-[#111827]">{label}</span>
      <div className="flex items-center rounded-[12px] border border-[#dfe8e2] px-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none border-0 bg-transparent text-[14px] text-[#111827] outline-none"
        >
          {placeholder ? (
            <option value="">{placeholder}</option>
          ) : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="ml-3 h-4 w-4 text-[#6b7280]" />
      </div>
    </label>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[13px] font-semibold text-[#111827]">
        <span>{label}</span>
        <span className="text-[12px] text-[#111827]">
          {value} {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full accent-[#16a34a]"
      />
      <div className="mt-1 flex justify-between text-[11px] text-[#6b7280]">
        <span>{min} {suffix}</span>
        <span>{max} {suffix}</span>
      </div>
    </div>
  );
}

function AssetStrip({
  label,
  captions,
  tone,
}: {
  label: string;
  captions: string[];
  tone: "media" | "certificate";
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#111827]">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        {captions.map((caption, index) => (
          <div key={caption} className="text-center">
            <div className={`h-16 rounded-[12px] border border-[#e1e9e4] ${tone === "media" ? mediaThumbClasses(index) : "bg-[linear-gradient(180deg,#fffaf4_0%,#f7efe5_100%)]"} shadow-[0_8px_18px_rgba(15,23,42,0.03)]`} />
            <p className="mt-1 text-[11px] text-[#374151]">{caption}</p>
          </div>
        ))}
        <button
          type="button"
          className="flex h-16 items-center justify-center rounded-[12px] border border-[#dfe8e2] bg-[#f8fbf8] text-[#16a34a]"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-[#e4ece7] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <h3 className="text-[14px] font-extrabold text-[#111827]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ReviewLine({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 py-1 text-[13px] text-[#374151]">
      <span className="text-[#111827]">{icon}</span>
      {text}
    </div>
  );
}

function OtpGroup({
  label,
  value,
  otp,
  onChange,
}: {
  label: string;
  value: string;
  otp: string[];
  onChange: (otp: string[]) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#111827]">{label}</p>
      <p className="mb-3 text-[13px] text-[#374151]">{value}</p>
      <div className="grid grid-cols-6 gap-2">
        {otp.map((digit, index) => (
          <input
            key={`${label}-${index}`}
            value={digit}
            onChange={(event) => {
              const next = [...otp];
              next[index] = event.target.value.slice(-1);
              onChange(next);
            }}
            className="h-11 rounded-[10px] border border-[#dfe8e2] text-center text-[15px] font-semibold text-[#111827] outline-none"
          />
        ))}
      </div>
      <p className="mt-3 text-[12px] font-semibold text-[#16a34a]">Resend OTP (0:30)</p>
    </div>
  );
}

function UploadCard({
  label,
  fileName,
  onSelect,
}: {
  label: string;
  fileName: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#111827]">{label}</p>
      <button
        type="button"
        onClick={() => onSelect(fileName)}
        className="flex h-32 w-full flex-col items-center justify-center rounded-[16px] border border-[#dfe8e2] bg-[linear-gradient(180deg,#fcfffd_0%,#f3fbf4_100%)]"
      >
        <UploadIcon className="h-8 w-8 text-[#16a34a]" />
        <p className="mt-3 text-[14px] font-bold text-[#111827]">Upload Image</p>
        <p className="mt-1 text-[12px] text-[#6b7280]">JPG, PNG (Max 5MB)</p>
      </button>
    </div>
  );
}

function ListingCard({
  title,
  marketingName,
  service,
  location,
  radius,
  hourlyRate,
  dailyRate,
  specialties,
  showBadges,
}: {
  title: string;
  marketingName: string;
  service: ProviderService;
  location: string;
  radius: number;
  hourlyRate: string;
  dailyRate: string;
  specialties: string[];
  showBadges: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#111827]">{title}</p>
      <div className="rounded-[18px] border border-[#dfe8e2] bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 rounded-full bg-[linear-gradient(180deg,#d1d5db_0%,#6b7280_100%)]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-[16px] font-extrabold text-[#111827]">{marketingName}</h4>
                <p className="text-[13px] text-[#4b5563]">{service}</p>
              </div>
              <DotsVerticalIcon className="h-4 w-4 text-[#6b7280]" />
            </div>
            <div className="mt-2 flex items-center gap-2 text-[12px] text-[#6b7280]">
              <PinIcon className="h-3.5 w-3.5" />
              {location}
              <span>-</span>
              {radius} KM
            </div>
            {showBadges ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <VerifiedBadge label="Phone Verified" />
                <VerifiedBadge label="IC/PP Verified" />
              </div>
            ) : null}
            <div className="mt-3 flex items-center gap-1 text-[14px] font-bold text-[#111827]">
              <StarIcon className="h-4 w-4 text-[#f59e0b]" />
              4.8 <span className="text-[12px] font-medium text-[#6b7280]">(251)</span>
            </div>
            <p className="mt-2 text-[13px] text-[#111827]">
              RM{hourlyRate}/hr - RM{dailyRate}/day
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {specialties.slice(0, 3).map((specialty) => (
                <span key={specialty} className="rounded-full bg-[#eff9f0] px-2.5 py-1 text-[11px] font-semibold text-[#16a34a]">
                  {specialty}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="h-16 rounded-[10px] bg-[linear-gradient(135deg,#d97706_0%,#78350f_100%)]" />
              <div className="h-16 rounded-[10px] bg-[linear-gradient(135deg,#92400e_0%,#f59e0b_100%)]" />
              <div className="h-16 rounded-[10px] bg-[linear-gradient(135deg,#f59e0b_0%,#7c2d12_100%)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f9ec] px-2 py-1 text-[11px] font-bold text-[#16a34a]">
      <CheckCircleFilledIcon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function BadgeLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111827]">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eff9f0] text-[#16a34a]">
        <CheckCircleFilledIcon className="h-4 w-4" />
      </span>
      {label}
    </div>
  );
}

function buttonLabel(step: FlowStep) {
  switch (step.type) {
    case "service-detail":
      return "Save Service";
    case "location":
      return "Confirm Location";
    case "review":
      return "Submit for Listing";
    case "identity":
      return "Submit Verification";
    case "verification":
      return "Continue";
    default:
      return "Continue";
  }
}

function getProviderFullName(data: ProviderRegistrationData) {
  return [data.basicProfile.firstName, data.basicProfile.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function screenHeading(step: FlowStep) {
  switch (step.type) {
    case "basic":
      return "Create Your Profile";
    case "account":
      return "Account Details";
    case "services":
      return "Select Services";
    case "service-detail":
      return `${step.service} Service`;
    case "availability":
      return "Availability";
    case "location":
      return "Provider Location";
    case "review":
      return "Review & Submit";
    case "verification":
      return "Verify Your Account";
    case "identity":
      return "Verify Your Identity";
    case "success":
      return "Profile Submitted";
  }
}

function screenSubtitle(step: FlowStep) {
  switch (step.type) {
    case "basic":
      return "Let's start with your basic information";
    case "account":
      return "Add your contact and login details";
    case "services":
      return "Select one or more services you provide";
    case "service-detail":
      return "Add details about your service";
    case "availability":
      return "Select your available days and time";
    case "location":
      return "Set your service area";
    case "review":
      return "Please review your information";
    case "verification":
      return "Let's verify your contact information";
    case "identity":
      return "Upload your identity document";
    case "success":
      return "Pending admin approval";
  }
}

function formatAvailabilityDays(days: string[]) {
  if (days.length === 7) {
    return "Mon - Sun";
  }
  if (days.length === 0) {
    return "No days selected";
  }
  return days.join(", ");
}

function mediaThumbClasses(index: number) {
  const classes = [
    "bg-[linear-gradient(135deg,#b45309_0%,#f59e0b_100%)]",
    "bg-[linear-gradient(135deg,#78350f_0%,#f97316_100%)]",
    "bg-[linear-gradient(135deg,#9a3412_0%,#f59e0b_100%)]",
  ];

  return classes[index] ?? "bg-[linear-gradient(135deg,#d1d5db_0%,#9ca3af_100%)]";
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between text-[15px] font-semibold text-[#111827]">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <span className="flex gap-0.5">
          <span className="h-2 w-1 rounded-full bg-[#111827]/65" />
          <span className="h-2.5 w-1 rounded-full bg-[#111827]/75" />
          <span className="h-3 w-1 rounded-full bg-[#111827]/85" />
          <span className="h-3.5 w-1 rounded-full bg-[#111827]" />
        </span>
        <WifiIcon className="h-4 w-4 text-[#111827]" />
        <span className="h-3.5 w-6 rounded-[4px] border border-[#111827] p-[1px]">
          <span className="block h-full w-[72%] rounded-[2px] bg-[#111827]" />
        </span>
      </div>
    </div>
  );
}

function iconClass(className?: string) {
  return className ?? "h-5 w-5";
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" className={iconClass(className)}>
      <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="m5 7 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={iconClass(className)}>
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleFilledIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass(className)}>
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 14-4-4 1.4-1.4 2.6 2.6 5.6-5.6L18 9Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.7-3 4.4-4.5 8-4.5s6.3 1.5 8 4.5" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M6.6 3h3.1l1.2 4.6-1.8 1.8a15 15 0 0 0 5.4 5.4l1.8-1.8L21 14.3v3.1c0 .9-.7 1.6-1.6 1.6C10.8 19 5 13.2 5 6.6 5 5.7 5.7 5 6.6 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M5 9a12 12 0 0 1 14 0" strokeLinecap="round" />
      <path d="M8 12.5a7 7 0 0 1 8 0" strokeLinecap="round" />
      <path d="M11 16a2 2 0 0 1 2 0" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={iconClass(className)}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M12 16V5m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass(className)}>
      <path d="m12 2 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 8.3l6.1-.7L12 2Z" />
    </svg>
  );
}

function RangeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M4 12h16" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DotsVerticalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass(className)}>
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function ProfilePhotoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M4 7h4l1.5-2h5L16 7h4v12H4z" />
      <circle cx="12" cy="13" r="4" />
      <path d="M18 4v4M16 6h4" strokeLinecap="round" />
    </svg>
  );
}

function MalaysiaFlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className}>
      <rect width="28" height="20" rx="3" fill="#ffffff" />
      <path d="M0 0h14v10H0z" fill="#1d4ed8" />
      <path d="M0 0h28v2H0zm0 4h28v2H0zm0 8h28v2H0zm0 12h28v2H0z" fill="#ef4444" />
      <path d="M0 8h28v2H0zm0 8h28v2H0z" fill="#ef4444" />
      <circle cx="7" cy="5" r="3.3" fill="#facc15" />
      <circle cx="8.1" cy="5" r="2.6" fill="#1d4ed8" />
      <path d="m10.2 2.4.6 1.5 1.6.1-1.2 1 .4 1.5-1.4-.8-1.4.8.4-1.5-1.2-1 1.6-.1.6-1.5Z" fill="#facc15" />
    </svg>
  );
}

function ServiceIcon({
  kind,
  className,
}: {
  kind: string;
  className?: string;
}) {
  switch (kind) {
    case "chef":
      return <ChefHatIcon className={className} />;
    case "maid":
    case "cleaner":
      return <CleaningIcon className={className} />;
    case "driver":
      return <CarIcon className={className} />;
    case "tutor":
      return <TutorIcon className={className} />;
    case "babysitter":
      return <BabyIcon className={className} />;
    case "plumber":
      return <WrenchIcon className={className} />;
    case "electrician":
      return <BoltIcon className={className} />;
    default:
      return <DotsGroupIcon className={className} />;
  }
}

function ChefHatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M8 10a3 3 0 1 1 0-6 3.7 3.7 0 0 1 4 2 3.8 3.8 0 0 1 6 3 3 3 0 0 1-2 5H8a3 3 0 0 1 0-4Z" />
      <path d="M9 14v4h6v-4" strokeLinecap="round" />
    </svg>
  );
}

function CleaningIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M6 21h8M10 3l6 6-8 8-3-3 8-8Z" />
      <path d="M14 7 8 13" strokeLinecap="round" />
    </svg>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M5 16V9l2-3h10l2 3v7" />
      <path d="M3 13h18M7 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}

function TutorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="m4 7 8-3 8 3-8 3-8-3Zm2 3v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
    </svg>
  );
}

function BabyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <circle cx="12" cy="8" r="3" />
      <path d="M8 20v-3a4 4 0 0 1 8 0v3M10 4c1 0 1.5-1 2-2 0 .8.8 2 2 2" strokeLinecap="round" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="m14 7 3-3a3 3 0 1 1 3 3l-3 3" />
      <path d="m5 19 8-8 3 3-8 8H5v-3Z" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass(className)}>
      <path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotsGroupIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass(className)}>
      <circle cx="8" cy="8" r="2" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="8" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
    </svg>
  );
}
