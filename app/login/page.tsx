import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  EyeOff,
  Headphones,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f6fff8]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#fff] px-5 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="relative min-h-[100dvh] bg-[radial-gradient(circle_at_top,_rgba(190,242,198,0.5),_transparent_38%),linear-gradient(180deg,#fbfffb_0%,#f6fff8_100%)] pb-8">
          <section className="relative overflow-hidden px-2 pt-6">
            <div className="absolute inset-x-[-20%] top-[22%] h-[58%] rounded-full bg-[radial-gradient(circle,_rgba(187,247,208,0.36),_transparent_70%)]" />

            <div className="relative z-10">
              <Link
                href="/signup"
                aria-label="Back"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#16A34A] shadow-[0_12px_22px_rgba(15,23,42,0.08)]"
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

              <div className="mt-7 inline-flex items-center gap-3 rounded-full bg-[linear-gradient(90deg,rgba(220,252,231,0.96),rgba(220,252,231,0.55))] px-5 py-3 text-[#15803D] shadow-[0_12px_28px_rgba(22,163,74,0.08)]">
                <BadgeCheck className="h-5 w-5 fill-[#16A34A] text-white" />
                <span className="text-[15px] font-semibold">
                  Trusted. Verified. Reliable.
                </span>
              </div>

              <div className="mt-6">
                <h2 className="text-[4rem] font-extrabold leading-[0.92] tracking-[-0.09em] text-[#0F172A]">
                  Welcome back
                </h2>
                <p className="mt-4 text-[19px] leading-8 text-[#64748B]">
                  Sign in to continue to DELLA
                </p>
              </div>

              <HeroScene />
            </div>
          </section>

          <section className="relative z-20 -mt-6 rounded-[28px] bg-white px-6 py-7 shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
            <div>
              <label className="block text-[16px] font-extrabold text-[#0F172A]">
                Email or Phone
              </label>
              <div className="mt-3 flex h-[58px] items-center rounded-[18px] border border-[#DDE5E0] bg-white px-5 shadow-[0_4px_10px_rgba(15,23,42,0.02)]">
                <User className="mr-4 h-5 w-5 text-[#16A34A]" />
                <input
                  type="text"
                  placeholder="Enter email or phone number"
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
                  type="password"
                  placeholder="Enter password"
                  className="h-full flex-1 border-0 bg-transparent text-[16px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                />
                <button
                  type="button"
                  aria-label="Hide password"
                  className="ml-4 text-[#94A3B8]"
                >
                  <EyeOff className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Link href="/login" className="text-[15px] font-extrabold text-[#16A34A]">
                Forgot password?
              </Link>
            </div>

            <Link
              href="/home"
              className="mt-8 inline-flex h-[56px] w-full items-center justify-center rounded-[20px] bg-[linear-gradient(180deg,#18B548_0%,#149B3F_100%)] text-[18px] font-extrabold text-white shadow-[0_18px_34px_rgba(22,163,74,0.22)]"
            >
              Continue
            </Link>

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

          <section className="mt-7 rounded-[26px] bg-[linear-gradient(180deg,#fbfffc_0%,#f4fbf6_100%)] px-5 py-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-3 gap-4">
              <TrustItem
                icon={<ShieldCheck className="h-6 w-6 text-[#16A34A]" />}
                title="Verified Professionals"
                subtitle="Only trusted experts"
              />
              <TrustItem
                icon={<Lock className="h-6 w-6 text-[#16A34A]" />}
                title="Secure Bookings"
                subtitle="Your data is safe"
              />
              <TrustItem
                icon={<Headphones className="h-6 w-6 text-[#16A34A]" />}
                title="Fast Support"
                subtitle="We’re here to help"
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
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(180deg,#eefbef_0%,#dff6e2_100%)]">
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
    <div className="relative mt-6 h-[340px] overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_top_left,_rgba(220,252,231,0.95),_rgba(240,253,244,0.7)_46%,_transparent_70%),linear-gradient(180deg,#f8fff9_0%,#eff9f1_100%)]">
      <div className="absolute right-[-14%] top-[10%] h-[86%] w-[78%] rounded-full bg-[radial-gradient(circle,_rgba(187,247,208,0.55),_transparent_70%)]" />

      <div className="absolute right-14 top-7 h-26 w-22 rounded-[4px] border-[6px] border-[#ecdcb9] bg-white shadow-[0_14px_26px_rgba(15,23,42,0.08)]">
        <div className="flex h-full items-center justify-center">
          <HouseBadge />
        </div>
      </div>

      <div className="absolute left-[56%] top-[34%] h-24 w-16 -translate-x-1/2">
        <div className="absolute bottom-0 left-4 h-16 w-8 rounded-t-full bg-[#67b95e]" />
        <div className="absolute bottom-11 left-0 h-10 w-7 rotate-[-28deg] rounded-full bg-[#79c76e]" />
        <div className="absolute bottom-13 left-7 h-10 w-7 rotate-[22deg] rounded-full bg-[#76c36b]" />
        <div className="absolute bottom-18 left-2 h-10 w-7 rotate-[-10deg] rounded-full bg-[#87d07b]" />
        <div className="absolute bottom-0 left-2 h-8 w-12 rounded-t-[18px] rounded-b-[14px] bg-[#efe6d5]" />
      </div>

      <div className="absolute left-[59%] top-[56%] h-18 w-16 -translate-x-1/2 rounded-full bg-[#ddc18b]" />
      <div className="absolute left-[59%] top-[61%] h-18 w-16 -translate-x-1/2 rounded-[14px] bg-[#f0d9a8]" />
      <div className="absolute left-[55%] top-[70%] h-18 w-1.5 rounded-full bg-[#e2b96b]" />
      <div className="absolute left-[59%] top-[70%] h-18 w-1.5 rounded-full bg-[#e2b96b]" />
      <div className="absolute left-[63%] top-[70%] h-18 w-1.5 rounded-full bg-[#e2b96b]" />
      <div className="absolute left-[57.5%] top-[78%] h-8 w-1.5 rotate-[14deg] rounded-full bg-[#c99a51]" />
      <div className="absolute left-[61.5%] top-[78%] h-8 w-1.5 rotate-[-14deg] rounded-full bg-[#c99a51]" />

      <div className="absolute right-[8%] top-[15%] h-44 w-20">
        <div className="absolute bottom-0 left-5 h-24 w-10 rounded-t-full bg-[#63b857]" />
        <div className="absolute bottom-13 left-0 h-16 w-10 rotate-[-30deg] rounded-full bg-[#79c96e]" />
        <div className="absolute bottom-18 left-10 h-16 w-10 rotate-[26deg] rounded-full bg-[#77c66a]" />
        <div className="absolute bottom-29 left-1 h-16 w-10 rotate-[-18deg] rounded-full bg-[#83d177]" />
        <div className="absolute bottom-30 left-10 h-16 w-10 rotate-[16deg] rounded-full bg-[#72c165]" />
        <div className="absolute bottom-0 left-2 h-14 w-16 rounded-t-[24px] rounded-b-[18px] bg-[#efe3ca]" />
      </div>

      <div className="absolute right-[20%] top-[49%] h-40 w-40 rounded-[34px] bg-[linear-gradient(180deg,#eaf7ea_0%,#bfe7c0_100%)] shadow-[0_18px_34px_rgba(72,119,73,0.2)]">
        <div className="absolute left-[10%] top-[19%] h-28 w-28 rounded-[26px] bg-[linear-gradient(180deg,#d7f0d8_0%,#a8d7a9_100%)]" />
        <div className="absolute left-[8%] top-[24%] h-16 w-11 rounded-[20px] bg-[linear-gradient(180deg,#d7efd8_0%,#b0d7b1_100%)]" />
        <div className="absolute right-[8%] top-[24%] h-16 w-11 rounded-[20px] bg-[linear-gradient(180deg,#d7efd8_0%,#b0d7b1_100%)]" />
        <div className="absolute left-[28%] top-[28%] h-14 w-14 rounded-[18px] bg-[linear-gradient(180deg,#fffdf6_0%,#f0ead6_100%)] shadow-[0_10px_16px_rgba(15,23,42,0.08)]" />
        <div className="absolute bottom-[5%] left-[26%] h-20 w-4 rotate-[14deg] rounded-full bg-[#d2a255]" />
        <div className="absolute bottom-[5%] right-[26%] h-20 w-4 rotate-[-14deg] rounded-full bg-[#d2a255]" />
      </div>
    </div>
  );
}

function HouseBadge() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-12 w-12 text-[#9AD49E]">
      <path
        d="M12 30 32 14l20 16"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 28v22h26V28"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M28 36c0-2.8 1.8-5 4-5s4 2.2 4 5c0 2.8-1.8 5-4 5s-4-2.2-4-5Z"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        d="M32 42v4"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
