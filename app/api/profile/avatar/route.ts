import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * POST /api/profile/avatar — multipart form with an `avatar` file.
 * Validates, uploads to Supabase Storage (`avatars` bucket, per-user path),
 * and stores the public URL on the User row.
 */
export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data." },
      { status: 400 }
    );
  }

  const file = form.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Only JPEG, PNG or WebP images are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be smaller than 2MB." },
      { status: 400 }
    );
  }

  // Authenticated user id keeps paths unique & stable per account
  const authId = user.authId ?? user.id;
  const path = `${authId}/${Date.now()}.${ext}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Storage is not configured." },
      { status: 500 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const up = await fetch(
    `${supabaseUrl}/storage/v1/object/avatars/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: new Uint8Array(bytes),
    }
  );

  if (!up.ok) {
    console.error("avatar upload failed:", up.status, await up.text());
    return NextResponse.json(
      { error: "Upload failed — please try again." },
      { status: 500 }
    );
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: publicUrl },
  });

  return NextResponse.json({ ok: true, avatarUrl: updated.avatarUrl });
}

/** DELETE — remove the avatar (falls back to initials). */
export async function DELETE() {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: null },
  });
  return NextResponse.json({ ok: true, avatarUrl: updated.avatarUrl });
}