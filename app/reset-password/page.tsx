"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { AppButton, AuthInfoPanel, MobilePage, SecureNotice } from "@/app/_components/della-ui";
import { getSupabaseClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        if (active) {
          setError("Supabase is not configured yet.");
          setChecking(false);
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setReady(Boolean(session));
      setChecking(false);

      if (!session) {
        setError("Open the password reset link from your email to set a new password.");
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = () => {
    startTransition(async () => {
      setError("");
      setNotice("");
      const supabase = getSupabaseClient();

      if (!supabase) {
        setError("Supabase is not configured yet.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setNotice("Your password has been updated. You can sign in with the new password now.");
      setPassword("");
      setConfirmPassword("");
    });
  };

  return (
    <MobilePage className="min-h-[100dvh] py-6">
          <Link
            href="/login"
            aria-label="Back"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#16A34A] shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="mt-6 space-y-4">
            <AuthInfoPanel
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Create new password"
              description="Open the recovery link from your email, then set a fresh password for your account."
            />

            <div className="rounded-[32px] border border-[#E3ECE5] bg-white px-5 py-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)] sm:px-6 sm:py-7">
            <label className="block text-[16px] font-extrabold text-[#0F172A]">
              New password
              <div className="mt-3 flex h-[58px] items-center rounded-[18px] border border-[#DDE5E0] bg-white px-5 shadow-[0_4px_10px_rgba(15,23,42,0.02)]">
                <Lock className="mr-4 h-5 w-5 text-[#16A34A]" />
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={!ready || checking}
                  className="h-full flex-1 border-0 bg-transparent text-[16px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] disabled:cursor-not-allowed"
                />
              </div>
            </label>

            <label className="mt-5 block text-[16px] font-extrabold text-[#0F172A]">
              Confirm password
              <div className="mt-3 flex h-[58px] items-center rounded-[18px] border border-[#DDE5E0] bg-white px-5 shadow-[0_4px_10px_rgba(15,23,42,0.02)]">
                <Lock className="mr-4 h-5 w-5 text-[#16A34A]" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={!ready || checking}
                  className="h-full flex-1 border-0 bg-transparent text-[16px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] disabled:cursor-not-allowed"
                />
              </div>
            </label>

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

            <AppButton
              onClick={handleSubmit}
              disabled={!ready || checking || isSubmitting}
              className="mt-7 h-[56px] w-full rounded-[20px] text-[18px] disabled:cursor-not-allowed"
            >
              {checking
                ? "Checking recovery session..."
                : isSubmitting
                  ? "Updating password..."
                  : "Update password"}
            </AppButton>
            </div>
            <SecureNotice />
          </div>
    </MobilePage>
  );
}
