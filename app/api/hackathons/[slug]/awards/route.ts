import { NextResponse } from "next/server";
import { issueSpecialAward, getParticipantByTicket } from "@/lib/participant-store";
import type { CertificateType } from "@/lib/hackathons";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const body = await request.json();
    const { ticketNumber, type, awardTitle, rank, trackName } = body;

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
