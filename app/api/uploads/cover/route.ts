import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB for covers
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** POST /api/uploads/cover — multipart `cover` file → Supabase Storage. */
export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("cover");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be smaller than 4MB." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 500 });
  }

  const authId = user.authId ?? user.id;
  const path = `covers/${authId}/${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const up = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: new Uint8Array(bytes),
  });

  if (!up.ok) {
    console.error("cover upload failed:", up.status, await up.text());
    return NextResponse.json({ error: "Upload failed — please try again." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    url: `${supabaseUrl}/storage/v1/object/public/avatars/${path}`,
  });
}