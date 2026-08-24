import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

/** GET — bookmark state for this article + viewer. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug: (await params).slug },
    select: { id: true, bookmarkCount: true },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getCurrentDbUser();
  let saved = false;
  if (user) {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_articleId: { userId: user.id, articleId: article.id } },
    });
    saved = !!existing;
  }
  return NextResponse.json({ saved, count: Math.max(0, article.bookmarkCount) });
}

/** POST — toggle bookmark (auth required). */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to save posts." },
      { status: 401 }
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
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.bookmark.findUnique({
        where: { userId_articleId: { userId: user.id, articleId: article.id } },
      });
      if (existing) {
        await tx.bookmark.delete({ where: { id: existing.id } });
        const updated = await tx.article.update({
          where: { id: article.id },
          data: { bookmarkCount: { decrement: 1 } },
          select: { bookmarkCount: true },
        });
        return { saved: false, count: Math.max(0, updated.bookmarkCount) };
      }
      await tx.bookmark.create({
        data: { userId: user.id, articleId: article.id },
      });
      const updated = await tx.article.update({
        where: { id: article.id },
        data: { bookmarkCount: { increment: 1 } },
        select: { bookmarkCount: true },
      });
      return { saved: true, count: updated.bookmarkCount };
    });

    return NextResponse.json(result);
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      const row = await prisma.bookmark.findUnique({
        where: { userId_articleId: { userId: user.id, articleId: article.id } },
      });
      return NextResponse.json({ saved: !!row }, { status: 200 });
    }
    throw e;
  }
}