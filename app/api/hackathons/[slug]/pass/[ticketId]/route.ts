import { NextResponse } from "next/server";
import { getParticipantByTicket } from "@/lib/hackathons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; ticketId: string }> }
) {
  try {
    const { slug, ticketId } = await params;
    const participant = await getParticipantByTicket(ticketId);

    if (!participant) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    const cleanSlug = slug.replace(/^gh-/, "").toLowerCase();
    const isFlagship = cleanSlug === "shipathon-2026" || cleanSlug === "shipathon" || slug === "active" || slug === "current";
    const pHackId = (participant.hackathonId || "").replace(/^gh-/, "").toLowerCase();

    const matchesThisHackathon = isFlagship
      ? (!pHackId || pHackId === "shipathon-2026" || pHackId === "shipathon")
      : (pHackId === cleanSlug || pHackId === `gh-${cleanSlug}`);

    if (!matchesThisHackathon) {
      return NextResponse.json(
        {
          success: false,
          error: `Ticket #${ticketId} is registered for a different hackathon, not for "${slug}". Please register for this event to get your event pass.`,
          differentHackathon: true,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, participant });
  } catch (error) {
    console.error("Fetch ticket error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch ticket" }, { status: 500 });
  }
}
