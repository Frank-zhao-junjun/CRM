'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getBrowserClient } from './supabase-client';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  roles: Array<{ id: string; name: string; description: string | null }>;
}

interface AuthContextValue {
  user: AuthUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getBrowserClient();

  const fetchUserProfile = async (uid: string) => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setSupabaseUser(data.session.user);
      await fetchUserProfile(data.session.user.id);
    } else {
      setSupabaseUser(null);
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session?.user) {
        setSupabaseUser(data.session.user);
        await fetchUserProfile(data.session.user.id);
      }
      setIsLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user.id);
        // Sync token to cookie for middleware
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: session.access_token }),
        });
      } else {
        setSupabaseUser(null);
        setUser(null);
        await fetch('/api/auth/session', { method: 'DELETE' });
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    if (data.session) {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: data.session.access_token }),
      });
      setSupabaseUser(data.session.user);
      await fetchUserProfile(data.session.user.id);
    }
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await fetch('/api/auth/session', { method: 'DELETE' });
    setSupabaseUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
