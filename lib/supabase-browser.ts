import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Browser-side Supabase client (client components).
//
// Mirrors the middleware's fail-open stance: if NEXT_PUBLIC_SUPABASE_URL /
// NEXT_PUBLIC_SUPABASE_ANON_KEY are missing (env not scoped to this Vercel
// environment, local dev without .env, etc.) we return null instead of
// letting @supabase/ssr throw — a throw here escapes inside NavAuth's effect
// in the ROOT LAYOUT and blanks the whole site behind global-error.tsx.
// Callers must null-check and degrade (show "Sign in", disable auth UI).

export function supabaseBrowserConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}