import "server-only";

import type {
  ProviderRegistrationData,
  ProviderRegistrationRecord,
} from "./provider-registration-types";

const expectedOtp = "123456";

declare global {
  // eslint-disable-next-line no-var
  var __dellaProviderRegistrations:
    | ProviderRegistrationRecord[]
    | undefined;
}

function isWorkerdRuntime() {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

async function ensureNodeDataFile() {
  const path = await import("node:path");
  const { mkdir, readFile, writeFile } = await import("node:fs/promises");
  const registrationsFile = path.join(
    process.cwd(),
    "data",
    "provider-registrations.json",
  );
  const dataDir = path.dirname(registrationsFile);

  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(registrationsFile, "utf8");
  } catch {
    await writeFile(registrationsFile, "[]", "utf8");
  }
}

async function readNodeRegistrations() {
  const path = await import("node:path");
  const { readFile } = await import("node:fs/promises");
  const registrationsFile = path.join(
    process.cwd(),
    "data",
    "provider-registrations.json",
  );
  await ensureNodeDataFile();
  const raw = await readFile(registrationsFile, "utf8");
  return JSON.parse(raw) as ProviderRegistrationRecord[];
}

async function writeNodeRegistrations(records: ProviderRegistrationRecord[]) {
  const path = await import("node:path");
  const { writeFile } = await import("node:fs/promises");
  const registrationsFile = path.join(
    process.cwd(),
    "data",
    "provider-registrations.json",
  );
  await ensureNodeDataFile();
  await writeFile(registrationsFile, JSON.stringify(records, null, 2), "utf8");
}

function readWorkerRegistrations() {
  return globalThis.__dellaProviderRegistrations ?? [];
}

function writeWorkerRegistrations(records: ProviderRegistrationRecord[]) {
  globalThis.__dellaProviderRegistrations = records;
}

async function readRegistrations() {
  if (isWorkerdRuntime()) {
    return readWorkerRegistrations();
  }

  return readNodeRegistrations();
}

async function writeRegistrations(records: ProviderRegistrationRecord[]) {
  if (isWorkerdRuntime()) {
    writeWorkerRegistrations(records);
    return;
  }

  await writeNodeRegistrations(records);
}

export async function createProviderRegistration(
  data: ProviderRegistrationData,
  idOverride?: string,
  verificationOverrides?: {
    phoneVerified?: boolean;
    emailVerified?: boolean;
    identityVerified?: boolean;
  },
) {
  const records = await readRegistrations();
  const now = new Date().toISOString();
  const phoneOtp = data.verification.phoneOtp.join("");
  const emailOtp = data.verification.emailOtp.join("");

  const record: ProviderRegistrationRecord = {
    id: idOverride ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "pending_admin_approval",
    phoneVerified: verificationOverrides?.phoneVerified ?? phoneOtp === expectedOtp,
    emailVerified: verificationOverrides?.emailVerified ?? emailOtp === expectedOtp,
    identityVerified:
      verificationOverrides?.identityVerified ??
      Boolean(
        data.verification.documentType &&
          data.verification.frontImageName &&
          data.verification.backImageName,
      ),
    data,
  };

  records.unshift(record);
  await writeRegistrations(records);
  return record;
}

export async function getProviderRegistration(id: string) {
  const records = await readRegistrations();
  return records.find((record) => record.id === id) ?? null;
}

export async function listProviderRegistrations() {
  return readRegistrations();
}
