import { NextResponse } from "next/server";
import { sendEmail, welcomeEmail } from "@/lib/mailer";

/**
 * GET /api/test-email?to=your_email@gmail.com
 * Diagnostic route to test Resend email delivery in real-time.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      { error: "Missing 'to' query parameter. Example: /api/test-email?to=your_email@gmail.com" },
      { status: 400 }
    );
  }

  const apiKeySet = Boolean(process.env.RESEND_API_KEY);
  const mailFrom = process.env.MAIL_FROM ?? "GoHackerz <onboarding@resend.dev>";

  const emailResult = await sendEmail(welcomeEmail(to));

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    apiKeyConfigured: apiKeySet,
    mailFromSetting: mailFrom,
    recipient: to,
    result: emailResult,
  });
}
