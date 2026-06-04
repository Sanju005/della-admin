import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { AdminProfile, AuthAccess } from "../types";

const allowedRoles = new Set(["super_admin", "admin", "manager", "customer_care"]);

type AuthContextValue = {
  access: AuthAccess;
  authError: string | null;
  loading: boolean;
  profile: AdminProfile | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function resolveAccess(profile: AdminProfile | null, session: Session | null): AuthAccess {
  if (!session) {
    return "guest";
  }

  return profile?.role && allowedRoles.has(profile.role) ? "allowed" : "denied";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const hydrateSession = useEffectEvent(async (nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (!supabase) {
      setAuthError("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status")
      .eq("id", nextSession.user.id)
      .maybeSingle<AdminProfile>();

    if (error) {
      setAuthError(error.message);
      setProfile(null);
      setLoading(false);
      return;
    }

    setAuthError(null);
    setProfile(data ?? null);
    setLoading(false);
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable auth.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        void hydrateSession(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrateSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      access: resolveAccess(profile, session),
      authError,
      loading,
      profile,
      session,
      async signIn(email, password) {
        if (!supabase) {
          return "Supabase environment variables are missing.";
        }

        setAuthError(null);

        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          return error?.message ?? null;
        } catch (error) {
          return error instanceof Error ? error.message : "Unable to sign in right now.";
        }
      },
      async signOut() {
        if (!supabase) {
          return;
        }

        await supabase.auth.signOut();
      },
    }),
    [authError, loading, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
