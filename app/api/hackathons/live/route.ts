import { NextResponse } from "next/server";
import { getAllHackathons } from "@/lib/hackathons";

// Cached for a minute: the navbar asks on every page load.
export const revalidate = 60;

/** How many hackathons are running now, and how many are coming up. */
export async function GET() {
  try {
    const all = await getAllHackathons();
    return NextResponse.json({
      live: all.filter((h) => h.status === "ACTIVE").length,
      upcoming: all.filter((h) => h.status === "UPCOMING").length,
    });
  } catch {
    return NextResponse.json({ live: 0, upcoming: 0 });
  }
}
