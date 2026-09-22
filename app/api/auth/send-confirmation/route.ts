import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendEmail, accountConfirmationEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gohackerz.com";
    const redirectTo = `${site}/auth/callback`;

    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

      if (!error && data?.properties?.hashed_token) {
        const confirmUrl = `${site}/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=/`;
        const mailRes = await sendEmail(accountConfirmationEmail(email, confirmUrl));
        return NextResponse.json({ ok: true, delivered: mailRes.delivered, provider: mailRes.provider });
      } else if (!error && data?.properties?.action_link) {
        const mailRes = await sendEmail(accountConfirmationEmail(email, data.properties.action_link));
        return NextResponse.json({ ok: true, delivered: mailRes.delivered, provider: mailRes.provider });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/send-confirmation error:", err);
    return NextResponse.json({ error: "Failed to send confirmation link" }, { status: 500 });
  }
}
