import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  getSupabaseServiceKey,
  getSupabaseUrl,
} from "@/lib/supabase-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NotificationRow = {
  id: string;
  booking_id: string | null;
  notification_type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

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

async function verifyAuthenticatedRequest(request: Request) {
  const adminClient = getAdminSupabaseClient();

  if (!adminClient) {
    return {
      error: NextResponse.json(
        { error: "Supabase is not configured yet." },
        { status: 500 }
      ),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Missing auth token." },
        { status: 401 }
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
        { error: "Invalid session." },
        { status: 401 }
      ),
    };
  }

  return {
    adminClient,
    user,
  };
}

function mapNotification(row: NotificationRow) {
  return {
    id: row.id,
    bookingId: row.booking_id ?? undefined,
    type: row.notification_type,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  const verified = await verifyAuthenticatedRequest(request);

  if ("error" in verified) {
    return verified.error;
  }

  const { data, error } = await verified.adminClient
    .from("notifications")
    .select("id, booking_id, notification_type, title, body, is_read, created_at")
    .eq("user_id", verified.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load notifications." },
      { status: 500 }
    );
  }

  const notifications = ((data ?? []) as NotificationRow[]).map(mapNotification);

  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((item) => !item.isRead).length,
  });
}
