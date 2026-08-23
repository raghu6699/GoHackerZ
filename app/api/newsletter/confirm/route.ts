import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, welcomeEmail } from "@/lib/mailer";

/**
 * GET /api/newsletter/confirm?token=… — completes double opt-in.
 * Single-use token: confirmedAt is set and the token is cleared so the link
 * can never be replayed.
 */
export async function GET(req: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const token = new URL(req.url).searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${site}/?newsletter=invalid`);
  }

  const sub = await prisma.newsletterSub.findUnique({ where: { confirmToken: token } });
  if (!sub) {
    return NextResponse.redirect(`${site}/?newsletter=invalid`);
  }

  const already = !!sub.confirmedAt;
  await prisma.newsletterSub.update({
    where: { id: sub.id },
    data: { confirmedAt: already ? sub.confirmedAt : new Date(), confirmToken: null },
  });

  if (!already) {
    const result = await sendEmail(welcomeEmail(sub.email));
    console.info(
      JSON.stringify({ ts: new Date().toISOString(), level: "info", event: "newsletter.confirmed", email: sub.email, delivered: result.delivered })
    );
  }

  return NextResponse.redirect(`${site}/?newsletter=confirmed`);
}
