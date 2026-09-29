import { NextResponse } from "next/server";
import { getHackathonBySlug, getParticipantByEmail } from "@/lib/hackathons";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const hackathon = await getHackathonBySlug(slug);
    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    const body = await req.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const participant = await getParticipantByEmail(hackathon.id, email);

    if (!participant) {
      return NextResponse.json(
        {
          found: false,
          message: `No active passport was found for "${email}". Please register to claim your ticket!`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      participant,
      ticketNumber: participant.ticketNumber,
      passportUrl: `/hackathons/${slug}/pass/${participant.ticketNumber}`,
      message: `Found your official Hacker Passport #${participant.ticketNumber}!`,
    });
  } catch (error) {
    console.error("Hackathon lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up passport registration" },
      { status: 500 }
    );
  }
}
