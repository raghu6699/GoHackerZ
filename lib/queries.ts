/**
 * GoHackerz — real database query layer.
 * Same function names/shapes as the old lib/data.ts mocks, but backed by
 * Supabase Postgres via Prisma. Pages just add `await`.
 */
import { prisma } from "./prisma";
import type { Article, Author, AvatarColor, Topic } from "./data";

type DbUser = {
  username: string | null;
  name: string | null;
  email: string;
  role: string;
  company: string | null;
  avatarColor: string | null;
  avatarUrl: string | null;
  bio: string | null;
  _count?: { articles: number; followers: number };
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapAuthor(u: DbUser): Author {
  const name = u.name ?? u.email.split("@")[0];
  return {
    username: u.username ?? u.email.split("@")[0],
    name,
    initials: initialsOf(name),
    role:
      u.role === "EDITOR"
        ? "Editor"
        : u.role === "ADMIN"
          ? "Admin"
          : "Writer",
    company: u.company ?? "",
    avatarColor: (u.avatarColor as AvatarColor) || "purple",
    avatarUrl: u.avatarUrl,
    bio: u.bio ?? "",
    followers: u._count?.followers ?? 0,
    articleCount: u._count?.articles ?? 0,
  };
}

function mapTopic(t: {
  slug: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
}): Topic {
  return {
    slug: t.slug,
    name: t.name,
    emoji: t.emoji,
    color: (t.color as AvatarColor) || "purple",
    description: t.description ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapArticle(a: any): Article {
  return {
    slug: a.slug,
    title: a.title,
    dek: a.dek ?? "",
    authorUsername: a.author?.username ?? "",
    topicSlug: a.topic?.slug ?? "",
    readingTime: a.readingTime,
    reactions: a.reactionCount,
    comments: a.commentCount,
    bookmarks: a.bookmarkCount,
    publishedAt: (a.publishedAt ?? a.createdAt).toISOString(),
    tags: a.tags,
    featured: a.featured,
    coverImage: a.coverImage,
    seoTitle: a.seoTitle,
    seoDescription: a.seoDescription,
    content: a.content as Article["content"],
  };
}

const INCLUDE = { author: true, topic: true } as const;

/** Published AND visible (scheduled posts only appear once their time arrives) */
const liveWhere = {
  status: "PUBLISHED" as const,
  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
};

export async function getFeatured(): Promise<Article | undefined> {
  const a = await prisma.article.findFirst({
    where: { ...liveWhere, featured: true },
    include: INCLUDE,
    orderBy: { publishedAt: "desc" },
  });
  return a ? mapArticle(a) : undefined;
}

export async function getLatest(limit?: number, skip = 0): Promise<Article[]> {
  const rows = await prisma.article.findMany({
    where: liveWhere,
    include: INCLUDE,
    orderBy: { publishedAt: "desc" },
    ...(typeof limit === "number" ? { take: limit } : {}),
    ...(skip ? { skip } : {}),
  });
  return rows.map(mapArticle);
}

export async function countLatest(): Promise<number> {
  return prisma.article.count({ where: liveWhere });
}

export async function getTrending(limit = 4): Promise<Article[]> {
  // Engagement-weighted: reactions dominate, comments second, views third —
  // so a heavily-read piece can trend before the reactions catch up.
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "Article"
    WHERE "status" = 'PUBLISHED'
      AND ("publishedAt" IS NULL OR "publishedAt" <= now())
    ORDER BY ("reactionCount" * 3 + "commentCount" * 2 + "viewCount") DESC,
             "publishedAt" DESC NULLS LAST
    LIMIT ${limit}
  `;
  if (!rows.length) return [];

  const byId = await prisma.article.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    include: INCLUDE,
  });
  const order = new Map(rows.map((r, i) => [r.id, i]));
  return byId
    .sort((a, b) => order.get(a.id)! - order.get(b.id)!)
    .map(mapArticle);
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  const a = await prisma.article.findUnique({
    where: { slug },
    include: INCLUDE,
  });
  return a ? mapArticle(a) : undefined;
}

export async function getArticlesByTopic(slug: string): Promise<Article[]> {
  const rows = await prisma.article.findMany({
    where: { ...liveWhere, topic: { slug } },
    include: INCLUDE,
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(mapArticle);
}

export async function getArticlesByAuthor(username: string): Promise<Article[]> {
  const rows = await prisma.article.findMany({
    where: {
      ...liveWhere,
      author: { OR: [{ username }, { email: { startsWith: username + "@" } }] },
    },
    include: INCLUDE,
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(mapArticle);
}

export async function getAllTopics(): Promise<Topic[]> {
  const rows = await prisma.topic.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapTopic);
}

export async function getTopic(slug: string): Promise<Topic | undefined> {
  const t = await prisma.topic.findUnique({ where: { slug } });
  return t ? mapTopic(t) : undefined;
}

export async function getAuthor(username: string): Promise<Author | undefined> {
  const u = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email: { startsWith: username + "@" } },
      ],
    },
    include: { _count: { select: { articles: true, followers: true } } },
  });
  return u ? mapAuthor(u) : undefined;
}

export async function getAllAuthors(): Promise<Author[]> {
  const rows = await prisma.user.findMany({
    where: { role: { in: ["WRITER", "EDITOR", "ADMIN"] } },
    include: { _count: { select: { articles: true, followers: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map(mapAuthor);
}

// ── Search ────────────────────────────────────────────────────
/**
 * Ranked full-text search over title + dek (backed by the Article_fts_idx GIN
 * index from migration 1_full_text_search), with substring/tag fallbacks so
 * partial words and exact tag names still match.
 */
export async function searchArticles(q: string, limit = 20): Promise<Article[]> {
  const query = q.trim();
  if (!query) return [];

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "Article"
    WHERE "status" = 'PUBLISHED'
      AND ("publishedAt" IS NULL OR "publishedAt" <= now())
      AND (
        to_tsvector('english'::regconfig, "title" || ' ' || coalesce("dek", ''))
          @@ websearch_to_tsquery('english'::regconfig, ${query})
        OR "title" ILIKE ${"%" + query + "%"}
        OR EXISTS (
          SELECT 1 FROM unnest("tags") AS tag
          WHERE tag ILIKE ${"%" + query.toLowerCase() + "%"}
        )
      )
    ORDER BY
      ts_rank(
        to_tsvector('english'::regconfig, "title" || ' ' || coalesce("dek", '')),
        websearch_to_tsquery('english'::regconfig, ${query})
      ) DESC,
      "publishedAt" DESC NULLS LAST
    LIMIT ${limit}
  `;

  if (!rows.length) return [];

  // Preserve relevance order from the raw query.
  const byId = await prisma.article.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    include: INCLUDE,
  });
  const order = new Map(rows.map((r, i) => [r.id, i]));
  return byId
    .sort((a, b) => order.get(a.id)! - order.get(b.id)!)
    .map(mapArticle);
}


export async function searchAuthors(q: string, limit = 10): Promise<Author[]> {
  const rows = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { _count: { select: { articles: true, followers: true } } },
    take: limit,
  });
  return rows.map(mapAuthor);
}

