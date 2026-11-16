import { NextResponse } from "next/server";
import { getHackathonBySlug, getParticipantByEmail } from "@/lib/hackathons";
import { getCurrentDbUser } from "@/lib/profile";

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

    // Looking up a passport by email reveals who is registered, so it is only
    // allowed for your own address.
    const viewer = await getCurrentDbUser();
    if (!viewer?.email) {
      return NextResponse.json({ error: "Please sign in to find your passport." }, { status: 401 });
    }
    const email = viewer.email.trim().toLowerCase();

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
      message: `Found your official Builder Passport #${participant.ticketNumber}!`,
    });
  } catch (error) {
    console.error("Hackathon lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up passport registration" },
      { status: 500 }
    );
  }
}
