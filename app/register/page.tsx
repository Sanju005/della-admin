"use client";

import {
  BottomAuthText,
  DateField,
  Field,
  Icons,
  PhoneField,
  PrimaryLinkButton,
  RegisterHeader,
  RegisterShell,
  RegisterTitle,
  SignupHero,
} from "./_components/register-ui";

export default function RegisterPage() {
  return (
    <RegisterShell>
      <RegisterHeader />
      <SignupHero />
      <RegisterTitle
        title="Create Your Account"
        subtitle="Book trusted services near you"
      />

      <div className="mt-6 space-y-4">
        <Field
          label="Full Name"
          placeholder="Enter your full name"
          icon={<Icons.User className="h-5 w-5" />}
        />
        <DateField />
        <Field
          label="Email"
          placeholder="Enter email address"
          icon={<Icons.Mail className="h-5 w-5" />}
          type="email"
        />
        <PhoneField />
        <Field
          label="Password"
          placeholder="Enter password"
          icon={<Icons.Lock className="h-5 w-5" />}
          rightIcon={<Icons.EyeOff className="h-5 w-5" />}
          type="password"
        />
        <Field
          label="Confirm Password"
          placeholder="Re-enter password"
          icon={<Icons.Lock className="h-5 w-5" />}
          rightIcon={<Icons.EyeOff className="h-5 w-5" />}
          type="password"
        />
      </div>

      <div className="mt-6">
        <PrimaryLinkButton href="/register/verify">
          Create Account
        </PrimaryLinkButton>
        <BottomAuthText />
      </div>
    </RegisterShell>
  );
}
