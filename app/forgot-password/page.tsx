"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

const userResetRedirectUrl = "https://app.dellaapp.com/reset-password";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      setError("");
      setNotice("");
      const supabase = getSupabaseClient();

      if (!supabase) {
        setError("Supabase is not configured yet.");
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: userResetRedirectUrl,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setNotice("Password reset link sent. Check your email to continue.");
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
                  Reset password
                </h1>
              </div>
            </div>

            <p className="mt-5 text-[15px] leading-7 text-[#64748B]">
              Enter your account email and we&apos;ll send a secure reset link to{" "}
              <span className="font-bold text-[#0F172A]">{userResetRedirectUrl}</span>.
            </p>

            <label className="mt-7 block text-[16px] font-extrabold text-[#0F172A]">
              Email
              <div className="mt-3 flex h-[58px] items-center rounded-[18px] border border-[#DDE5E0] bg-white px-5 shadow-[0_4px_10px_rgba(15,23,42,0.02)]">
                <Mail className="mr-4 h-5 w-5 text-[#16A34A]" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-full flex-1 border-0 bg-transparent text-[16px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
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
              disabled={isSubmitting}
              className="mt-7 inline-flex h-[56px] w-full items-center justify-center rounded-[20px] bg-[#16A34A] text-[18px] font-extrabold text-white shadow-[0_14px_28px_rgba(22,163,74,0.16)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Sending link..." : "Send reset link"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
