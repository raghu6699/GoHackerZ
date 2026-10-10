import { NextResponse } from "next/server";
import { getParticipantByTicket } from "@/lib/hackathons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const participant = await getParticipantByTicket(ticketId);

    if (!participant) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, participant });
  } catch (error) {
    console.error("Fetch ticket error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch ticket" }, { status: 500 });
  }
}
