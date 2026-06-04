"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#F6FFF8]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#F6FFF8] px-5 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="min-h-[100dvh] py-6">
          <Link
            href="/login"
            aria-label="Back"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#16A34A] shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="mt-6 rounded-[32px] bg-white px-6 py-7 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F7EA] text-[#16A34A]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#16A34A]">
                  DELLA
                </p>
                <h1 className="text-[28px] font-extrabold text-[#0F172A]">
                  Create new password
                </h1>
              </div>
            </div>

            <p className="mt-5 text-[15px] leading-7 text-[#64748B]">
              Open the recovery link from your email, then set a fresh password for your account.
            </p>

            <label className="mt-7 block text-[16px] font-extrabold text-[#0F172A]">
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

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!ready || checking || isSubmitting}
              className="mt-7 inline-flex h-[56px] w-full items-center justify-center rounded-[20px] bg-[#16A34A] text-[18px] font-extrabold text-white shadow-[0_14px_28px_rgba(22,163,74,0.16)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {checking
                ? "Checking recovery session..."
                : isSubmitting
                  ? "Updating password..."
                  : "Update password"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
