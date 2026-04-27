'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserClient, getBrowserClient } from './supabase-client';
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
  const [clientReady, setClientReady] = useState(false);

  // Initialize browser client via API config
  useEffect(() => {
    let mounted = true;
    async function initClient() {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('Failed to fetch config');
        const { url, anonKey } = await res.json();
        if (mounted) {
          createBrowserClient(url, anonKey);
          setClientReady(true);
        }
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        if (mounted) setIsLoading(false);
      }
    }
    initClient();
    return () => { mounted = false; };
  }, []);

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
    const supabase = getBrowserClient();
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
    if (!clientReady) return;

    let mounted = true;
    const supabase = getBrowserClient();

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
  }, [clientReady]);

  const login = async (email: string, password: string) => {
    if (!clientReady) return { error: 'Client not ready' };
    const supabase = getBrowserClient();
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
    if (!clientReady) return;
    const supabase = getBrowserClient();
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
