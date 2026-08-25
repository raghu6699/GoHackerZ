import { NextResponse, after } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPES, recordArticleEvent, trackingContext } from "@/lib/analytics";

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** GET — all comments on this article (+ viewer's like state). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug: (await params).slug },
    select: { id: true },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const viewer = await getCurrentDbUser();
  const rows = await prisma.comment.findMany({
    where: { articleId: article.id },
    include: {
      user: { select: { name: true, username: true, avatarUrl: true, role: true } },
      _count: { select: { likedBy: true } },
      ...(viewer
        ? { likedBy: { where: { userId: viewer.id }, select: { id: true } } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  // Real like counts come from CommentLike rows; fall back to seeded `likes`
  const counts = await prisma.commentLike.groupBy({
    by: ["commentId"],
    where: { commentId: { in: rows.map((r) => r.id) } },
    _count: { id: true },
  });
  const countMap = new Map(counts.map((c) => [c.commentId, c._count.id]));

  return NextResponse.json({
    comments: rows.map((c) => ({
      id: c.id,
      authorName: c.user.name ?? c.user.username ?? "anon",
      username: c.user.username,
      avatarUrl: c.user.avatarUrl,
      role: c.user.role === "EDITOR" ? "Editor" : c.user.role === "ADMIN" ? "Admin" : "Builder",
      content: c.body,
      createdAt: timeAgo(c.createdAt),
      likes: countMap.get(c.id) ?? c.likes,
      liked: viewer ? c.likedBy.length > 0 : false,
    })),
  });
}

/** POST — add a comment (auth required). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to join the discussion." },
      { status: 401 }
    );
  }

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.body ?? "").trim();
  if (!text || text.length > 2000) {
    return NextResponse.json(
      { error: "Comment must be 1–2000 characters." },
      { status: 400 }
    );
  }

  const article = await prisma.article.findUnique({
    where: { slug: (await params).slug },
    select: { id: true },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: { body: text, userId: user.id, articleId: article.id },
      }),
      prisma.article.update({
        where: { id: article.id },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    const ctx = trackingContext(req);
    after(async () => {
      await recordArticleEvent({
        articleId: article.id,
        type: EVENT_TYPES.COMMENT,
        referrer: ctx.referrer,
        sessionHash: ctx.sessionHash,
      });
    });

    return NextResponse.json({
      ok: true,
      comment: {
        id: comment.id,
        authorName: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        content: comment.body,
        createdAt: "just now",
        likes: 0,
        liked: false,
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    throw e;
  }
}