import { NextResponse } from "next/server";
import { persistParticipant, persistParticipantToDb, persistSubmission } from "@/lib/participant-store";
import { getParticipantByTicket, type HackathonParticipant } from "@/lib/hackathons";
import { getCurrentDbUser } from "@/lib/profile";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentDbUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json();
    const participant = body.participant as HackathonParticipant;

    if (!participant || !participant.ticketNumber || !participant.name) {
      return NextResponse.json(
        { error: "Valid participant object required" },
        { status: 400 }
      );
    }

    // Only the owner may write a passport: the record being saved, and any
    // existing record under the same ticket, must belong to the signed-in user.
    const me = user.email.trim().toLowerCase();
    const existing = await getParticipantByTicket(participant.ticketNumber);
    const owner = (existing?.email ?? participant.email ?? "").trim().toLowerCase();
    if (!owner || owner !== me || (participant.email ?? "").trim().toLowerCase() !== me) {
      return NextResponse.json({ error: "Not your passport." }, { status: 403 });
    }

    // Persist to server memory, disk & DB
    persistParticipant(participant);
    await persistParticipantToDb(participant);

    if (participant.submission) {
      await persistSubmission({
        ...participant.submission,
        ticketNumber: participant.ticketNumber,
        hackathonId: participant.hackathonId || slug,
      });
    }

    return NextResponse.json({ success: true, participant });
  } catch (error) {
    console.error("Hackathon participant sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync participant" },
      { status: 500 }
    );
  }
}
