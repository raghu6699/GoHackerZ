import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Server-side Supabase client (server components / route handlers)
// Next 15+: cookies() is async.
//
// Fail-open stance, mirroring lib/supabase-browser.ts and middleware.ts:
// if NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing or
// malformed (env not scoped to this Vercel environment, local dev without
// .env, etc.) we return null instead of letting createServerClient throw.
// A throw here surfaces as a 500 on every route that resolves the current
// user (react/bookmark/comments/follow/…), so callers must null-check and
// degrade to signed-out behaviour.
export async function createClient(): Promise<SupabaseClient | null> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component — safe to ignore,
            // middleware handles session refresh
          }
        },
      },
    }
  );
}