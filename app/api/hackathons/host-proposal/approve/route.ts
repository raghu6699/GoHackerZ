import { NextResponse } from "next/server";
import { createHackathonFromProposal } from "@/lib/host-proposals";
import { getCurrentDbUser } from "@/lib/profile";
import { isUserAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized admin access." }, { status: 403 });
    }

    const body = await req.json();
    const { proposalId } = body;

    if (!proposalId) {
      return NextResponse.json({ error: "Proposal ID is required." }, { status: 400 });
    }

    const result = await createHackathonFromProposal(proposalId);

    return NextResponse.json({
      success: true,
      hackathon: result.hackathon,
      proposal: result.proposal,
      message: `Hackathon "${result.hackathon.title}" created & launched! Approval notification dispatched to organizer.`,
    });
  } catch (error: any) {
    console.error("[Approve Proposal] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve proposal and provision hackathon." },
      { status: 500 }
    );
  }
}
