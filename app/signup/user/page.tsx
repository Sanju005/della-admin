"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Icons,
  RegisterHeader,
  RegisterShell,
  RegisterTitle,
} from "../../register/_components/register-ui";

export default function SignupUserPage() {
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    startTransition(async () => {
      setError("");

      const response = await fetch("/api/auth/register/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          password,
          confirmPassword,
        }),
      });

      const result = (await response.json()) as
        | { success: true; email: string; requiresEmailVerification: boolean }
        | { error?: string };

      if (!response.ok || !("success" in result)) {
        setError(
          "error" in result && result.error
            ? result.error
            : "Unable to create your account."
        );
        return;
      }

      if (result.requiresEmailVerification) {
        router.push(`/signup/check-email?email=${encodeURIComponent(result.email)}`);
        return;
      }

      router.push("/login");
    });
  };

  return (
    <RegisterShell>
      <RegisterHeader showBack backHref="/signup" />
      <RegisterTitle
        title="Create account as User"
        subtitle="Fill in the details below to create your DELLA account."
      />

      <div className="mt-8 space-y-4">
        <ControlledField
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={setFullName}
          icon={<Icons.User className="h-5 w-5" />}
        />
        <ControlledField
          label="Email"
          placeholder="Enter email address"
          value={email}
          onChange={setEmail}
          icon={<Icons.Mail className="h-5 w-5" />}
          type="email"
        />
        <ControlledPhoneField value={phoneNumber} onChange={setPhoneNumber} />
        <ControlledField
          label="Password"
          placeholder="Create a password"
          value={password}
          onChange={setPassword}
          icon={<Icons.Lock className="h-5 w-5" />}
          rightIcon={<Icons.EyeOff className="h-5 w-5" />}
          type="password"
        />
        <div className="rounded-[18px] bg-[#f7fbf7] px-4 py-3 text-[13px] leading-6 text-[#4b5563]">
          <p>At least 8 characters</p>
          <p>One uppercase letter</p>
          <p>One number</p>
          <p>One special character</p>
        </div>
        <ControlledField
          label="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          icon={<Icons.Lock className="h-5 w-5" />}
          rightIcon={<Icons.EyeOff className="h-5 w-5" />}
          type="password"
        />
      </div>

      <label className="mt-5 flex items-start gap-3 text-[14px] leading-6 text-[#4b5563]">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-[#cfd8d1]"
        />
        <span>
          I agree to the{" "}
          <Link href="/signup/user" className="font-bold text-[#16a34a]">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/signup/user" className="font-bold text-[#16a34a]">
            Privacy Policy
          </Link>
        </span>
      </label>

      {error ? (
        <p className="mt-4 rounded-[14px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[13px] font-semibold text-[#dc2626]">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex h-13 w-full items-center justify-center rounded-[14px] bg-[#16a34a] px-5 text-[15px] font-extrabold text-white shadow-[0_16px_30px_rgba(22,163,74,0.22)] transition hover:bg-[#14863f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </div>

      <p className="mt-7 text-center text-[15px] text-[#4b5563]">
        Already have an account?{" "}
        <Link href="/login" className="font-extrabold text-[#16a34a]">
          Log in
        </Link>
      </p>
    </RegisterShell>
  );
}

function ControlledField({
  label,
  placeholder,
  value,
  onChange,
  icon,
  rightIcon,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  rightIcon?: ReactNode;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold text-[#111827]">
        {label}
      </span>
      <div className="flex h-13 items-center rounded-[14px] border border-[#d9e2dd] bg-white px-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
        <span className="mr-3 text-[#16a34a]">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full flex-1 border-0 bg-transparent text-[15px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
        />
        {rightIcon ? (
          <span className="ml-3 text-[#6b7280]">{rightIcon}</span>
        ) : null}
      </div>
    </label>
  );
}

function ControlledPhoneField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold text-[#111827]">
        Phone Number
      </span>
      <div className="flex gap-2.5">
        <div className="flex h-13 w-[8.25rem] items-center rounded-[14px] border border-[#d9e2dd] bg-white px-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
          <span className="mr-2">
            <MalaysiaFlagIcon className="h-5 w-7 rounded-[4px]" />
          </span>
          <span className="text-[15px] font-medium text-[#111827]">+60</span>
        </div>
        <div className="flex h-13 flex-1 items-center rounded-[14px] border border-[#d9e2dd] bg-white px-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
          <PhoneIcon className="mr-3 h-5 w-5 text-[#16a34a]" />
          <input
            type="tel"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Enter phone number"
            className="h-full flex-1 border-0 bg-transparent text-[15px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
          />
        </div>
      </div>
    </label>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path
        d="M6.6 3h3.1l1.2 4.6-1.8 1.8a15 15 0 0 0 5.4 5.4l1.8-1.8L21 14.3v3.1c0 .9-.7 1.6-1.6 1.6C10.8 19 5 13.2 5 6.6 5 5.7 5.7 5 6.6 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      <path
        d="m10.2 2.4.6 1.5 1.6.1-1.2 1 .4 1.5-1.4-.8-1.4.8.4-1.5-1.2-1 1.6-.1.6-1.5Z"
        fill="#facc15"
      />
    </svg>
  );
}
