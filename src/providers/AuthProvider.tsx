import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { upsertProfile } from "../services/profiles";

type SignUpResult = {
  errorMessage: string | null;
  needsEmailConfirm: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      setSession(data.session);

      if (data.session?.user) {
        try {
          await upsertProfile(data.session.user);
        } catch (error) {
          console.log("upsertProfile(getSession) error:", error);
        }
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (nextSession?.user) {
        try {
          await upsertProfile(nextSession.user);
        } catch (error) {
          console.log("upsertProfile(onAuthStateChange) error:", error);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        return error?.message ?? null;
      },
      signUp: async (email, password) => {
        const {
          data: { session: signUpSession },
          error,
        } = await supabase.auth.signUp({
          email,
          password,
        });

        return {
          errorMessage: error?.message ?? null,
          needsEmailConfirm: !signUpSession,
        };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      },
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}