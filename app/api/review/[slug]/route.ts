import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { sendEmail, articleApprovedEmail, articleRejectedEmail } from "@/lib/mailer";
import { revalidateArticlePaths } from "@/lib/revalidate";

/**
 * POST /api/review/[slug] — editor decision on a submitted article.
 * Body: { action: "approve" } | { action: "reject", feedback: string }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const editor = await getCurrentDbUser();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (editor.role !== "EDITOR" && editor.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only editors can review articles." },
      { status: 403 }
    );
  }

  let body: { action?: string; feedback?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true, title: true, status: true, scheduledAt: true, author: { select: { email: true } } },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (article.status !== "SUBMITTED") {
    return NextResponse.json(
      { error: "Article is not awaiting review." },
      { status: 400 }
    );
  }

  if (body.action === "approve") {
    const targetPublishedAt = article.scheduledAt ?? new Date();
    await prisma.article.update({
      where: { id: article.id },
      data: { status: "PUBLISHED", publishedAt: targetPublishedAt, rejectionFeedback: null },
    });

    if (article.author?.email) {
      sendEmail(articleApprovedEmail(article.author.email, article.title, slug)).catch(() => {});
    }

    revalidateArticlePaths(slug);

    return NextResponse.json({ ok: true, status: "PUBLISHED" });
  }

  if (body.action === "reject") {
    const feedback = (body.feedback ?? "").trim();
    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback is required when rejecting." },
        { status: 400 }
      );
    }
    await prisma.$transaction([
      prisma.article.update({
        where: { id: article.id },
        data: { status: "REJECTED", rejectionFeedback: feedback },
      }),
      prisma.reviewComment.create({
        data: {
          body: feedback,
          editorId: editor.id,
          articleId: article.id,
        },
      }),
    ]);

    if (article.author?.email) {
      sendEmail(articleRejectedEmail(article.author.email, article.title, feedback)).catch(() => {});
    }

    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}