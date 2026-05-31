import { NextResponse } from "next/server";

import { getProviderRegistration } from "@/lib/provider-registration-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await getProviderRegistration(id);

  if (!record) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  return NextResponse.json(record);
}
