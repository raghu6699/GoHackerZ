import { NextResponse } from "next/server";
import { submitProject, getHackathonBySlug, getAllSubmissions, getParticipantByTicket } from "@/lib/hackathons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      ticketNumber,
      trackId,
      title,
      tagline,
      description,
      repoUrl,
      demoUrl,
      pitchDeckUrl,
      videoUrl,
      gammaUrl,
      techStack,
    } = body;

    if (!ticketNumber || !title || !repoUrl) {
      return NextResponse.json(
        { error: "Ticket number, project title, and GitHub repo are required" },
        { status: 400 }
      );
    }

    const submission = await submitProject({
      hackathonId: hackathon.id,
      ticketNumber,
      trackId: trackId || "ai-agents",
      title,
      tagline: tagline || "",
      description: description || "",
      repoUrl,
      demoUrl,
      pitchDeckUrl,
      videoUrl,
      gammaUrl,
      techStack: Array.isArray(techStack) ? techStack : [],
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("Hackathon submission error:", error);
    return NextResponse.json(
      { error: "Failed to save hackathon submission" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const hackathon = await getHackathonBySlug(slug);
    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const ticketParam = searchParams.get("ticket");

    const submissions = await getAllSubmissions(hackathon.id);

    if (ticketParam) {
      const clean = ticketParam.trim().toUpperCase();
      const direct = submissions.find((s) => s.ticketNumber?.toUpperCase() === clean);
      if (direct) {
        return NextResponse.json({ success: true, submission: direct, submissions });
      }

      // Check if ticket is in a team that submitted
      const participant = await getParticipantByTicket(clean);
      if (participant?.submission) {
        return NextResponse.json({ success: true, submission: participant.submission, submissions });
      }
      if (participant?.teamName) {
        const teamMatch = submissions.find(
          (s) => s.teamName && s.teamName.toLowerCase() === participant.teamName!.toLowerCase()
        );
        if (teamMatch) {
          return NextResponse.json({ success: true, submission: teamMatch, submissions });
        }
      }

      return NextResponse.json({ success: true, submission: null, submissions });
    }

    return NextResponse.json({ success: true, submissions });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
