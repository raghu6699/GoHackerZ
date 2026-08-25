/**
 * GoHackerz — writer analytics engine (first-party).
 *
 * Design:
 *  - Hot path: API routes record raw `ArticleEvent` rows via `after()` so
 *    responses never wait on analytics.
 *  - Cold path: /api/cron/analytics-rollup aggregates completed UTC days into
 *    `ArticleDailyStat` rows, then deletes exactly those events (atomic), and
 *    prunes events older than EVENT_RETENTION_DAYS.
 *  - Privacy: referrers are bucketed to source names; visitor identity is a
 *    salted SHA-256 of ip+UA truncated to 32 hex chars. No cookies, no PII.
 */
import { createHash } from "node:crypto";
import { prisma } from "./prisma";

export const EVENT_TYPES = {
  VIEW: "view",
  REACTION: "reaction",
  BOOKMARK: "bookmark",
  COMMENT: "comment",
} as const;

export type ArticleEventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

/** Raw events older than this are pruned by the cron job (rollups keep history). */
export const EVENT_RETENTION_DAYS = 90;

// ── Referrer bucketing ─────────────────────────────────────────

const REFERRER_BUCKETS: [RegExp, string][] = [
  [/^(www\.|news\.|images\.)?google\.[a-z.]+$/, "google"],
  [/^(www\.)?bing\./, "bing"],
  [/^duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)x\.com$|(^|\.)twitter\.com$|^t\.co$/, "twitter-x"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
  [/(^|\.)reddit\.com$|^redd\.it$/, "reddit"],
  [/^news\.ycombinator\.com$|^hn\.algolia\.com$/, "hacker-news"],
  [/^(www\.)?hackernoon\.com$/, "hackernoon"],
  [/^(www\.)?medium\.com$/, "medium"],
  [/(^|\.)dev\.to$/, "dev-to"],
  [/^(www\.)?github\.com$/, "github"],
  [/^(www|m)\.youtube\.com$|^youtu\.be$/, "youtube"],
];

function selfHost(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Maps a raw referrer URL to a stable source bucket.
 * Returns "internal" for same-site navigation, null for direct/unknown-empty.
 */
export function bucketReferrer(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let host: string;
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    // Tolerate bare hosts like "google.com" passed by clients.
    host = trimmed.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
    if (!host.includes(".")) return null;
  }

  if (host === "localhost") return "internal";
  const self = selfHost();
  if (self && (host === self || host.endsWith(`.${self}`))) return "internal";

  for (const [pattern, bucket] of REFERRER_BUCKETS) {
    if (pattern.test(host)) return bucket;
  }
  return "other";
}

// ── Privacy-safe session hashing ───────────────────────────────

/**
 * Salted hash of ip+UA. Same visitor+browser within a day produces the same
 * hash (lets us reason about repeat views); the salt makes it useless for
 * cross-site tracking or reversal. Salt falls back to DATABASE_URL because it
 * is always present on the server and secret per deployment.
 */
