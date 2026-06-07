"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  EyeOff,
  Headphones,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { requestNotificationPermission, saveFCMToken } from "@/lib/notifications";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, startTransition] = useTransition();

  function getNextPath() {
    if (typeof window === "undefined") {
      return "/home";
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("next") ?? "/home";
  }

  useEffect(() => {
    let active = true;

    async function continueSession() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active || !session) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (profile?.role === "provider") {
        router.replace("/provider/dashboard");
        return;
      }

      router.replace(getNextPath());
    }

    void continueSession();

    return () => {
      active = false;
    };
  }, [router]);

  function handleSubmit() {
    startTransition(async () => {
      setError("");
      const supabase = getSupabaseClient();

      if (!supabase) {
        setError("Supabase is not configured yet.");
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.user) {
        setError(signInError?.message || "Unable to sign in.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message || "Unable to load your account.");
        return;
      }

      try {
        const fcmToken = await requestNotificationPermission();

        if (fcmToken) {
          console.log("[FCM] Received token after login.");
          const saveResult = await saveFCMToken(fcmToken);

          if (!saveResult.success) {
            console.error("[FCM] Failed to persist token:", saveResult.error);
          }
        } else {
          console.warn("[FCM] No token available after login.");
        }
      } catch (notificationError) {
        console.error("[FCM] Notification setup failed after login:", notificationError);
      }

      if (profile?.role === "provider") {
        router.replace("/provider/dashboard");
        return;
      }

      router.replace(getNextPath());
    });
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#F6FFF8]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#F6FFF8] px-5 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="relative min-h-[100dvh] bg-[#F6FFF8] pb-8">
          <section className="relative overflow-hidden px-1 pt-6">
            <div className="absolute right-[-24%] top-[5%] h-[75%] w-[78%] rounded-full bg-[#ECF8EE]" />
            <div className="absolute left-[45%] top-[34%] h-[55%] w-[72%] rounded-full bg-[#F1FAF3]" />

            <div className="relative z-10">
              <Link
                href="/"
                aria-label="Back"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#16A34A] shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div className="mt-5">
                <h1 className="text-[3.1rem] font-extrabold leading-none tracking-[-0.08em] text-[#16A34A]">
                  DELLA
                </h1>
                <p className="mt-2 text-[16px] font-medium text-[#64748B]">
                  Home &amp; Lifestyle Marketplace
                </p>
              </div>

              <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#E8F7EA] px-5 py-3 text-[#15803D] shadow-[0_8px_18px_rgba(22,163,74,0.05)]">
                <BadgeCheck className="h-5 w-5 text-[#16A34A]" />
                <span className="text-[15px] font-semibold">
                  Trusted • Verified • Reliable
                </span>
              </div>

              <div className="mt-7">
                <h2 className="text-[3.5rem] font-extrabold leading-[0.94] tracking-[-0.04em] text-[#0F172A]">
                  Welcome back
                </h2>
                <p className="mt-4 text-[18px] leading-8 text-[#64748B]">
                  Sign in to continue to DELLA
                </p>
              </div>

              <HeroScene />
            </div>
          </section>

          <section className="relative z-20 -mt-3 rounded-[28px] bg-white px-6 py-7 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
            <div>
              <label className="block text-[16px] font-extrabold text-[#0F172A]">
                Email or Phone
              </label>
              <div className="mt-3 flex h-[58px] items-center rounded-[18px] border border-[#DDE5E0] bg-white px-5 shadow-[0_4px_10px_rgba(15,23,42,0.02)]">
                <User className="mr-4 h-5 w-5 text-[#16A34A]" />
                <input
                  type="email"
                  placeholder="Enter email or phone number"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-full flex-1 border-0 bg-transparent text-[16px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                />
              </div>
            </div>

            <div className="mt-7">
              <label className="block text-[16px] font-extrabold text-[#0F172A]">
                Password
              </label>
              <div className="mt-3 flex h-[58px] items-center rounded-[18px] border border-[#DDE5E0] bg-white px-5 shadow-[0_4px_10px_rgba(15,23,42,0.02)]">
                <Lock className="mr-4 h-5 w-5 text-[#16A34A]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-full flex-1 border-0 bg-transparent text-[16px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                  className="ml-4 text-[#94A3B8]"
                >
                  <EyeOff className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Link href="/forgot-password" className="text-[15px] font-extrabold text-[#16A34A]">
                Forgot Password?
              </Link>
            </div>

            {error ? (
              <p className="mt-4 rounded-[14px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[13px] font-semibold text-[#dc2626]">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-8 inline-flex h-[56px] w-full items-center justify-center rounded-[20px] bg-[#16A34A] text-[18px] font-extrabold text-white shadow-[0_14px_28px_rgba(22,163,74,0.16)]"
            >
              {isSubmitting ? "Signing in..." : "Continue"}
            </button>

            <div className="mt-8 flex items-center gap-5">
              <div className="h-px flex-1 bg-[#E2E8F0]" />
              <span className="text-[17px] text-[#64748B]">or</span>
              <div className="h-px flex-1 bg-[#E2E8F0]" />
            </div>

            <p className="mt-7 text-center text-[18px] text-[#334155]">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-extrabold text-[#16A34A]">
                Create account
              </Link>
            </p>
          </section>

          <section className="mt-7 rounded-[26px] bg-[#FBFFFC] px-5 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
            <div className="grid grid-cols-3 gap-0">
              <TrustItem
                icon={<ShieldCheck className="h-6 w-6 text-[#16A34A]" />}
                title="Verified Professionals"
                subtitle="Only trusted experts"
                bordered
              />
              <TrustItem
                icon={<Lock className="h-6 w-6 text-[#16A34A]" />}
                title="Secure Bookings"
                subtitle="Your data is safe"
                bordered
              />
              <TrustItem
                icon={<Headphones className="h-6 w-6 text-[#16A34A]" />}
                title="Fast Support"
                subtitle="We're here to help"
              />
            </div>
          </section>

          <div className="mt-7 flex items-center justify-center gap-3 pb-5 text-center text-[15px] text-[#64748B]">
            <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
            <span>DELLA is committed to your safety and satisfaction.</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function TrustItem({
  icon,
  title,
  subtitle,
  bordered = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center px-3 text-center ${bordered ? "border-r border-[#E2E8F0]" : ""}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF8EF]">
        {icon}
      </div>
      <p className="mt-3 text-[15px] font-extrabold leading-5 text-[#0F172A]">
        {title}
      </p>
      <p className="mt-2 text-[14px] leading-5 text-[#64748B]">{subtitle}</p>
    </div>
  );
}

function HeroScene() {
  return (
    <div className="relative mt-4 h-[248px] overflow-hidden">
      <div className="absolute right-[-10%] top-[6%] h-[92%] w-[76%] rounded-full bg-[#ECF8EE]" />
      <div className="absolute left-[51%] top-[36%] h-[58%] w-[62%] rounded-full bg-[#F1FAF3]" />

      <div className="absolute left-[58%] top-[56%] h-10 w-16 -translate-x-1/2 rounded-full bg-[#DDBE82]" />
      <div className="absolute left-[58%] top-[59%] h-10 w-16 -translate-x-1/2 rounded-[14px] bg-[#F0D49A]" />
      <div className="absolute left-[55%] top-[67%] h-11 w-1.5 rounded-full bg-[#DDB166]" />
      <div className="absolute left-[58.5%] top-[67%] h-11 w-1.5 rounded-full bg-[#DDB166]" />
      <div className="absolute left-[62%] top-[67%] h-11 w-1.5 rounded-full bg-[#DDB166]" />
      <div className="absolute left-[56.8%] top-[74%] h-5 w-1.5 rotate-[16deg] rounded-full bg-[#C99545]" />
      <div className="absolute left-[60.1%] top-[74%] h-5 w-1.5 rotate-[-16deg] rounded-full bg-[#C99545]" />

      <div className="absolute right-[6%] top-[18%] h-40 w-18">
        <div className="absolute bottom-0 left-4 h-20 w-9 rounded-t-full bg-[#63B857]" />
        <div className="absolute bottom-11 left-0 h-14 w-9 rotate-[-30deg] rounded-full bg-[#79C96E]" />
        <div className="absolute bottom-16 left-8 h-14 w-9 rotate-[26deg] rounded-full bg-[#77C66A]" />
        <div className="absolute bottom-25 left-1 h-14 w-9 rotate-[-18deg] rounded-full bg-[#83D177]" />
        <div className="absolute bottom-26 left-8 h-14 w-9 rotate-[16deg] rounded-full bg-[#72C165]" />
        <div className="absolute bottom-0 left-1 h-12 w-14 rounded-t-[22px] rounded-b-[16px] bg-[#EFE3CA]" />
      </div>

      <div className="absolute right-[14%] top-[34%] h-44 w-40 rounded-[34px] bg-[#D3EAD3] shadow-[0_14px_28px_rgba(72,119,73,0.14)]">
        <div className="absolute left-[10%] top-[18%] h-29 w-28 rounded-[28px] bg-[#C3DFC3]" />
        <div className="absolute left-[7%] top-[24%] h-16 w-11 rounded-[20px] bg-[#C3DFC3]" />
        <div className="absolute right-[7%] top-[24%] h-16 w-11 rounded-[20px] bg-[#C3DFC3]" />
        <div className="absolute left-[29%] top-[28%] h-14 w-14 rounded-[18px] bg-[#FFF8EC] shadow-[0_8px_14px_rgba(15,23,42,0.06)]" />
        <div className="absolute bottom-[5%] left-[28%] h-20 w-4 rotate-[14deg] rounded-full bg-[#D2A255]" />
        <div className="absolute bottom-[5%] right-[24%] h-20 w-4 rotate-[-14deg] rounded-full bg-[#D2A255]" />
      </div>
    </div>
  );
}
