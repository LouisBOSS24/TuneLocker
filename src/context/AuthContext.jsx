import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../supabase-client";
import { touchLastSeen } from "../lib/lastSeen";

// =============================================================
//  AuthProvider
// =============================================================

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    touchLastSeen(userId);
    const interval = setInterval(() => touchLastSeen(userId), 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  useEffect(() => {
    const user = session?.user;
    if (!user) return;

    (async () => {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("profiles").insert({
          id: user.id,
          first_name: user.user_metadata?.first_name,
          last_name: user.user_metadata?.last_name,
          username: user.user_metadata?.username,
        });
      }
    })();
  }, [session?.user?.id]);

  async function signUp({ email, password, firstName, lastName, username }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          username,
        },
      },
    });
    return { data, error };
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error };
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================
//  Hook useAuth
// =============================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  }
  return context;
}
