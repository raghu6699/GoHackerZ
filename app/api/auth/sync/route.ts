import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getCurrentDbUser } from "@/lib/profile";

/**
 * POST /api/auth/sync — after Supabase Auth sign-in/sign-up, mirror the auth
 * user into the public.User table (Prisma) and sync HTTP session cookies so that
 * edge middleware and server components on subsequent routes (like /write or /read)
 * recognize the authenticated user immediately without race conditions.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { access_token, refresh_token } = body;

    if (access_token && refresh_token) {
      const supabase = await createClient();
      if (supabase) {
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
      }
    }

    const dbUser = await getCurrentDbUser();

    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, userId: dbUser.id });
  } catch (err) {
    console.error("POST /api/auth/sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}