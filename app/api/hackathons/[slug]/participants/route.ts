import { NextResponse } from "next/server";
import { getParticipantsForHackathon } from "@/lib/participant-store";
import { publicParticipant } from "@/lib/ticket-auth";
import { getHackathonBySlug } from "@/lib/hackathons";
import { getCurrentDbUser } from "@/lib/profile";
import { canUserManageHackathon } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const participants = await getParticipantsForHackathon(slug);
    // Organizers/admins (the studio) get full records; everyone else gets them without emails.
    const [user, hackathon] = await Promise.all([getCurrentDbUser(), getHackathonBySlug(slug)]);
    const isManager = canUserManageHackathon(user, hackathon);
    return NextResponse.json({
      success: true,
      participants: isManager ? participants : participants.map(publicParticipant),
      total: participants.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
