import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const outputDir = path.resolve("data", "live-audit");

function csvEscape(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(rows, columns) {
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","));
  return [header, ...lines].join("\n");
}

function normalizeRole(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isProviderRole(value) {
  const normalized = normalizeRole(value);
  return normalized === "provider" || normalized === "service_provider";
}

function isCustomerRole(value) {
  const normalized = normalizeRole(value);
  return normalized === "customer" || normalized === "";
}

function stringify(value) {
  if (Array.isArray(value)) {
    return value.join(" | ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return value ?? "";
}

async function fetchAll(table, select, orderColumn = "created_at") {
  const pageSize = 1000;
  const rows = [];
  let from = 0;

  while (true) {
    const query = supabase
      .from(table)
      .select(select)
      .range(from, from + pageSize - 1);

    const orderedQuery = orderColumn ? query.order(orderColumn, { ascending: false }) : query;
    const { data, error } = await orderedQuery;

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < pageSize) {
      return rows;
    }

    from += pageSize;
  }
}

async function fetchAllOptional(table, select, orderColumn = "created_at") {
  try {
    return await fetchAll(table, select, orderColumn);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("Could not find the table") ||
      message.includes("schema cache") ||
      message.includes("does not exist")
    ) {
      return [];
    }

    throw error;
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const [
    profiles,
    customerProfiles,
    providerProfiles,
    providerVerifications,
    providerAdminMetadata,
    providerServices,
    providerDocuments,
  ] = await Promise.all([
    fetchAll("profiles", "id, full_name, email, role, status, phone, created_at"),
    fetchAll(
      "customer_profiles",
      "id, first_name, last_name, phone_number, country_code, date_of_birth, sex, city, region, state, country, verified, completion, created_at",
    ),
    fetchAll(
      "provider_profiles",
      "id, marketing_name, profile_photo_url, service_location, service_radius_km, date_of_birth, sex, residential_address, bio, average_rating, total_reviews, approval_status, is_visible, created_at",
    ),
    fetchAll(
      "provider_verifications",
      "provider_id, phone_verified, email_verified, identity_verified, kyc_verified, background_check_verified, document_type, requested_documents, admin_note, last_reviewed_at, created_at",
    ),
    fetchAll(
      "provider_admin_metadata",
      "provider_id, availability_days, availability_time_preset, availability_start_time, availability_end_time, emergency_contact, profile_image_name, current_latitude, current_longitude, created_at",
    ),
    fetchAll(
      "provider_services",
      "id, provider_id, service_type, years_experience, hourly_rate, daily_rate, created_at",
    ),
    fetchAllOptional(
      "provider_documents",
      "id, provider_id, document_type, label, status, created_at",
    ),
  ]);

  const profileMap = new Map(profiles.map((row) => [row.id, row]));
  const customerMap = new Map(customerProfiles.map((row) => [row.id, row]));
  const providerMap = new Map(providerProfiles.map((row) => [row.id, row]));
  const verificationMap = new Map(providerVerifications.map((row) => [row.provider_id, row]));
  const adminMetadataMap = new Map(providerAdminMetadata.map((row) => [row.provider_id, row]));

  const providerServicesMap = new Map();
  for (const row of providerServices) {
    const list = providerServicesMap.get(row.provider_id) ?? [];
    list.push(row);
    providerServicesMap.set(row.provider_id, list);
  }

  const providerDocumentsMap = new Map();
  for (const row of providerDocuments) {
    const list = providerDocumentsMap.get(row.provider_id) ?? [];
    list.push(row);
    providerDocumentsMap.set(row.provider_id, list);
  }

  const customerRows = profiles
    .filter((profile) => isCustomerRole(profile.role))
    .map((profile) => {
      const customer = customerMap.get(profile.id);
      return {
        id: profile.id,
        email: profile.email ?? "",
        full_name: profile.full_name ?? "",
        role: profile.role ?? "",
        status: profile.status ?? "",
        profile_phone: profile.phone ?? "",
        first_name: customer?.first_name ?? "",
        last_name: customer?.last_name ?? "",
        customer_phone_number: customer?.phone_number ?? "",
        customer_country_code: customer?.country_code ?? "",
        date_of_birth: customer?.date_of_birth ?? "",
        sex: customer?.sex ?? "",
        city: customer?.city ?? "",
        region: customer?.region ?? "",
        state: customer?.state ?? "",
        country: customer?.country ?? "",
        verified: customer?.verified ?? "",
        completion: customer?.completion ?? "",
        has_customer_profile: customer ? "yes" : "no",
        created_at: profile.created_at ?? "",
      };
    });

  const providerRows = profiles
    .filter((profile) => isProviderRole(profile.role))
    .map((profile) => {
      const provider = providerMap.get(profile.id);
      const verification = verificationMap.get(profile.id);
      const metadata = adminMetadataMap.get(profile.id);
      const services = providerServicesMap.get(profile.id) ?? [];
      const documents = providerDocumentsMap.get(profile.id) ?? [];

      return {
        id: profile.id,
        email: profile.email ?? "",
        full_name: profile.full_name ?? "",
        role: profile.role ?? "",
        status: profile.status ?? "",
        profile_phone: profile.phone ?? "",
        marketing_name: provider?.marketing_name ?? "",
        profile_photo_url: provider?.profile_photo_url ?? "",
        service_location: provider?.service_location ?? "",
        service_radius_km: provider?.service_radius_km ?? "",
        date_of_birth: provider?.date_of_birth ?? "",
        sex: provider?.sex ?? "",
        residential_address: provider?.residential_address ?? "",
        bio: provider?.bio ?? "",
        average_rating: provider?.average_rating ?? "",
        total_reviews: provider?.total_reviews ?? "",
        approval_status: provider?.approval_status ?? "",
        is_visible: provider?.is_visible ?? "",
        phone_verified: verification?.phone_verified ?? "",
        email_verified: verification?.email_verified ?? "",
        identity_verified: verification?.identity_verified ?? "",
        kyc_verified: verification?.kyc_verified ?? "",
        background_check_verified: verification?.background_check_verified ?? "",
        document_type: verification?.document_type ?? "",
        requested_documents: stringify(verification?.requested_documents),
        admin_note: verification?.admin_note ?? "",
        last_reviewed_at: verification?.last_reviewed_at ?? "",
        availability_days: stringify(metadata?.availability_days),
        availability_time_preset: metadata?.availability_time_preset ?? "",
        availability_start_time: metadata?.availability_start_time ?? "",
        availability_end_time: metadata?.availability_end_time ?? "",
        emergency_contact: metadata?.emergency_contact ?? "",
        profile_image_name: metadata?.profile_image_name ?? "",
        current_latitude: metadata?.current_latitude ?? "",
        current_longitude: metadata?.current_longitude ?? "",
        service_count: services.length,
        service_types: stringify(services.map((service) => service.service_type).filter(Boolean)),
        document_count: documents.length,
        document_labels: stringify(documents.map((document) => document.label || document.document_type).filter(Boolean)),
        has_provider_profile: provider ? "yes" : "no",
        has_provider_verification: verification ? "yes" : "no",
        has_provider_admin_metadata: metadata ? "yes" : "no",
        created_at: profile.created_at ?? "",
      };
    });

  const mismatchRows = [];

  for (const profile of profiles) {
    const role = normalizeRole(profile.role);
    const customer = customerMap.get(profile.id);
    const provider = providerMap.get(profile.id);
    const verification = verificationMap.get(profile.id);
    const metadata = adminMetadataMap.get(profile.id);
    const services = providerServicesMap.get(profile.id) ?? [];

    if (isCustomerRole(role) && !customer) {
      mismatchRows.push({
        entity_type: "customer",
        id: profile.id,
        email: profile.email ?? "",
        issue_type: "missing_customer_profile",
        details: "profiles row exists but customer_profiles row is missing",
      });
    }

    if (isProviderRole(role) && !provider) {
      mismatchRows.push({
        entity_type: "provider",
        id: profile.id,
        email: profile.email ?? "",
        issue_type: "missing_provider_profile",
        details: "profiles row exists but provider_profiles row is missing",
      });
    }

    if (isProviderRole(role) && provider && !verification) {
      mismatchRows.push({
        entity_type: "provider",
        id: profile.id,
        email: profile.email ?? "",
        issue_type: "missing_provider_verification",
        details: "provider_profiles row exists but provider_verifications row is missing",
      });
    }

    if (isProviderRole(role) && provider && !metadata) {
      mismatchRows.push({
        entity_type: "provider",
        id: profile.id,
        email: profile.email ?? "",
        issue_type: "missing_provider_admin_metadata",
        details: "provider_profiles row exists but provider_admin_metadata row is missing",
      });
    }

    if (isProviderRole(role) && provider && services.length === 0) {
      mismatchRows.push({
        entity_type: "provider",
        id: profile.id,
        email: profile.email ?? "",
        issue_type: "missing_provider_services",
        details: "provider has no provider_services rows",
      });
    }
  }

  for (const customer of customerProfiles) {
    const profile = profileMap.get(customer.id);
    if (!profile) {
      mismatchRows.push({
        entity_type: "customer",
        id: customer.id,
        email: "",
        issue_type: "orphan_customer_profile",
        details: "customer_profiles row exists but profiles row is missing",
      });
    }
  }

  for (const provider of providerProfiles) {
    const profile = profileMap.get(provider.id);
    if (!profile) {
      mismatchRows.push({
        entity_type: "provider",
        id: provider.id,
        email: "",
        issue_type: "orphan_provider_profile",
        details: "provider_profiles row exists but profiles row is missing",
      });
    }
  }

  for (const verification of providerVerifications) {
    const profile = profileMap.get(verification.provider_id);
    if (!profile) {
      mismatchRows.push({
        entity_type: "provider",
        id: verification.provider_id,
        email: "",
        issue_type: "orphan_provider_verification",
        details: "provider_verifications row exists but profiles row is missing",
      });
    }
  }

  for (const metadata of providerAdminMetadata) {
    const profile = profileMap.get(metadata.provider_id);
    if (!profile) {
      mismatchRows.push({
        entity_type: "provider",
        id: metadata.provider_id,
        email: "",
        issue_type: "orphan_provider_admin_metadata",
        details: "provider_admin_metadata row exists but profiles row is missing",
      });
    }
  }

  const summaryRows = [
    { metric: "profiles_total", value: profiles.length },
    { metric: "customers_in_profiles", value: customerRows.length },
    { metric: "providers_in_profiles", value: providerRows.length },
    { metric: "customer_profiles_total", value: customerProfiles.length },
    { metric: "provider_profiles_total", value: providerProfiles.length },
    { metric: "provider_verifications_total", value: providerVerifications.length },
    { metric: "provider_admin_metadata_total", value: providerAdminMetadata.length },
    { metric: "provider_services_total", value: providerServices.length },
    { metric: "provider_documents_total", value: providerDocuments.length },
    { metric: "mismatch_rows_total", value: mismatchRows.length },
  ];

  await Promise.all([
    writeFile(path.join(outputDir, "live-customers.csv"), toCsv(customerRows, Object.keys(customerRows[0] ?? {
      id: "",
      email: "",
      full_name: "",
      role: "",
      status: "",
      profile_phone: "",
      first_name: "",
      last_name: "",
      customer_phone_number: "",
      customer_country_code: "",
      date_of_birth: "",
      sex: "",
      city: "",
      region: "",
      state: "",
      country: "",
      verified: "",
      completion: "",
      has_customer_profile: "",
      created_at: "",
    })), "utf8"),
    writeFile(path.join(outputDir, "live-providers.csv"), toCsv(providerRows, Object.keys(providerRows[0] ?? {
      id: "",
      email: "",
      full_name: "",
      role: "",
      status: "",
      profile_phone: "",
      marketing_name: "",
      profile_photo_url: "",
      service_location: "",
      service_radius_km: "",
      date_of_birth: "",
      sex: "",
      residential_address: "",
      bio: "",
      average_rating: "",
      total_reviews: "",
      approval_status: "",
      is_visible: "",
      phone_verified: "",
      email_verified: "",
      identity_verified: "",
      kyc_verified: "",
      background_check_verified: "",
      document_type: "",
      requested_documents: "",
      admin_note: "",
      last_reviewed_at: "",
      availability_days: "",
      availability_time_preset: "",
      availability_start_time: "",
      availability_end_time: "",
      emergency_contact: "",
      profile_image_name: "",
      current_latitude: "",
      current_longitude: "",
      service_count: "",
      service_types: "",
      document_count: "",
      document_labels: "",
      has_provider_profile: "",
      has_provider_verification: "",
      has_provider_admin_metadata: "",
      created_at: "",
    })), "utf8"),
    writeFile(path.join(outputDir, "live-mismatches.csv"), toCsv(mismatchRows, ["entity_type", "id", "email", "issue_type", "details"]), "utf8"),
    writeFile(path.join(outputDir, "live-summary.csv"), toCsv(summaryRows, ["metric", "value"]), "utf8"),
  ]);

  console.log(JSON.stringify({
    outputDir,
    summary: Object.fromEntries(summaryRows.map((row) => [row.metric, row.value])),
    sampleCustomerCount: customerRows.length,
    sampleProviderCount: providerRows.length,
    mismatchCount: mismatchRows.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
