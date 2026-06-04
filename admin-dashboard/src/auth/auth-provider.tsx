import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { AdminProfile } from "../types";

type AuthContextValue = {
  authError: string | null;
  initialized: boolean;
  profile: AdminProfile | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const profile = useMemo<AdminProfile | null>(() => {
    if (!session) {
      return null;
    }

    return {
      id: session.user.id,
      full_name:
        typeof session.user.user_metadata?.full_name === "string"
          ? session.user.user_metadata.full_name
          : null,
      email: session.user.email ?? null,
      role: null,
      status: null,
    };
  }, [session]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable auth.");
      setInitialized(true);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setInitialized(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitialized(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authError,
      initialized,
      profile,
      session,
      async signIn(email, password) {
        if (!supabase) {
          return "Supabase environment variables are missing.";
        }

        setAuthError(null);

        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });

          if (error) {
            return "Wrong credentials";
          }

          setSession(data.session ?? null);
          return null;
        } catch (error) {
          return error instanceof Error ? "Wrong credentials" : "Unable to sign in right now.";
        }
      },
      async signOut() {
        if (!supabase) {
          return;
        }

        setSession(null);
        await supabase.auth.signOut();
      },
    }),
    [authError, initialized, profile, session]
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
