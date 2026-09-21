import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { revalidateArticlePaths } from "@/lib/revalidate";

/**
 * POST /api/articles/[slug]/submit — move a draft through the pipeline.
 * Trust-based auto-publish: EDITOR/ADMIN or trustLevel >= 2 publishes
 * instantly; everyone else lands in the review queue (status SUBMITTED).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    select: {
      id: true,
      authorId: true,
      status: true,
      scheduledAt: true,
      topic: { select: { slug: true } },
      author: { select: { username: true } },
    },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (article.authorId !== user.id) {
    return NextResponse.json({ error: "Not your article." }, { status: 403 });
  }
  if (article.status === "PUBLISHED") {
    return NextResponse.json({ error: "Already published." }, { status: 400 });
  }

  const autoPublish =
    user.role === "EDITOR" || user.role === "ADMIN" || user.trustLevel >= 2;

  const isScheduledInFuture = article.scheduledAt && article.scheduledAt > new Date();
  const targetPublishedAt = isScheduledInFuture
    ? article.scheduledAt
    : autoPublish
      ? new Date()
      : null;

  const updated = await prisma.article.update({
    where: { id: article.id },
    data: {
      status: autoPublish ? "PUBLISHED" : "SUBMITTED",
      publishedAt: targetPublishedAt,
      rejectionFeedback: null,
    },
  });

  revalidateArticlePaths(slug, article.topic?.slug, article.author?.username);

  return NextResponse.json({
    ok: true,
    status: updated.status,
    autoPublished: autoPublish,
  });
}