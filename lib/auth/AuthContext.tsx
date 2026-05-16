import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { env } from '@/lib/env';
import { logInRevenueCat, logOutRevenueCat } from '@/lib/purchases/revenuecat';
import { supabase } from '@/lib/supabase/client';

type AuthContextValue = {
  initialized: boolean;
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;

    if (!env.supabaseConfigured) {
      setSession(null);
      setInitialized(true);
      return () => {
        active = false;
      };
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setInitialized(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized || !env.supabaseConfigured) return;
    const id = session?.user?.id;
    if (id) {
      void logInRevenueCat(id);
    } else {
      void logOutRevenueCat();
    }
  }, [initialized, session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      session,
      user: session?.user ?? null,
      signOut: async () => {
        if (env.supabaseConfigured) {
          await logOutRevenueCat();
          await supabase.auth.signOut();
        }
      },
    }),
    [initialized, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
