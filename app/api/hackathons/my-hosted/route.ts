import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { getAllHackathons } from "@/lib/hackathons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Hackathons whose approved host proposal was submitted with the signed-in user's email. */
export async function GET() {
  try {
    const user = await getCurrentDbUser();
    if (!user?.email) return NextResponse.json({ success: true, events: [] });
    const me = user.email.trim().toLowerCase();
    const all = await getAllHackathons();
    const events = all
      .filter((h) => h.hostEmail && h.hostEmail.trim().toLowerCase() === me)
      .map((h) => ({ slug: h.slug, title: h.title }));
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.warn("[my-hosted API] lookup error:", error);
    return NextResponse.json({ success: false, events: [] });
  }
}
