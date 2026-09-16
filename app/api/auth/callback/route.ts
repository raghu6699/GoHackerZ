import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getCurrentDbUser } from "@/lib/profile";

/**
 * GET /api/auth/callback?code=… — exchanges the Supabase OAuth/email auth code
 * for a session cookie, syncs the user into Prisma (and sends welcome email),
 * then redirects to `next` or home.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/auth/error`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Sync user profile into Prisma database and trigger welcome email if new
      try {
        await getCurrentDbUser();
      } catch (err) {
        console.error("Error syncing user profile on auth callback:", err);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
