import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { parseBlocks } from "@/lib/content";
import type { Block } from "@/lib/data";

/**
 * POST /api/articles — publish a new article for the signed-in user.
 * Body: { title, dek, topicSlug, body }
 */
export async function POST(req: Request) {
  const author = await getCurrentDbUser();
  if (!author) {
    return NextResponse.json(
      { error: "You need to sign in to publish." },
      { status: 401 }
    );
  }

  let payload: {
    title?: string; dek?: string; topicSlug?: string; body?: string;
    draft?: boolean; coverImage?: string | null;
    seoTitle?: string | null; seoDescription?: string | null;
    scheduledAt?: string | null;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = (payload.title ?? "").trim();
  const dek = (payload.dek ?? "").trim() || null;
  const topicSlug = (payload.topicSlug ?? "").trim();
  const bodyText = (payload.body ?? "").trim();

  if (!title || !topicSlug || !bodyText) {
    return NextResponse.json(
      { error: "Title, topic and body are required." },
      { status: 400 }
    );
  }

  let scheduledAt: Date | null = null;
  if (payload.scheduledAt) {
    scheduledAt = new Date(payload.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Invalid schedule date." }, { status: 400 });
    }
  }

  const topic = await prisma.topic.findUnique({ where: { slug: topicSlug } });
  if (!topic) {
    return NextResponse.json({ error: "Unknown topic." }, { status: 400 });
  }

  // Unique slug
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "untitled";
  let slug = base;
  for (let n = 1; ; n++) {
    const clash = await prisma.article.findUnique({ where: { slug } });
    if (!clash) break;
    slug = `${base}-${n + 1}`;
  }

  const words = bodyText.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(words / 200));

  // Draft? No public visibility. Scheduled? Published with a future date —
  // feeds only surface it once that time arrives.
  // Trust gate: editors/admins and trusted writers publish instantly;
  // everyone else lands in the review queue.
  const isDraft = payload.draft === true;
  const autoPublish =
    author.role === "EDITOR" || author.role === "ADMIN" || author.trustLevel >= 2;

  const article = await prisma.article.create({
    data: {
      slug,
      title,
      dek,
      content: parseBlocks(bodyText),
      status: isDraft ? "DRAFT" : autoPublish ? "PUBLISHED" : "SUBMITTED",
      readingTime,
      tags: [],
      coverImage: payload.coverImage?.trim() || null,
      seoTitle: payload.seoTitle?.trim() || null,
      seoDescription: payload.seoDescription?.trim() || null,
      scheduledAt,
      publishedAt:
        isDraft || (!autoPublish && !scheduledAt)
          ? null
          : scheduledAt ?? new Date(),
      authorId: author.id,
      topicId: topic.id,
    },
  });

  return NextResponse.json({
    ok: true,
    slug: article.slug,
    status: article.status,
  });
}
