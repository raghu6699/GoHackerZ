import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/analytics-rollup — daily analytics maintenance (idempotent).
 *
 * Runs once per day just after UTC midnight (see `crons` in vercel.json).
 * Auth: Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET`
 * when CRON_SECRET is configured for the project.
 *
 * What it does, atomically:
 *  1. Aggregates every ArticleEvent from COMPLETED UTC days into
 *     ArticleDailyStat (additive upsert — each event is counted exactly once).
 *  2. Deletes those raw events. Because both statements share one transaction,
 *     a crash either rolls up + deletes, or does neither — dashboards never
 *     double-count and never lose days. Events older than today also serves
 *     as the retention prune; 90-day-old data lives on in the rollups.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const rolledUp = await prisma.$transaction(async (tx) => {
    const inserted = await tx.$executeRaw`
      INSERT INTO "ArticleDailyStat"
        ("id", "articleId", "date", "views", "reactions", "bookmarks", "comments")
      SELECT
        gen_random_uuid()::text,
        "articleId",
        ("createdAt" AT TIME ZONE 'utc')::date AS "day",
        COUNT(*) FILTER (WHERE "type" = 'view'),
        COUNT(*) FILTER (WHERE "type" = 'reaction'),
        COUNT(*) FILTER (WHERE "type" = 'bookmark'),
        COUNT(*) FILTER (WHERE "type" = 'comment')
      FROM "ArticleEvent"
      WHERE "createdAt" < ${todayStart}
      GROUP BY "articleId", ("createdAt" AT TIME ZONE 'utc')::date
      ON CONFLICT ("articleId", "date") DO UPDATE SET
        "views"     = "ArticleDailyStat"."views"     + EXCLUDED."views",
        "reactions" = "ArticleDailyStat"."reactions" + EXCLUDED."reactions",
        "bookmarks" = "ArticleDailyStat"."bookmarks" + EXCLUDED."bookmarks",
        "comments"  = "ArticleDailyStat"."comments"  + EXCLUDED."comments"
    `;
    const deleted = await tx.articleEvent.deleteMany({
      where: { createdAt: { lt: todayStart } },
    });
    return { statRowsTouched: inserted, eventsRolledUp: deleted.count };
  });

  const remaining = await prisma.articleEvent.count();

  return NextResponse.json({
    ok: true,
    cutoff: todayStart.toISOString(),
    ...rolledUp,
    remainingEvents: remaining,
  });
}
