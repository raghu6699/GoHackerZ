import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateArticlePaths } from "@/lib/revalidate";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { parseBlocks } from "@/lib/content";
import type { Block } from "@/lib/data";

import { topics } from "@/lib/data";

/**
 * POST /api/articles — publish a new article for the signed-in user.
 * Body: { title, dek, topicSlug, body }
 */
export async function POST(req: Request) {
  try {
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

    let topic = await prisma.topic.findUnique({ where: { slug: topicSlug } });
    if (!topic) {
      const meta = topics.find((t) => t.slug === topicSlug);
      if (meta) {
        topic = await prisma.topic.create({
          data: {
            slug: meta.slug,
            name: meta.name,
            emoji: meta.emoji,
            color: meta.color,
            description: meta.description,
          },
        });
      } else {
        return NextResponse.json({ error: "Unknown topic." }, { status: 400 });
      }
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
    // Ensure author exists in DB (in case author was resolved via synthetic fallback)
    let dbAuthor = await prisma.user.findFirst({
      where: {
        OR: [
          { id: author.id },
          ...(author.authId ? [{ authId: author.authId }] : []),
          { email: author.email },
        ],
      },
    });

    if (!dbAuthor) {
      const fallback = author.email.split("@")[0];
      const username =
        fallback.toLowerCase().replace(/[^a-z0-9]+/g, "") + "_" + author.id.slice(0, 6);
      dbAuthor = await prisma.user.create({
        data: {
          authId: author.authId ?? author.id,
          email: author.email,
          name: author.name || fallback,
          username,
          role: "WRITER",
          trustLevel: 2,
        },
      });
    }

    const isDraft = payload.draft === true;
    const autoPublish =
      dbAuthor.role === "EDITOR" ||
      dbAuthor.role === "ADMIN" ||
      dbAuthor.trustLevel >= 3;

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
        publishedAt: isDraft
          ? null
          : scheduledAt && scheduledAt > new Date()
            ? scheduledAt
            : autoPublish
              ? new Date()
              : null,
        authorId: dbAuthor.id,
        topicId: topic.id,
      },
    });

    revalidateArticlePaths(article.slug, topic.slug, dbAuthor.username);

    return NextResponse.json({
      ok: true,
      slug: article.slug,
      status: article.status,
    });
  } catch (err: any) {
    console.error("POST /api/articles unhandled error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create article" },
      { status: 500 }
    );
  }
}