export function sessionHashFor(ip?: string | null, userAgent?: string | null): string | null {
  const salt =
    process.env.ANALYTICS_SALT ?? process.env.CRON_SECRET ?? process.env.DATABASE_URL;
  if (!salt) return null;
  return createHash("sha256")
    .update(`${salt}:${ip ?? ""}:${userAgent ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

/** Extracts ip + UA from a Request and hashes them. */
export function trackingContext(req: Request): {
  referrer: string | null;
  sessionHash: string | null;
} {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip");
  const ua = req.headers.get("user-agent");
  return {
    // Browsers send Referer automatically on same-origin fetches; ViewPing
    // also passes document.referrer in the body as a fallback.
    referrer: bucketReferrer(req.headers.get("referer")),
    sessionHash: sessionHashFor(ip, ua),
  };
}

// ── Event recording ────────────────────────────────────────────

/**
 * Records one engagement event. Never throws — analytics must never break a
 * reader action. Call inside `after()` from route handlers.
 */
export async function recordArticleEvent(input: {
  articleId: string;
  type: ArticleEventType;
  referrer?: string | null;
  sessionHash?: string | null;
}): Promise<void> {
  try {
    await prisma.articleEvent.create({
      data: {
        articleId: input.articleId,
        type: input.type,
        referrer: input.referrer ?? null,
        sessionHash: input.sessionHash ?? null,
      },
    });
  } catch {
    // Swallow: a failed analytics insert is invisible to readers by design.
  }
}


// ── Dashboard queries ──────────────────────────────────────────

function utcDayStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface DayStats {
  date: string;
  views: number;
  reactions: number;
  bookmarks: number;
  comments: number;
}

/**
 * Invariant maintained by /api/cron/analytics-rollup:
 *   - every COMPLETED UTC day lives ONLY in ArticleDailyStat (its events were
 *     deleted atomically after aggregation),
 *   - "today" (and any day the cron has not reached yet) lives ONLY in raw
 *     ArticleEvents.
 * So merging rollups (< today) with today's live event counts is exact — no
 * double counting, no gaps — even right after schema deploy or a missed run.
 */

/**
 * Daily series for one article over the last `days` days (UTC), oldest first.
 */
export async function getArticleTimeseries(
  articleId: string,
  days = 30
): Promise<DayStats[]> {
  const todayStart = utcDayStart();
  const since = new Date(todayStart);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const [rolled, live] = await Promise.all([
    prisma.articleDailyStat.findMany({
      where: { articleId, date: { gte: since, lt: todayStart } },
    }),
    prisma.articleEvent.groupBy({
      by: ["type"],
      where: { articleId, createdAt: { gte: todayStart } },
      _count: { _all: true },
    }),
  ]);

  const series = new Map<string, DayStats>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    series.set(dateKey(d), {
      date: dateKey(d),
      views: 0,
      reactions: 0,
      bookmarks: 0,
      comments: 0,
    });
  }
  for (const row of rolled) {
    const slot = series.get(dateKey(row.date));
    if (slot) {
      slot.views = row.views;
      slot.reactions = row.reactions;
      slot.bookmarks = row.bookmarks;
      slot.comments = row.comments;
    }
  }
  const todaySlot = series.get(dateKey(todayStart))!;
  for (const g of live) {
    addType(todaySlot, g.type, g._count._all);
  }

  return [...series.values()];
}

export interface StoryAnalytics {
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  lifetime: DayStats;
  last30Days: Omit<DayStats, "date">;
}

const zero30 = (): Omit<DayStats, "date"> => ({
  views: 0,
  reactions: 0,
  bookmarks: 0,
  comments: 0,
});

function addType(slot: Omit<DayStats, "date">, type: string, n: number): void {
  if (type === EVENT_TYPES.VIEW) slot.views += n;
  else if (type === EVENT_TYPES.REACTION) slot.reactions += n;
  else if (type === EVENT_TYPES.BOOKMARK) slot.bookmarks += n;
  else if (type === EVENT_TYPES.COMMENT) slot.comments += n;
}

/** Per-story rows for a writer: lifetime counters + trailing-30-day activity. */
export async function getWriterPerStory(userId: string): Promise<StoryAnalytics[]> {
  const articles = await prisma.article.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      viewCount: true,
      reactionCount: true,
      bookmarkCount: true,
      commentCount: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!articles.length) return [];

  const since = utcDayStart();
  since.setUTCDate(since.getUTCDate() - 29);
  const ids = articles.map((a) => a.id);

  const [rolled, live] = await Promise.all([
    prisma.articleDailyStat.findMany({
      where: { articleId: { in: ids }, date: { gte: since } },
    }),
    prisma.articleEvent.groupBy({
      by: ["articleId", "type"],
      where: { articleId: { in: ids }, createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const acc = new Map<string, Omit<DayStats, "date">>();
  for (const row of rolled) {
    const slot = acc.get(row.articleId) ?? zero30();
    slot.views += row.views;
    slot.reactions += row.reactions;
    slot.bookmarks += row.bookmarks;
    slot.comments += row.comments;
    acc.set(row.articleId, slot);
  }
  for (const g of live) {
    const slot = acc.get(g.articleId) ?? zero30();
    addType(slot, g.type, g._count._all);
    acc.set(g.articleId, slot);
  }

  return articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    status: a.status,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    lifetime: {
      date: "",
      views: a.viewCount,
      reactions: a.reactionCount,
      bookmarks: a.bookmarkCount,
      comments: a.commentCount,
    },
    last30Days: acc.get(a.id) ?? zero30(),
  }));
}

/** Where a writer's readers came from across retained raw events. */
export async function getTopReferrers(
  userId: string,
  limit = 8
): Promise<{ source: string; count: number }[]> {
  const rows = await prisma.articleEvent.groupBy({
    by: ["referrer"],
    where: {
      type: EVENT_TYPES.VIEW,
      referrer: { not: null },
      article: { authorId: userId },
    },
    _count: { _all: true },
    orderBy: { _count: { referrer: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ source: r.referrer ?? "direct", count: r._count._all }));
}
