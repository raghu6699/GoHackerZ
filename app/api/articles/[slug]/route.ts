import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/articles/[slug] — update your own article
 * (draft edits, metadata changes). Only the author can do this.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.article.findUnique({
    where: { slug: (await params).slug },
    select: { id: true, authorId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.authorId !== user.id) {
    return NextResponse.json({ error: "Not your article." }, { status: 403 });
  }

  let body: {
    title?: string; dek?: string; content?: unknown;
    coverImage?: string | null; seoTitle?: string | null; seoDescription?: string | null;
    scheduledAt?: string | null; readingTime?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const t = body.title.trim();
    if (!t || t.length > 200) {
      return NextResponse.json({ error: "Title must be 1–200 characters." }, { status: 400 });
    }
    data.title = t;
  }
  if (body.dek !== undefined) data.dek = body.dek?.trim() || null;
  if (body.content !== undefined) data.content = body.content;
  if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
  if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle?.trim() || null;
  if (body.seoDescription !== undefined) data.seoDescription = body.seoDescription?.trim() || null;
  if (body.scheduledAt !== undefined) {
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (body.scheduledAt && isNaN(new Date(body.scheduledAt).getTime())) {
      return NextResponse.json({ error: "Invalid schedule date." }, { status: 400 });
    }
  }
  if (typeof body.readingTime === "number") data.readingTime = body.readingTime;

  await prisma.article.update({ where: { id: existing.id }, data });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/articles/[slug] — delete your own article. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.article.findUnique({
    where: { slug: (await params).slug },
    select: { authorId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.authorId !== user.id) {
    return NextResponse.json({ error: "Not your article." }, { status: 403 });
  }
  await prisma.article.delete({ where: { slug: (await params).slug } });
  return NextResponse.json({ ok: true });
}