import { NextResponse } from "next/server";
import { registerHacker, getHackathonBySlug } from "@/lib/hackathons";
import { sendEmail, hackerPassportEmail } from "@/lib/mailer";

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
    const {
      name,
      email,
      roleTitle,
      bio,
      discordHandle,
      twitterHandle,
      avatarUrl,
      themeStyle,
      teamOption,
      teamName,
      teamInviteCode,
    } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required to register" },
        { status: 400 }
      );
    }

    const participant = await registerHacker({
      hackathonId: hackathon.id,
      name,
      email,
      roleTitle: roleTitle || "Fullstack Builder",
      bio,
      discordHandle,
      twitterHandle,
      avatarUrl,
      themeStyle: themeStyle || "lime",
      teamOption: teamOption || "solo",
      teamName,
      teamInviteCode,
    });

    // Send the official Hacker Passport confirmation email
    try {
      const emailMsg = hackerPassportEmail({
        to: participant.email,
        name: participant.name,
        ticketNumber: participant.ticketNumber,
        roleTitle: participant.roleTitle,
        teamName: participant.teamName,
        teamCode: participant.teamCode,
        hackathonSlug: hackathon.slug,
        hackathonTitle: hackathon.title,
      });
      // Fire and log send result
      sendEmail(emailMsg).catch((err) => {
        console.error("Failed to send hacker passport email:", err);
      });
    } catch (mailErr) {
      console.warn("Could not dispatch passport email:", mailErr);
    }

    return NextResponse.json({ success: true, participant });
  } catch (error) {
    console.error("Hackathon registration error:", error);
    return NextResponse.json(
      { error: "Failed to process hackathon registration" },
      { status: 500 }
    );
  }
}

