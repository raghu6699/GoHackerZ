import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * GET /auth/callback?code=… — exchanges the Supabase auth code (email
 * confirmations, password recovery, OAuth) for a session cookie, then
 * redirects to `next` or home.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}