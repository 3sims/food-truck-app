// @ts-nocheck — Deno runtime, not Node.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export function getSupabaseClient(authToken?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  if (authToken) {
    // Client authentifié utilisateur (respecte les RLS policies)
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${authToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  // Client service (bypass RLS)
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}