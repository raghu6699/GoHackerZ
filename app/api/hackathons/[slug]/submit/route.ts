import { NextResponse } from "next/server";
import { submitProject, getHackathonBySlug, getAllSubmissions, getParticipantByTicket } from "@/lib/hackathons";
import { prisma } from "@/lib/prisma";
import { requireTicketOwner } from "@/lib/ticket-auth";
import { getSubmissionWindow } from "@/lib/submission-window";
import { getCurrentDbUser } from "@/lib/profile";
import { canUserManageHackathon } from "@/lib/admin-auth";

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

    if (hackathon.status === "COMPLETED" || hackathon.status === "JUDGING") {
      return NextResponse.json(
        {
          error: `Project submissions are closed for this hackathon (${
            hackathon.status === "COMPLETED" ? "Hackathon Concluded" : "Judging in Progress"
          }).`,
        },
        { status: 400 }
      );
    }

    // Submissions are only accepted during the build window. Organizers and
    // admins can still submit (e.g. to test the flow or fix a late entry).
    const win = getSubmissionWindow(hackathon);
    if (!win.open) {
      const manager = canUserManageHackathon(await getCurrentDbUser(), hackathon);
      if (!manager) {
        const when = new Date(win.opensAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
        });
        return NextResponse.json(
          {
            error:
              win.reason === "not-started"
                ? `Submissions open when the build starts (${when} IST). Build on the day, then submit here.`
                : "The submission deadline has passed for this hackathon.",
            window: win,
          },
          { status: 400 }
        );
      }
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

    const cleanTicket = ticketNumber.trim().toUpperCase();
    const auth = await requireTicketOwner(cleanTicket);
    if (!auth.ok && auth.status !== 404) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const participant = auth.ok ? auth.participant : null;

    if (!participant) {
      return NextResponse.json(
        {
          error: `Ticket #${cleanTicket} is not registered. You must register for "${hackathon.title}" before submitting a project.`,
        },
        { status: 403 }
      );
    }

    // Check if participant is registered for THIS specific hackathon
    const cleanSlug = slug.replace(/^gh-/, "").toLowerCase();
    const isFlagship = cleanSlug === "shipathon-2026" || cleanSlug === "shipathon" || slug === "active" || slug === "current";
    const pHackId = (participant.hackathonId || "").replace(/^gh-/, "").toLowerCase();

    const matchesThisHackathon = isFlagship
      ? (!pHackId || pHackId === "shipathon-2026" || pHackId === "shipathon" || pHackId === hackathon.id)
      : (pHackId === cleanSlug || pHackId === hackathon.id || pHackId === `gh-${cleanSlug}`);

    if (!matchesThisHackathon) {
      return NextResponse.json(
        {
          error: `Ticket #${cleanTicket} is registered for another event. Please register for "${hackathon.title}" to get your event pass.`,
        },
        { status: 403 }
      );
    }

    const submission = await submitProject({
      hackathonId: hackathon.id,
      ticketNumber: cleanTicket,
      trackId: trackId || (hackathon.tracks?.[0]?.id ?? "general"),
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

    // Verify database row write
    let dbSaved = false;
    let dbError: string | null = null;
    try {
      const cleanTicket = ticketNumber.trim().toUpperCase();
      const dbRow = await prisma.hackathonSubmission.findFirst({
        where: {
          OR: [
            { id: submission.id },
            { participant: { ticketNumber: cleanTicket } },
          ],
        },
      });
      dbSaved = Boolean(dbRow);
    } catch (e: any) {
      dbError = e.message || String(e);
      console.error("[submit route] DB verify error:", e);
    }

    return NextResponse.json({ success: true, submission, dbSaved, dbError });
  } catch (error: any) {
    console.error("Hackathon submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save hackathon submission" },
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
