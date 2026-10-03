import { NextResponse } from "next/server";
import { persistParticipant, persistParticipantToDb } from "@/lib/participant-store";
import type { HackathonParticipant } from "@/lib/hackathons";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const body = await req.json();
    const participant = body.participant as HackathonParticipant;

    if (!participant || !participant.ticketNumber || !participant.name) {
      return NextResponse.json(
        { error: "Valid participant object required" },
        { status: 400 }
      );
    }

    // Persist to server memory, disk & DB
    persistParticipant(participant);
    await persistParticipantToDb(participant);

    return NextResponse.json({ success: true, participant });
  } catch (error) {
    console.error("Hackathon participant sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync participant" },
      { status: 500 }
    );
  }
}
