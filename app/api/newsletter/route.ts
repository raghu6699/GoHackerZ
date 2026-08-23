import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, confirmEmail } from "@/lib/mailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/newsletter — double opt-in subscribe (idempotent).
 * Always answers ok (no enumeration of existing addresses); a confirmation
 * email with a single-use token is (re)sent to unconfirmed subscribers.
 */
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid email." },
      { status: 400 }
    );
  }

  const existing = await prisma.newsletterSub.findUnique({ where: { email } });

  if (!existing) {
    const confirmToken = randomUUID();
    await prisma.newsletterSub.create({ data: { email, confirmToken } });
    const result = await sendEmail(confirmEmail(email, confirmToken));
    console.info(
      JSON.stringify({ ts: new Date().toISOString(), level: "info", event: "newsletter.subscribed", email, delivered: result.delivered })
    );
    return NextResponse.json({ ok: true, message: "Check your inbox to confirm." });
  }

  if (existing.confirmedAt) {
    // Already a confirmed subscriber — nothing to do.
    return NextResponse.json({ ok: true, message: "You're already subscribed." });
  }

  // Unconfirmed: rotate the token and resend the confirmation link.
  const confirmToken = randomUUID();
  await prisma.newsletterSub.update({ where: { email }, data: { confirmToken } });
  const result = await sendEmail(confirmEmail(email, confirmToken));
  console.info(
    JSON.stringify({ ts: new Date().toISOString(), level: "info", event: "newsletter.resend_confirmation", email, delivered: result.delivered })
  );
  return NextResponse.json({ ok: true, message: "Check your inbox to confirm." });
}
