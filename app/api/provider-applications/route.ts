import { NextResponse } from "next/server";

import {
  getAdminSupabaseClient,
  type ProviderApplicationPayload,
  upsertProviderApplication,
} from "@/lib/provider-application-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const adminClient = getAdminSupabaseClient();

  if (!adminClient) {
    return NextResponse.json({ ok: false, error: "Supabase is not configured yet." }, { status: 500 });
  }

  try {
    const payload = (await request.json()) as ProviderApplicationPayload;

    if (
      !payload ||
      !payload.first_name?.trim() ||
      !payload.last_name?.trim() ||
      !payload.email?.trim() ||
      !payload.phone_number?.trim() ||
      !payload.current_location?.trim() ||
      !payload.residential_address?.trim() ||
      !Array.isArray(payload.services) ||
      payload.services.length === 0
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing required provider application fields." },
        { status: 400 },
      );
    }

    const result = await upsertProviderApplication(adminClient, payload);

    return NextResponse.json({
      ok: true,
      providerId: result.providerId,
      notificationId: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to submit provider application.",
      },
      { status: 500 },
    );
  }
}
