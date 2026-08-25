import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EVENT_TYPES,
  bucketReferrer,
  recordArticleEvent,
  trackingContext,
} from "@/lib/analytics";

/**
 * POST /api/articles/[slug]/view — count a read.
 * Client dedups per browser-session (ViewPing); server just increments so the
 * hot path stays a single UPDATE. The raw ArticleEvent row (for time-series +
 * referrer analytics) is written after the response via `after()`.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await prisma.article.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
    select: { id: true, viewCount: true },
  });

  const ctx = trackingContext(req);
  let bodyReferrer: string | null = null;
  try {
    if ((req.headers.get("content-type") ?? "").includes("application/json")) {
      const body = (await req.json()) as { referrer?: unknown };
      if (typeof body.referrer === "string") bodyReferrer = body.referrer;
    }
  } catch {
    /* empty body is fine */
  }

  after(async () => {
    await recordArticleEvent({
      articleId: row.id,
      type: EVENT_TYPES.VIEW,
      referrer: ctx.referrer ?? bucketReferrer(bodyReferrer),
      sessionHash: ctx.sessionHash,
    });
  });

  return NextResponse.json({ ok: true, views: row.viewCount });
}

