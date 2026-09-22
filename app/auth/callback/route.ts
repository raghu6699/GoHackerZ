import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getCurrentDbUser } from "@/lib/profile";

/**
 * GET /auth/callback?code=… — exchanges the Supabase auth code (email
 * confirmations, password recovery, OAuth) for a session cookie, syncs
 * the Prisma user profile, then redirects to `next` or home.
 */
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * GET /auth/callback — handles Supabase auth callbacks (email
 * confirmations, password recovery, OTP tokens, OAuth code exchange),
 * sets session cookies, mirrors the user profile, and redirects.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  // 1. Verify OTP with token_hash & type (used for direct server recovery links)
  if (token_hash && type && supabase) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      try {
        await getCurrentDbUser();
      } catch (err) {
        console.error("Error syncing user profile on auth callback:", err);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 2. Exchange authorization code for session (used for OAuth & PKCE flows)
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        await getCurrentDbUser();
      } catch (err) {
        console.error("Error syncing user profile on auth callback:", err);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 3. Fallback for implicit hash redirects or reset-password landing
  if (next && next !== "/") {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}