import { NextResponse } from "next/server";
import { getParticipantsForHackathon } from "@/lib/participant-store";
import { publicParticipant } from "@/lib/ticket-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const participants = await getParticipantsForHackathon(slug);
    return NextResponse.json({
      success: true,
      participants: participants.map(publicParticipant),
      total: participants.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
