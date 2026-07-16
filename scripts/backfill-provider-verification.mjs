import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const providerId = process.argv[2]?.trim();

if (!providerId) {
  console.error(
    "Usage: node scripts/backfill-provider-verification.mjs <provider-id> [--front-url=...] [--back-url=...] [--document-type=...] [--emergency-contact=...]",
  );
  process.exit(1);
}

function readFlag(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((value) => value.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : "";
}

function normalizeText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeDocumentTypeKey(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function isIdentityFrontDocumentType(value) {
  const normalized = normalizeDocumentTypeKey(value);
  if (!normalized) {
    return false;
  }

  return normalized.endsWith("_front") && (
    normalized.includes("ic") ||
    normalized.includes("identity") ||
    normalized.includes("passport") ||
    normalized.includes("national_id") ||
    normalized.includes("driving_license")
  );
}

function isIdentityBackDocumentType(value) {
  const normalized = normalizeDocumentTypeKey(value);
  if (!normalized) {
    return false;
  }

  return normalized.endsWith("_back") && (
    normalized.includes("ic") ||
    normalized.includes("identity") ||
    normalized.includes("passport") ||
    normalized.includes("national_id") ||
    normalized.includes("driving_license")
  );
}

function inferIdentityDocumentType(...values) {
  for (const value of values) {
    const normalized = normalizeDocumentTypeKey(value);
    if (!normalized) {
      continue;
    }

    if (normalized.includes("passport")) {
      return "Passport";
    }

    if (normalized.includes("driving_license")) {
      return "Driving License";
    }

    if (normalized.includes("national_id")) {
      return "National ID";
    }

    if (normalized.includes("ic") || normalized.includes("identity")) {
      return "IC";
    }
  }

  return "";
}

const explicitFrontUrl = readFlag("front-url");
const explicitBackUrl = readFlag("back-url");
const explicitDocumentType = readFlag("document-type");
const explicitEmergencyContact = readFlag("emergency-contact");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function maybeSingle(table, matchKey, matchValue, select) {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq(matchKey, matchValue)
    .maybeSingle();

  if (error) {
    if (/Could not find the table/i.test(error.message || "")) {
      return null;
    }

    throw error;
  }

  return data ?? null;
}

async function many(table, matchKey, matchValue, select) {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq(matchKey, matchValue);

  if (error) {
    if (/Could not find the table/i.test(error.message || "")) {
      return [];
    }

    throw error;
  }

  return data ?? [];
}

async function main() {
  const [profile, verification, metadata, providerDocuments] = await Promise.all([
    maybeSingle("profiles", "id", providerId, "id, full_name, email, phone"),
    maybeSingle(
      "provider_verifications",
      "provider_id",
      providerId,
      "provider_id, phone_verified, email_verified, identity_verified, kyc_verified, background_check_verified, document_type, identity_document_type, front_image_name, back_image_name, document_front_url, document_back_url, identity_front_image_url, identity_back_image_url, requested_documents, admin_note",
    ),
    maybeSingle(
      "provider_admin_metadata",
      "provider_id",
      providerId,
      "provider_id, emergency_contact",
    ),
    many(
      "provider_documents",
      "provider_id",
      providerId,
      "id, document_type, label, file_url, notes, status, created_at",
    ),
  ]);

  if (!profile) {
    throw new Error(`Provider ${providerId} was not found in profiles.`);
  }

  const identityFrontDocument = providerDocuments.find((document) =>
    isIdentityFrontDocumentType(document.document_type),
  );
  const identityBackDocument = providerDocuments.find((document) =>
    isIdentityBackDocumentType(document.document_type),
  );

  const frontUrl =
    explicitFrontUrl ||
    normalizeText(identityFrontDocument?.file_url) ||
    normalizeText(verification?.identity_front_image_url) ||
    normalizeText(verification?.document_front_url);
  const backUrl =
    explicitBackUrl ||
    normalizeText(identityBackDocument?.file_url) ||
    normalizeText(verification?.identity_back_image_url) ||
    normalizeText(verification?.document_back_url);
  const resolvedDocumentType =
    explicitDocumentType ||
    inferIdentityDocumentType(
      identityFrontDocument?.document_type,
      identityBackDocument?.document_type,
      identityFrontDocument?.label,
      identityBackDocument?.label,
      verification?.identity_document_type,
      verification?.document_type,
    ) ||
    normalizeText(verification?.identity_document_type) ||
    normalizeText(verification?.document_type);
  const emergencyContact =
    explicitEmergencyContact ||
    normalizeText(metadata?.emergency_contact) ||
    normalizeText(profile.phone);

  const verificationPayload = {
    provider_id: providerId,
    phone_verified: verification?.phone_verified ?? false,
    email_verified: verification?.email_verified ?? false,
    identity_verified: Boolean(frontUrl && backUrl),
    kyc_verified: Boolean(frontUrl && backUrl),
    background_check_verified: verification?.background_check_verified ?? false,
    document_type: resolvedDocumentType || null,
    identity_document_type: resolvedDocumentType || null,
    front_image_name:
      normalizeText(identityFrontDocument?.label) ||
      normalizeText(verification?.front_image_name) ||
      (resolvedDocumentType ? `${resolvedDocumentType} Front` : null),
    back_image_name:
      normalizeText(identityBackDocument?.label) ||
      normalizeText(verification?.back_image_name) ||
      (resolvedDocumentType ? `${resolvedDocumentType} Back` : null),
    document_front_url: frontUrl || null,
    document_back_url: backUrl || null,
    identity_front_image_url: frontUrl || null,
    identity_back_image_url: backUrl || null,
    requested_documents: verification?.requested_documents ?? [],
    admin_note: verification?.admin_note ?? "",
  };

  const metadataPayload = {
    provider_id: providerId,
    emergency_contact: emergencyContact || null,
  };

  const { error: verificationError } = await supabase
    .from("provider_verifications")
    .upsert(verificationPayload, { onConflict: "provider_id" });

  if (verificationError) {
    throw verificationError;
  }

  const { error: metadataError } = await supabase
    .from("provider_admin_metadata")
    .upsert(metadataPayload, { onConflict: "provider_id" });

  if (metadataError) {
    throw metadataError;
  }

  console.log(JSON.stringify({
    ok: true,
    providerId,
    profile: {
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
    },
    source: {
      explicitFrontUrl: explicitFrontUrl || null,
      explicitBackUrl: explicitBackUrl || null,
      providerDocumentsFrontUrl: identityFrontDocument?.file_url ?? null,
      providerDocumentsBackUrl: identityBackDocument?.file_url ?? null,
      existingVerificationFrontUrl: verification?.identity_front_image_url ?? verification?.document_front_url ?? null,
      existingVerificationBackUrl: verification?.identity_back_image_url ?? verification?.document_back_url ?? null,
    },
    written: {
      emergencyContact: metadataPayload.emergency_contact,
      identityDocumentType: verificationPayload.identity_document_type,
      identityFrontImageUrl: verificationPayload.identity_front_image_url,
      identityBackImageUrl: verificationPayload.identity_back_image_url,
      identityVerified: verificationPayload.identity_verified,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
