import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

/** POST — toggle the signed-in user's upvote on a comment. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: (await params).id },
    select: { id: true },
  });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.commentLike.findUnique({
        where: { userId_commentId: { userId: user.id, commentId: comment.id } },
      });
      if (existing) {
        await tx.commentLike.delete({ where: { id: existing.id } });
        await tx.comment.update({
          where: { id: comment.id },
          data: { likes: { decrement: 1 } },
        });
      } else {
        await tx.commentLike.create({
          data: { userId: user.id, commentId: comment.id },
        });
        await tx.comment.update({
          where: { id: comment.id },
          data: { likes: { increment: 1 } },
        });
      }
      const fresh = await tx.comment.findUniqueOrThrow({
        where: { id: comment.id },
        select: { likes: true },
      });
      return { liked: !existing, likes: Math.max(0, fresh.likes) };
    });

    return NextResponse.json(result);
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ liked: true }, { status: 200 });
    }
    throw e;
  }
}