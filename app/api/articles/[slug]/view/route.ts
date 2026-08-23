import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/articles/[slug]/view — count a read.
 * Client dedups per browser-session (ViewPing); server just increments so the
 * hot path stays a single UPDATE.
 */
export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const row = await prisma.article.update({
    where: { slug: params.slug },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  });
  return NextResponse.json({ ok: true, views: row.viewCount });
}
