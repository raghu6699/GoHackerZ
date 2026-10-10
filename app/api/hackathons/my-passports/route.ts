import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { getUserHackathonHistory } from "@/lib/hackathons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentDbUser();
    if (!user || !user.email) {
      return NextResponse.json({ success: true, passports: [] });
    }

    const history = await getUserHackathonHistory(user.email);
    const passports = history.map(({ hackathon, participant }) => ({
      ...participant,
      hackathonSlug: hackathon.slug,
      hackathonTitle: hackathon.title,
    }));

    return NextResponse.json({ success: true, passports });
  } catch (error) {
    console.warn("[my-passports API] lookup error:", error);
    return NextResponse.json({ success: false, passports: [] });
  }
}
