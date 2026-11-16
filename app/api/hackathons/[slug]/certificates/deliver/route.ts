import { NextResponse } from "next/server";
import { getHackathonBySlug } from "@/lib/hackathons";
import { getCurrentDbUser } from "@/lib/profile";
import { canUserManageHackathon } from "@/lib/admin-auth";
import { getCertificatesForHackathon, getParticipantsForHackathon } from "@/lib/participant-store";
import { sendEmail, certificateEmail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST /api/hackathons/[slug]/certificates/deliver  (organizer only)
 * Body: { offset?: number, limit?: number }  -> sends one batch, returns the next offset.
 *       { certNumber: string }               -> (re)sends a single certificate.
 * Batched so a big event never hits a function timeout; the studio loops until done.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const hackathon = await getHackathonBySlug(slug);
    if (!hackathon) return NextResponse.json({ success: false, error: "Hackathon not found" }, { status: 404 });

    const user = await getCurrentDbUser();
    if (!canUserManageHackathon(user, hackathon)) {
      return NextResponse.json({ success: false, error: "Unauthorized organizer access." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const [certs, participants] = await Promise.all([
      getCertificatesForHackathon(slug),
      getParticipantsForHackathon(slug),
    ]);
    const emailByTicket = new Map(participants.map((p) => [p.ticketNumber, p.email]));

    const sorted = [...certs].sort((a, b) => a.certNumber.localeCompare(b.certNumber));
    const single = typeof body.certNumber === "string" ? body.certNumber.trim() : "";
    const offset = single ? 0 : Math.max(0, Number(body.offset) || 0);
    const limit = single ? 1 : Math.min(6, Math.max(1, Number(body.limit) || 4));
    const batch = single ? sorted.filter((c) => c.certNumber === single) : sorted.slice(offset, offset + limit);

    let sent = 0;
    const failed: { certNumber: string; reason: string }[] = [];

    for (let i = 0; i < batch.length; i++) {
      const c = batch[i];
      const to = emailByTicket.get(c.ticketNumber);
      if (!to) {
        failed.push({ certNumber: c.certNumber, reason: "No email on file for this ticket" });
        continue;
      }
      try {
        const res = await Promise.race([
          sendEmail(
            certificateEmail({
              to,
              name: c.recipientName,
              hackathonTitle: hackathon.title,
              awardTitle: c.awardTitle,
              certNumber: c.certNumber,
              certUrl: `${SITE_URL}/hackathons/${hackathon.slug}/certificate/${encodeURIComponent(c.ticketNumber)}`,
            })
          ),
          new Promise<{ delivered: false; provider: string; error: string }>((resolve) =>
            setTimeout(() => resolve({ delivered: false, provider: "timeout", error: "Email provider timed out" }), 12000)
          ),
        ]);
        if (res.delivered) sent++;
        else failed.push({ certNumber: c.certNumber, reason: res.error || `Not delivered (${res.provider})` });
        console.info(`[certificates/deliver] ${slug} ${c.certNumber} -> ${res.delivered ? "sent" : "FAILED: " + (res.error || res.provider)}`);
      } catch (err: any) {
        failed.push({ certNumber: c.certNumber, reason: err?.message || "Send error" });
        console.error(`[certificates/deliver] ${slug} ${c.certNumber} threw`, err);
      }
      // Stay under the email provider's per-second rate limit.
      if (i < batch.length - 1) await sleep(600);
    }

    const nextOffset = offset + batch.length;
    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: sorted.length,
      nextOffset,
      done: single ? true : nextOffset >= sorted.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to send certificate emails" }, { status: 500 });
  }
}
