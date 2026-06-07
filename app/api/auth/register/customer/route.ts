import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  getSupabaseServiceKey,
  getSupabaseUrl,
} from "@/lib/supabase-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CustomerSignupPayload = {
  firstName?: string;
  lastName?: string;
  sex?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
};

function toSignupErrorMessage(errorMessage?: string) {
  const normalizedMessage = errorMessage?.trim().toLowerCase() ?? "";

  if (normalizedMessage.includes("email rate limit exceeded")) {
    return "Too many verification emails were requested. Please wait a few minutes and try again.";
  }

  if (normalizedMessage.includes("user already registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }

  return errorMessage || "Unable to create your account.";
}

function getAdminSupabaseClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceKey();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalizePhone(phoneNumber: string) {
  const digits = phoneNumber.replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("60")) {
    return `+${digits}`;
  }

  return `+60${digits}`;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CustomerSignupPayload;

  const firstName = payload.firstName?.trim() ?? "";
  const lastName = payload.lastName?.trim() ?? "";
  const sex = payload.sex === "Male" || payload.sex === "Female" ? payload.sex : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const email = payload.email?.trim().toLowerCase() ?? "";
  const phoneNumber = payload.phoneNumber?.trim() ?? "";
  const password = payload.password ?? "";
  const confirmPassword = payload.confirmPassword ?? "";

  if (!firstName || !lastName || !sex || !email || !phoneNumber || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "Please fill in all required fields." },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  const adminClient = getAdminSupabaseClient();

  if (!adminClient) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 500 }
    );
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      sex,
      role: "customer",
    },
  });

  if (error) {
    return NextResponse.json(
      { error: toSignupErrorMessage(error.message) },
      { status: 400 }
    );
  }

  if (!data.user) {
    return NextResponse.json(
      { error: "Unable to create your account." },
      { status: 500 }
    );
  }

  if (!data.user.email_confirmed_at) {
    const { error: confirmError } = await adminClient.auth.admin.updateUserById(
      data.user.id,
      {
        email_confirm: true,
      }
    );

    if (confirmError) {
      return NextResponse.json(
        { error: "Account created, but email confirmation setup failed." },
        { status: 500 }
      );
    }
  }

  const normalizedPhone = normalizePhone(phoneNumber);

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: data.user.id,
      full_name: fullName,
      email,
      role: "customer",
      phone: normalizedPhone,
      status: "pending",
    }, { onConflict: "id" });

  if (profileError) {
    return NextResponse.json(
      { error: "Account created, but profile setup failed." },
      { status: 500 }
    );
  }

  const { error: customerProfileError } = await adminClient
    .from("customer_profiles")
    .upsert(
      {
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        country: "Malaysia",
      },
      { onConflict: "id" }
    );

  if (customerProfileError) {
    return NextResponse.json(
      { error: "Account created, but customer profile setup failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    email,
    requiresEmailVerification: false,
  });
}
