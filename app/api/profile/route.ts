import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

const AVATAR_COLORS = ["purple", "pink", "sky", "peach", "lime", "ink"];

/** GET — the signed-in user's profile (for the editor). */
export async function GET() {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    username: user.username,
    name: user.name,
    bio: user.bio,
    company: user.company,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl,
    email: user.email,
    role: user.role,
  });
}

/** PATCH — update editable profile fields. */
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { name?: string; bio?: string; company?: string; avatarColor?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const data: Record<string, string> = {};
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name || name.length > 60) {
        return NextResponse.json(
          { error: "Name must be 1–60 characters." },
          { status: 400 }
        );
      }
      data.name = name;
    }
    if (body.bio !== undefined) {
      const bio = body.bio.trim();
      if (bio.length > 280) {
        return NextResponse.json(
          { error: "Bio must be at most 280 characters." },
          { status: 400 }
        );
      }
      data.bio = bio || null as unknown as string;
    }
    if (body.company !== undefined) {
      const company = body.company.trim();
      if (company.length > 60) {
        return NextResponse.json(
          { error: "Company must be at most 60 characters." },
          { status: 400 }
        );
      }
      data.company = company || null as unknown as string;
    }
    if (body.avatarColor !== undefined) {
      if (!AVATAR_COLORS.includes(body.avatarColor)) {
        return NextResponse.json({ error: "Unknown color." }, { status: 400 });
      }
      data.avatarColor = body.avatarColor;
    }

    let dbUser = await prisma.user.findFirst({
      where: { OR: [{ id: user.id }, { authId: user.authId ?? user.id }, { email: user.email }] },
    });

    if (!dbUser) {
      const fallback = user.email.split("@")[0];
      dbUser = await prisma.user.create({
        data: {
          authId: user.authId ?? user.id,
          email: user.email,
          name: user.name || fallback,
          username: user.username || fallback + "_" + user.id.slice(0, 6),
        },
      });
    }

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data,
    });

    return NextResponse.json({
      ok: true,
      profile: {
        name: updated.name,
        bio: updated.bio,
        company: updated.company,
        avatarColor: updated.avatarColor,
        avatarUrl: updated.avatarUrl,
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}