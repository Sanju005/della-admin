import { NextResponse } from "next/server";

import {
  fetchProviderApplicationBundle,
  getAdminSupabaseClient,
  splitFullName,
} from "@/lib/provider-application-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminClient = getAdminSupabaseClient();

  if (!adminClient) {
    return NextResponse.json({ ok: false, error: "Supabase is not configured yet." }, { status: 500 });
  }

  const { id } = await params;
  const bundle = await fetchProviderApplicationBundle(adminClient, id);

  if (!bundle.account || !bundle.profile) {
    return NextResponse.json({ ok: false, error: "Provider application not found." }, { status: 404 });
  }

  const nameParts = splitFullName(bundle.account.full_name ?? "");

  return NextResponse.json({
    ok: true,
    provider: {
      id: bundle.account.id,
      full_name: bundle.account.full_name,
      first_name: nameParts.firstName || null,
      last_name: nameParts.lastName || null,
      status: bundle.account.status,
      verification_email: bundle.account.email,
      verification_phone: bundle.metadata?.emergency_contact ?? bundle.account.phone,
      created_at: bundle.account.created_at,
    },
    services: bundle.services.map((service) => ({
      service_id: service.service_type,
      service_name: service.service_type,
      hourly_price: service.hourly_rate,
      minimum_booking_hours: null,
      availability_modes: [
        ...(bundle.metadata?.availability_days ?? []),
        ...(bundle.metadata?.availability_time_preset ? [`Time: ${bundle.metadata.availability_time_preset}`] : []),
      ],
    })),
    documents: bundle.documents.map((document) => ({
      id: document.id,
      document_type: document.document_type ?? "",
      label: document.label ?? "Document",
      status: document.status,
      notes: document.notes,
      created_at: document.created_at,
    })),
    latest_review: bundle.verification
      ? {
          created_at: bundle.verification.last_reviewed_at,
          action: bundle.verification.identity_verified ? "verified" : "submitted",
          status: bundle.profile.approval_status,
          note: bundle.verification.admin_note,
        }
      : null,
  });
}
