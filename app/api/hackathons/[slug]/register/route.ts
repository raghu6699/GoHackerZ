import { NextResponse } from "next/server";
import { registerHacker, getHackathonBySlug, getParticipantByEmail } from "@/lib/hackathons";
import { sendEmail, hackerPassportEmail } from "@/lib/mailer";
import { getCurrentDbUser } from "@/lib/profile";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentDbUser();
    if (!user || !user.email) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to register for hackathons." },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const hackathon = await getHackathonBySlug(slug);
    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
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

    const hackerName = name?.trim() || user.name || "Anonymous Builder";
    const cleanEmail = user.email.trim().toLowerCase();

    const participant = await registerHacker({
      hackathonId: hackathon.id,
      name: hackerName,
      email: cleanEmail,
      roleTitle: roleTitle || "Fullstack Builder",
      bio,
      discordHandle,
      twitterHandle,
      avatarUrl: avatarUrl || user.avatarUrl || undefined,
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
      const result = await sendEmail(emailMsg);
      console.info(
        `[Register] Passport email dispatched to ${participant.email}, delivered: ${result.delivered}, provider: ${result.provider}`
      );
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
