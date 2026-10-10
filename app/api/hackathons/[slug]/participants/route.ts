import { NextResponse } from "next/server";
import { getParticipantsForHackathon } from "@/lib/participant-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const participants = await getParticipantsForHackathon(slug);
    return NextResponse.json({
      success: true,
      participants,
      total: participants.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
