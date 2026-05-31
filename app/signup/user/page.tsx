import Link from "next/link";

import {
  Field,
  PhoneField,
  PrimaryLinkButton,
  RegisterHeader,
  RegisterShell,
  RegisterTitle,
  Icons,
} from "../../register/_components/register-ui";

export default function SignupUserPage() {
  return (
    <RegisterShell>
      <RegisterHeader showBack backHref="/signup" />
      <RegisterTitle
        title="Create account as User"
        subtitle="Fill in the details below to create your DELLA account."
      />

      <div className="mt-8 space-y-4">
        <Field
          label="Full Name"
          placeholder="Enter your full name"
          icon={<Icons.User className="h-5 w-5" />}
        />
        <Field
          label="Email"
          placeholder="Enter email address"
          icon={<Icons.Mail className="h-5 w-5" />}
          type="email"
        />
        <PhoneField />
        <Field
          label="Password"
          placeholder="Create a password"
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
        <Field
          label="Confirm Password"
          placeholder="Confirm your password"
          icon={<Icons.Lock className="h-5 w-5" />}
          rightIcon={<Icons.EyeOff className="h-5 w-5" />}
          type="password"
        />
      </div>

      <label className="mt-5 flex items-start gap-3 text-[14px] leading-6 text-[#4b5563]">
        <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[#cfd8d1]" />
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

      <div className="mt-6">
        <PrimaryLinkButton href="/home">Create account</PrimaryLinkButton>
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
