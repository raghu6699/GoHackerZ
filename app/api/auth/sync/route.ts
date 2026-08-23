import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";

/**
 * POST /api/auth/sync — after Supabase Auth sign-in/sign-up, mirror the auth
 * user into the public.User table (Prisma) so profiles/articles link up.
 */
export async function POST() {
  const dbUser = await getCurrentDbUser();

  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, userId: dbUser.id });
}