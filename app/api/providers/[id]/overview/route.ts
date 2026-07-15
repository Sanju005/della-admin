import { NextResponse } from "next/server";

import {
  fetchProviderApplicationBundle,
  getAdminSupabaseClient,
  normalizeServiceKey,
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
    return NextResponse.json({ ok: false, error: "Provider not found." }, { status: 404 });
  }

  const nameParts = splitFullName(bundle.account.full_name ?? "");
  const images = bundle.services.flatMap((service) => {
    const serviceKey = normalizeServiceKey(service.service_type ?? "");
    const files = bundle.metadata?.service_image_files?.[serviceKey] ?? [];
    const captions = bundle.metadata?.service_image_captions?.[serviceKey] ?? [];

    return files.map((file, index) => ({
      id: `${service.id}-image-${index + 1}`,
      provider_id: bundle.account!.id,
      service_id: service.service_type,
      image_url: file,
      title: captions[index] ?? `Portfolio ${index + 1}`,
      caption: captions[index] ?? null,
      sort_order: index + 1,
    }));
  });

  return NextResponse.json({
    ok: true,
    provider: {
      id: bundle.account.id,
      full_name: bundle.account.full_name,
      first_name: nameParts.firstName || null,
      last_name: nameParts.lastName || null,
      date_of_birth: bundle.profile.date_of_birth,
      residential_address: bundle.profile.residential_address,
      current_location: bundle.profile.service_location,
      email: bundle.account.email,
      phone_number: bundle.account.phone,
      profile_photo_url: bundle.profile.profile_photo_url,
      verification_email: bundle.account.email,
      emergency_contact: bundle.metadata?.emergency_contact,
      verification_phone: bundle.metadata?.emergency_contact ?? bundle.account.phone,
      verification_status: bundle.profile.approval_status,
      status: bundle.account.status,
      radius_km: bundle.profile.service_radius_km,
      experience_years: bundle.services.length ? Number.parseInt(bundle.services[0].years_experience ?? "", 10) || null : null,
      created_at: bundle.account.created_at,
    },
    services: bundle.services.map((service) => ({
      id: service.id,
      provider_id: service.provider_id,
      service_id: service.service_type,
      service_name: service.service_type,
      hourly_price: service.hourly_rate,
      daily_price: service.daily_rate,
      radius_km: bundle.profile.service_radius_km,
      experience_years: Number.parseInt(service.years_experience ?? "", 10) || null,
      specialties:
        service.provider_service_specialties
          ?.map((item) => item.specialty)
          .filter((item): item is string => Boolean(item))
          .join(", ") || null,
      description: bundle.profile.bio,
      minimum_booking_hours: null,
      availability_modes: [
        ...(bundle.metadata?.availability_days ?? []),
        ...(bundle.metadata?.availability_time_preset ? [`Time: ${bundle.metadata.availability_time_preset}`] : []),
      ],
      current_location: bundle.profile.service_location,
    })),
    documents: bundle.documents.map((document) => ({
      id: document.id,
      document_type: document.document_type,
      label: document.label,
      file_url: document.file_url,
      notes: document.notes,
      status: document.status,
      created_at: document.created_at,
    })),
    images,
  });
}
