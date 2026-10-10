import { NextResponse } from "next/server";
import { saveHostProposal, getAllHostProposals, updateHostProposalStatus } from "@/lib/host-proposals";
import { sendEmail, hostProposalAdminNotificationEmail, hostProposalReceiptEmail } from "@/lib/mailer";
import { getAdminEmails, isUserAdmin } from "@/lib/admin-auth";
import { getCurrentDbUser } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orgName,
      contactName,
      contactEmail,
      contactHandle,
      hackathonTitle,
      targetDates,
      expectedParticipants,
      estimatedPrizePool,
      tracksAndGoals,
      specialRequirements,
    } = body;

    // Validation
    if (!orgName?.trim() || !contactName?.trim() || !contactEmail?.trim() || !hackathonTitle?.trim()) {
      return NextResponse.json(
        { error: "Organization name, contact name, valid email, and hackathon title are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid contact email address." },
        { status: 400 }
      );
    }

    // Save proposal to disk, memory, and DB
    const proposal = await saveHostProposal({
      orgName,
      contactName,
      contactEmail,
      contactHandle,
      hackathonTitle,
      targetDates,
      expectedParticipants,
      estimatedPrizePool,
      tracksAndGoals,
      specialRequirements,
    });

    // 1. Dispatch notification email to Admin(s)
    const adminEmails = getAdminEmails();
    const primaryAdmin = adminEmails[0] || "admin@gohackerz.com";

    try {
      const adminMailMsg = hostProposalAdminNotificationEmail({
        refNumber: proposal.refNumber,
        orgName: proposal.orgName,
        contactName: proposal.contactName,
        contactEmail: proposal.contactEmail,
        contactHandle: proposal.contactHandle,
        hackathonTitle: proposal.hackathonTitle,
        targetDates: proposal.targetDates,
        expectedParticipants: proposal.expectedParticipants,
        estimatedPrizePool: proposal.estimatedPrizePool,
        tracksAndGoals: proposal.tracksAndGoals,
        specialRequirements: proposal.specialRequirements,
        adminEmail: primaryAdmin,
      });

      const adminSendRes = await sendEmail(adminMailMsg);
      console.info(
        `[Host Proposal] Admin alert sent to ${primaryAdmin}, delivered: ${adminSendRes.delivered}`
      );
    } catch (adminMailErr) {
      console.warn("[Host Proposal] Admin notification email warning:", adminMailErr);
    }

    // 2. Dispatch receipt confirmation email to applicant
    try {
      const receiptMsg = hostProposalReceiptEmail({
        refNumber: proposal.refNumber,
        orgName: proposal.orgName,
        contactName: proposal.contactName,
        contactEmail: proposal.contactEmail,
        hackathonTitle: proposal.hackathonTitle,
      });
      const receiptSendRes = await sendEmail(receiptMsg);
      console.info(
        `[Host Proposal] Receipt sent to ${proposal.contactEmail}, delivered: ${receiptSendRes.delivered}`
      );
    } catch (receiptMailErr) {
      console.warn("[Host Proposal] Receipt email warning:", receiptMailErr);
    }

    return NextResponse.json({
      success: true,
      proposal,
      refNumber: proposal.refNumber,
      message: "Hackathon proposal received successfully! Our team will contact you shortly.",
    });
  } catch (error: any) {
    console.error("[Host Proposal] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process proposal submission." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentDbUser();
    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized admin access." }, { status: 403 });
    }

    const proposals = await getAllHostProposals();
    return NextResponse.json({ success: true, proposals, count: proposals.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch host proposals." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized admin access." }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Proposal ID and status are required." }, { status: 400 });
    }

    const updated = await updateHostProposalStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, proposal: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update proposal status." },
      { status: 500 }
    );
  }
}
