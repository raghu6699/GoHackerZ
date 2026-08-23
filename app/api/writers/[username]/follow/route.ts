import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

/** Resolve a writer by username (or legacy email-prefix usernames). */
async function findWriter(username: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: { startsWith: username + "@" } }],
    },
    include: { _count: { select: { followers: true } } },
  });
}

async function followerCount(userId: string): Promise<number | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { followers: true } } },
  });
  if (!u) return null;
  return u._count.followers;
}

/** GET — is the viewer following this writer + the writer's follower count. */
export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  const writer = await findWriter(params.username);
  if (!writer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const viewer = await getCurrentDbUser();
  let following = false;
  if (viewer) {
    const row = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewer.id,
          followingId: writer.id,
        },
      },
    });
    following = !!row;
  }

  return NextResponse.json({
    following,
    followers: writer._count.followers,
    isSelf: viewer?.id === writer.id,
  });
}

/** POST — toggle follow for the signed-in user. */
export async function POST(
  _req: Request,
  { params }: { params: { username: string } }
) {
  const viewer = await getCurrentDbUser();
  if (!viewer) {
    return NextResponse.json(
      { error: "Sign in to follow writers." },
      { status: 401 }
    );
  }

  const writer = await findWriter(params.username);
  if (!writer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (writer.id === viewer.id) {
    return NextResponse.json(
      { error: "You can't follow yourself." },
      { status: 400 }
    );
  }

  try {
    // Single transaction: follow row and any derived state move together
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewer.id,
            followingId: writer.id,
          },
        },
      });

      if (existing) {
        await tx.follow.delete({ where: { id: existing.id } });
        return false;
      }

      await tx.follow.create({
        data: { followerId: viewer.id, followingId: writer.id },
      });
      return true;
    });

    const followers = await followerCount(writer.id);
    if (followers === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ following: result, followers });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      // Concurrent identical follow — constraint held; report real state
      const row = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewer.id,
            followingId: writer.id,
          },
        },
      });
      return NextResponse.json({
        following: !!row,
        followers: await followerCount(writer.id),
      });
    }
    throw e;
  }
}