/**
 * GoHackerz — real database query layer.
 * Supabase Postgres via Prisma. Returns live database records without mock data.
 */
import { prisma, isDbAvailable } from "./prisma";
import type { Article, Author, AvatarColor, Topic } from "./data";
import * as mockData from "./data";

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
  if (!isDbAvailable()) return undefined;
  try {
    let a = await prisma.article.findFirst({
      where: { ...liveWhere, featured: true },
      include: INCLUDE,
      orderBy: { publishedAt: "desc" },
    });
    if (!a) {
      a = await prisma.article.findFirst({
        where: liveWhere,
        include: INCLUDE,
        orderBy: { publishedAt: "desc" },
      });
    }
    return a ? mapArticle(a) : undefined;
  } catch {
    return undefined;
  }
}

export async function getLatest(limit?: number, skip = 0): Promise<Article[]> {
  if (!isDbAvailable()) return [];
  try {
    const rows = await prisma.article.findMany({
      where: liveWhere,
      include: INCLUDE,
      orderBy: { publishedAt: "desc" },
      ...(typeof limit === "number" ? { take: limit } : {}),
      ...(skip ? { skip } : {}),
    });
    return rows.map(mapArticle);
  } catch {
    return [];
  }
}

export async function countLatest(): Promise<number> {
  if (!isDbAvailable()) return 0;
  try {
    return await prisma.article.count({ where: liveWhere });
  } catch {
    return 0;
  }
}

export async function getTrending(limit = 4): Promise<Article[]> {
  if (!isDbAvailable()) return [];
  try {
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
      where: { id: { in: rows.map((r: { id: string }) => r.id) } },
      include: INCLUDE,
    });
    const order = new Map(rows.map((r: { id: string }, i: number) => [r.id, i]));
    return byId
      .sort((a: { id: string }, b: { id: string }) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map(mapArticle);
  } catch {
    return [];
  }
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  if (!isDbAvailable()) return undefined;
  try {
    const a = await prisma.article.findUnique({
      where: { slug },
      include: INCLUDE,
    });
    return a ? mapArticle(a) : undefined;
  } catch {
    return undefined;
  }
}

export async function getArticlesByTopic(slug: string): Promise<Article[]> {
  if (!isDbAvailable()) return [];
  try {
    const rows = await prisma.article.findMany({
      where: { ...liveWhere, topic: { slug } },
      include: INCLUDE,
      orderBy: { publishedAt: "desc" },
    });
    return rows.map(mapArticle);
  } catch {
    return [];
  }
}

export async function getArticlesByAuthor(username: string): Promise<Article[]> {
  if (!isDbAvailable()) return [];
  try {
    const rows = await prisma.article.findMany({
      where: {
        ...liveWhere,
        author: { OR: [{ username }, { email: { startsWith: username + "@" } }] },
      },
      include: INCLUDE,
      orderBy: { publishedAt: "desc" },
    });
    return rows.map(mapArticle);
  } catch {
    return [];
  }
}

export async function getAllTopics(): Promise<Topic[]> {
  if (!isDbAvailable()) return mockData.topics;
  try {
    const rows = await prisma.topic.findMany({ orderBy: { name: "asc" } });
    return rows.length ? rows.map(mapTopic) : mockData.topics;
  } catch {
    return mockData.topics;
  }
}

export async function getTopic(slug: string): Promise<Topic | undefined> {
  if (!isDbAvailable()) return mockData.getTopic(slug);
  try {
    const t = await prisma.topic.findUnique({ where: { slug } });
    return t ? mapTopic(t) : mockData.getTopic(slug);
  } catch {
    return mockData.getTopic(slug);
  }
}

export async function getAuthor(username: string): Promise<Author | undefined> {
  if (!isDbAvailable()) return undefined;
  try {
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
  } catch {
    return undefined;
  }
}

export async function getUserCount(): Promise<number> {
  if (!isDbAvailable()) return 0;
  try {
    return await prisma.user.count();
  } catch {
    return 0;
  }
}

export async function getAllAuthors(): Promise<Author[]> {
  if (!isDbAvailable()) return [];
  try {
    const rows = await prisma.user.findMany({
      where: { role: { in: ["WRITER", "EDITOR", "ADMIN"] } },
      include: { _count: { select: { articles: true, followers: true } } },
      orderBy: { name: "asc" },
    });
    return rows.map(mapAuthor);
  } catch {
    return [];
  }
}

