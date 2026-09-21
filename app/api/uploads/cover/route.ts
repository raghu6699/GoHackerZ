import { NextResponse } from "next/server";
import sharp from "sharp";
import { getCurrentDbUser } from "@/lib/profile";

const MAX_BYTES = 10 * 1024 * 1024; // Allow up to 10MB raw upload since we pre-compress with sharp
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** POST /api/uploads/cover — multipart `cover` file → Supabase Storage. */
export async function POST(req: Request) {
  try {
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
      return NextResponse.json({ error: "Image must be smaller than 10MB." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Storage is not configured." }, { status: 500 });
    }

    const authId = user.authId ?? user.id;
    const path = `covers/${authId}/${Date.now()}.jpg`;
    const inputBytes = Buffer.from(await file.arrayBuffer());

    let bytes: Buffer;
    try {
      bytes = await sharp(inputBytes)
        .resize(1600, null, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
        .toBuffer();
    } catch {
      bytes = inputBytes;
    }

    let up = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: new Uint8Array(bytes),
    });

    if (!up.ok && up.status === 404) {
      // Auto-provision public 'avatars' bucket if it doesn't exist
      await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "avatars",
          name: "avatars",
          public: true,
          file_size_limit: 5242880,
          allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
        }),
      });

      up = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: new Uint8Array(bytes),
      });
    }

    if (!up.ok) {
      const errText = await up.text();
      console.error("cover upload failed:", up.status, errText);
      return NextResponse.json({ error: `Upload failed: ${errText || up.statusText}` }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      url: `${supabaseUrl}/storage/v1/object/public/avatars/${path}`,
    });
  } catch (err: any) {
    console.error("POST /api/uploads/cover error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}