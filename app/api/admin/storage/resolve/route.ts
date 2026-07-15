import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceKey, getSupabaseUrl } from "@/lib/supabase-env";

type AssetRequest = {
  bucket?: string;
  path?: string;
};

type ResolveRequest = {
  assets?: AssetRequest[];
};

type AdminProfileRow = {
  id: string;
  role: string | null;
};

const allowedAdminRoles = new Set(["super_admin", "admin", "manager", "customer_care"]);
const publicBuckets = new Set(["profile-images", "job-completion-images", "provider-work-images"]);

function corsHeaders(origin?: string | null) {
  const allowedOrigin =
    origin && /^https:\/\/admin\.dellaapp\.com$/i.test(origin)
      ? origin
      : "https://admin.dellaapp.com";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function buildAdminSupabaseClient() {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function verifyAdminRequest(request: Request) {
  const adminClient = buildAdminSupabaseClient();

  if (!adminClient) {
    return {
      error: NextResponse.json(
        { error: "Supabase admin credentials are missing." },
        { status: 500, headers: corsHeaders(request.headers.get("origin")) },
      ),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Missing auth token." },
        { status: 401, headers: corsHeaders(request.headers.get("origin")) },
      ),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { error: "Invalid admin session." },
        { status: 401, headers: corsHeaders(request.headers.get("origin")) },
      ),
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const adminProfile = profile as AdminProfileRow | null;

  if (profileError || !adminProfile || !allowedAdminRoles.has((adminProfile.role ?? "").trim().toLowerCase())) {
    return {
      error: NextResponse.json(
        { error: "This account is not allowed to resolve storage assets." },
        { status: 403, headers: corsHeaders(request.headers.get("origin")) },
      ),
    };
  }

  return { adminClient };
}

function isSafeStoragePath(value: string) {
  return Boolean(value.trim()) && !/^https?:\/\//i.test(value) && !/^data:/i.test(value) && !/^blob:/i.test(value);
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = corsHeaders(request.headers.get("origin"));
  const verified = await verifyAdminRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const payload = (await request.json().catch(() => ({}))) as ResolveRequest;
  const assets = Array.isArray(payload.assets) ? payload.assets : [];

  const resolved = await Promise.all(
    assets.map(async (asset) => {
      const bucket = asset.bucket?.trim() ?? "";
      const objectPath = asset.path?.trim() ?? "";

      if (!bucket || !objectPath || !isSafeStoragePath(objectPath)) {
        return {
          bucket,
          path: objectPath,
          url: "",
        };
      }

      if (publicBuckets.has(bucket)) {
        const { data } = verified.adminClient.storage.from(bucket).getPublicUrl(objectPath);
        return {
          bucket,
          path: objectPath,
          url: data.publicUrl ?? "",
        };
      }

      const { data, error } = await verified.adminClient.storage
        .from(bucket)
        .createSignedUrl(objectPath, 60 * 60);

      return {
        bucket,
        path: objectPath,
        url: error ? "" : data?.signedUrl ?? "",
      };
    }),
  );

  return NextResponse.json({ assets: resolved }, { headers });
}