// ── Following feed ────────────────────────────────────────────
export async function getFollowedAuthors(userId: string): Promise<Author[]> {
  const rows = await prisma.user.findMany({
    where: { followers: { some: { followerId: userId } } },
    include: { _count: { select: { articles: true, followers: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map(mapAuthor);
}

export async function getFollowingFeed(userId: string): Promise<Article[]> {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  if (!follows.length) return [];
  const rows = await prisma.article.findMany({
    where: { ...liveWhere, authorId: { in: follows.map((f) => f.followingId) } },
    include: INCLUDE,
    orderBy: { publishedAt: "desc" },
    take: 50,
  });
  return rows.map(mapArticle);
}

// ── Batch loaders (avoid per-card N+1 queries) ────────────────

export interface CardData {
  authors: Map<string, Author>;
  topics: Map<string, Topic>;
}

/**
 * Prefetches authors + topics for a list of articles in ~2 round-trips,
 * instead of 2 queries per rendered card. Pages pass the resolved entries
 * down to <ArticleCard>. Falls back to individual lookups only for legacy
 * email-prefix usernames.
 */
export async function preloadCardData(
  articles: Pick<Article, "authorUsername" | "topicSlug">[]
): Promise<CardData> {
  const authors = new Map<string, Author>();
  const topics = new Map<string, Topic>();

  const usernames = [...new Set(articles.map((a) => a.authorUsername))];
  const slugs = [...new Set(articles.map((a) => a.topicSlug))];

  const users = usernames.length
    ? await prisma.user.findMany({
        where: { username: { in: usernames } },
        include: { _count: { select: { articles: true, followers: true } } },
      })
    : [];
  const topicRows = slugs.length
    ? await prisma.topic.findMany({ where: { slug: { in: slugs } } })
    : [];

  for (const t of topicRows) topics.set(t.slug, mapTopic(t));

  const seen = new Set<string>();
  for (const u of users) {
    if (u.username) {
      authors.set(u.username, mapAuthor(u));
      seen.add(u.username);
    }
  }

  // Legacy accounts matched by email prefix rather than username.
  await Promise.all(
    usernames
      .filter((n) => !seen.has(n))
      .map(async (n) => {
        const a = await getAuthor(n);
        if (a) authors.set(n, a);
      })
  );

  return { authors, topics };
}

// ── Drafts & review workflow ──────────────────────────────────
export interface WithStatus extends Article {
  status: string;
  rejectionFeedback?: string | null;
}

export async function getUserArticles(userId: string): Promise<WithStatus[]> {
  const rows = await prisma.article.findMany({
    where: { authorId: userId },
    include: INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(
    (a) =>
      ({
        ...mapArticle(a),
        status: a.status as string,
        rejectionFeedback: a.rejectionFeedback,
      }) as WithStatus
  );
}

export async function getReviewQueue(): Promise<WithStatus[]> {
  const rows = await prisma.article.findMany({
    where: { status: "SUBMITTED" },
    include: INCLUDE,
    orderBy: { updatedAt: "asc" },
  });
  return rows.map(
    (a) =>
      ({ ...mapArticle(a), status: a.status as string }) as WithStatus
  );
}

export async function getEditableArticle(
  slug: string,
  authorId: string
): Promise<WithStatus | undefined> {
  const a = await prisma.article.findFirst({
    where: { slug, authorId },
    include: INCLUDE,
  });
  if (!a) return undefined;
  return { ...mapArticle(a), status: a.status as string } as WithStatus;
}

export async function countTopicArticles(slug: string): Promise<number> {
  return prisma.article.count({ where: { ...liveWhere, topic: { slug } } });
}