import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendEmail, passwordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const redirectTo = `${site}/auth/callback?next=/reset-password`;

    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });

      if (error) {
        if (error.message.toLowerCase().includes("not found")) {
          return NextResponse.json(
            { error: "No account found with this email address. Please check for typos or create a new account." },
            { status: 404 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (data?.properties?.hashed_token) {
        const resetUrl = `${site}/auth/callback?token_hash=${data.properties.hashed_token}&type=recovery&next=/reset-password`;
        await sendEmail(passwordResetEmail(email, resetUrl));
        return NextResponse.json({ ok: true });
      } else if (data?.properties?.action_link) {
        await sendEmail(passwordResetEmail(email, data.properties.action_link));
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/forgot-password error:", err);
    return NextResponse.json({ error: "Failed to send reset link" }, { status: 500 });
  }
}
