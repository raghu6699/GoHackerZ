import { NextResponse } from "next/server";
import { getParticipantByTicket } from "@/lib/hackathons";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const participant = await getParticipantByTicket(ticketId);

    if (!participant) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("Fetch ticket error:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}
