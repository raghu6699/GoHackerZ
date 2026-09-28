import { NextResponse } from "next/server";
import { submitProject, getHackathonBySlug, getAllSubmissions } from "@/lib/hackathons";

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
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const hackathon = await getHackathonBySlug(slug);
    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    const submissions = await getAllSubmissions(hackathon.id);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
