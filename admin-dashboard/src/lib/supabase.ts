import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const adminResetRedirectUrlFromEnv = import.meta.env.VITE_ADMIN_RESET_REDIRECT_URL;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getAdminResetRedirectUrl() {
  if (adminResetRedirectUrlFromEnv?.trim()) {
    return adminResetRedirectUrlFromEnv.trim();
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/reset-password`;
  }

  return "https://admin.dellaapp.com/reset-password";
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
