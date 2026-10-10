import { NextResponse } from "next/server";
import { issueSpecialAward, getParticipantByTicket } from "@/lib/participant-store";
import { getHackathonBySlug } from "@/lib/hackathons";
import { getCurrentDbUser } from "@/lib/profile";
import { canUserManageHackathon } from "@/lib/admin-auth";
import type { CertificateType } from "@/lib/hackathons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const hackathon = await getHackathonBySlug(slug);
    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: "Hackathon not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { ticketNumber, type, awardTitle, rank, trackName, adminSecret, hostKey } = body;

    const user = await getCurrentDbUser();
    const isAuthorized = canUserManageHackathon(user, hackathon, adminSecret || hostKey);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized organizer access." },
        { status: 403 }
      );
    }

    if (!ticketNumber || !type || !awardTitle) {
      return NextResponse.json(
        { success: false, error: "Missing required award fields (ticketNumber, type, awardTitle)" },
        { status: 400 }
      );
    }

    const cert = await issueSpecialAward({
      hackathonIdOrSlug: slug,
      ticketNumber,
      type: type as CertificateType,
      awardTitle,
      rank: rank ? Number(rank) : undefined,
      trackName,
    });

    return NextResponse.json({
      success: true,
      certificate: cert,
      message: `Special award "${awardTitle}" issued successfully to ticket ${ticketNumber}!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to issue award" },
      { status: 500 }
    );
  }
}
