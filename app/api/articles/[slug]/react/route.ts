import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

/** GET — current reaction state for this article (+ viewer's own reaction). */
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    select: { id: true, reactionCount: true },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getCurrentDbUser();
  let reacted = false;
  if (user) {
    const existing = await prisma.reaction.findUnique({
      where: { userId_articleId: { userId: user.id, articleId: article.id } },
    });
    reacted = !!existing;
  }

  return NextResponse.json({ reacted, count: Math.max(0, article.reactionCount) });
}

/** POST — toggle the signed-in user's reaction on this article (transactional). */
export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to react to posts." },
      { status: 401 }
    );
  }

  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Single transaction: row + counter move together, can't drift apart
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.reaction.findUnique({
        where: {
          userId_articleId: { userId: user.id, articleId: article.id },
        },
      });

      if (existing) {
        await tx.reaction.delete({ where: { id: existing.id } });
        const updated = await tx.article.update({
          where: { id: article.id },
          data: { reactionCount: { decrement: 1 } },
          select: { reactionCount: true },
        });
        return {
          reacted: false,
          count: Math.max(0, updated.reactionCount),
        };
      }

      await tx.reaction.create({
        data: { userId: user.id, articleId: article.id },
      });
      const updated = await tx.article.update({
        where: { id: article.id },
        data: { reactionCount: { increment: 1 } },
        select: { reactionCount: true },
      });
      return { reacted: true, count: updated.reactionCount };
    });

    return NextResponse.json(result);
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      // Lost a race against a concurrent identical toggle (double-click).
      // The unique constraint protected us — return the current real state.
      const [count, existing] = await Promise.all([
        prisma.article.findUnique({
          where: { id: article.id },
          select: { reactionCount: true },
        }),
        prisma.reaction.findUnique({
          where: {
            userId_articleId: { userId: user.id, articleId: article.id },
          },
        }),
      ]);
      return NextResponse.json({
        reacted: !!existing,
        count: Math.max(0, count?.reactionCount ?? 0),
      });
    }
    throw e;
  }
}