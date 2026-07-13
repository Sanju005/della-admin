import { supabase } from "./supabase";

export type AdminUserDocumentRecord = {
  id: string;
  documentType: string;
  label: string;
  status: string;
  fileUrl?: string;
  fileName?: string;
  updated?: string;
  note?: string;
};

const adminUserDocumentsApiBase =
  import.meta.env.VITE_ADMIN_USER_DOCUMENTS_URL?.trim() || "/api/admin/user-documents";

async function getAdminAccessToken() {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export async function listAdminUserDocuments(userId: string) {
  if (!supabase) {
    return { error: "Supabase is not configured.", documents: [] as AdminUserDocumentRecord[] };
  }

  const accessToken = await getAdminAccessToken();

  if (!accessToken) {
    return { error: "Admin session expired. Please sign in again.", documents: [] as AdminUserDocumentRecord[] };
  }

  try {
    const response = await fetch(`${adminUserDocumentsApiBase}/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      documents?: AdminUserDocumentRecord[];
    };

    if (!response.ok) {
      return {
        error: payload.error || "Unable to load user documents.",
        documents: [] as AdminUserDocumentRecord[],
      };
    }

    return {
      error: null,
      documents: payload.documents ?? [],
    };
  } catch {
    return {
      error: "Unable to reach the admin document service.",
      documents: [] as AdminUserDocumentRecord[],
    };
  }
}

export async function uploadAdminUserDocument(input: {
  userId: string;
  documentType: string;
  label: string;
  fileName: string;
  fileDataUrl: string;
  status?: string;
}) {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const accessToken = await getAdminAccessToken();

  if (!accessToken) {
    return { error: "Admin session expired. Please sign in again." };
  }

  try {
    const response = await fetch(`${adminUserDocumentsApiBase}/${input.userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      return {
        error: payload.error || "Unable to upload user document.",
      };
    }

    return { error: null };
  } catch {
    return { error: "Unable to reach the admin document service." };
  }
}
