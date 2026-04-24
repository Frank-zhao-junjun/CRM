'use client';

import { createClient } from '@supabase/supabase-js';

function getSupabaseCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase URL or Anon Key is not configured');
  }
  return { url, anonKey };
}

let browserClient: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (browserClient) return browserClient;
  const { url, anonKey } = getSupabaseCredentials();
  browserClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}
