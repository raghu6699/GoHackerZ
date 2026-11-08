import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, userId } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // This route confirms an email without proof of ownership, so it must never
    // apply to an address that carries admin rights.
    if (isAdminEmail(email)) {
      return NextResponse.json(
        { error: "This account must confirm its email address." },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
    }

    let targetId = userId;
    if (!targetId) {
      // Find user by email from Supabase Auth admin
      const { data } = await admin.auth.admin.listUsers();
      const found = data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found) targetId = found.id;
    }

    if (!targetId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Auto-confirm email in Supabase Auth
    const { error: updateErr } = await admin.auth.admin.updateUserById(targetId, {
      email_confirm: true,
    });

    if (updateErr) {
      console.error("Auto-confirm updateUserById error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, confirmed: true });
  } catch (err) {
    console.error("POST /api/auth/auto-confirm error:", err);
    return NextResponse.json({ error: "Auto-confirm failed" }, { status: 500 });
  }
}
