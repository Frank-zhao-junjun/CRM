import { createClient } from '@supabase/supabase-js';

let browserClient: ReturnType<typeof createClient> | null = null;

export function createBrowserClient(url: string, anonKey: string) {
  if (browserClient) return browserClient;
  browserClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}

export function getBrowserClient() {
  if (!browserClient) {
    throw new Error('Browser client not initialized. Call createBrowserClient first.');
  }
  return browserClient;
}