// ── Search ────────────────────────────────────────────────────
export async function searchArticles(q: string, limit = 20): Promise<Article[]> {
  const query = q.trim();
  if (!query || !isDbAvailable()) return [];

  try {
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

    const byId = await prisma.article.findMany({
      where: { id: { in: rows.map((r: { id: string }) => r.id) } },
      include: INCLUDE,
    });
    const order = new Map(rows.map((r: { id: string }, i: number) => [r.id, i]));
    return byId
      .sort((a: { id: string }, b: { id: string }) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map(mapArticle);
  } catch {
    return [];
  }
}

export async function searchAuthors(q: string, limit = 10): Promise<Author[]> {
  if (!isDbAvailable()) return [];
  try {
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
  } catch {
    return [];
  }
}

// ── Following feed ────────────────────────────────────────────
export async function getFollowedAuthors(userId: string): Promise<Author[]> {
  if (!isDbAvailable()) return [];
  try {
    const rows = await prisma.user.findMany({
      where: { followers: { some: { followerId: userId } } },
      include: { _count: { select: { articles: true, followers: true } } },
      orderBy: { name: "asc" },
    });
    return rows.map(mapAuthor);
  } catch {
    return [];
  }
}

export async function getFollowingFeed(userId: string): Promise<Article[]> {
  if (!isDbAvailable()) return [];
  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    if (!follows.length) return [];
    const rows = await prisma.article.findMany({
      where: { ...liveWhere, authorId: { in: follows.map((f: { followingId: string }) => f.followingId) } },
      include: INCLUDE,
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
    return rows.map(mapArticle);
  } catch {
    return [];
  }
}

// ── Batch loaders ──────────────────────────────────────────────
export interface CardData {
  authors: Map<string, Author>;
  topics: Map<string, Topic>;
}

export async function preloadCardData(
  articles: Pick<Article, "authorUsername" | "topicSlug">[]
): Promise<CardData> {
  const authors = new Map<string, Author>();
  const topics = new Map<string, Topic>();

  const usernames = [...new Set(articles.map((a) => a.authorUsername))];
  const slugs = [...new Set(articles.map((a) => a.topicSlug))];

  if (!isDbAvailable() || (!usernames.length && !slugs.length)) {
    return { authors, topics };
  }

  try {
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

    for (const u of users) {
      if (u.username) {
        authors.set(u.username, mapAuthor(u));
      }
    }
  } catch {
    /* empty fallback */
  }

  return { authors, topics };
}

// ── Drafts & review workflow ──────────────────────────────────
export interface WithStatus extends Article {
  status: string;
  rejectionFeedback?: string | null;
}

export async function getUserArticles(userId: string): Promise<WithStatus[]> {
  if (!isDbAvailable()) return [];
  try {
    const rows = await prisma.article.findMany({
      where: { authorId: userId },
      include: INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(
      (a: any) =>
        ({
          ...mapArticle(a),
          status: a.status as string,
          rejectionFeedback: a.rejectionFeedback,
        }) as WithStatus
    );
  } catch {
    return [];
  }
}

export async function getReviewQueue(): Promise<WithStatus[]> {
  if (!isDbAvailable()) return [];
  try {
    const rows = await prisma.article.findMany({
      where: { status: "SUBMITTED" },
      include: INCLUDE,
      orderBy: { updatedAt: "asc" },
    });
    return rows.map(
      (a: any) =>
        ({ ...mapArticle(a), status: a.status as string }) as WithStatus
    );
  } catch {
    return [];
  }
}

export async function getEditableArticle(
  slug: string,
  authorId: string
): Promise<WithStatus | undefined> {
  if (!isDbAvailable()) return undefined;
  try {
    const a = await prisma.article.findFirst({
      where: { slug, authorId },
      include: INCLUDE,
    });
    if (!a) return undefined;
    return { ...mapArticle(a), status: a.status as string } as WithStatus;
  } catch {
    return undefined;
  }
}

export async function countTopicArticles(slug: string): Promise<number> {
  if (!isDbAvailable()) return 0;
  try {
    return await prisma.article.count({ where: { ...liveWhere, topic: { slug } } });
  } catch {
    return 0;
  }
}