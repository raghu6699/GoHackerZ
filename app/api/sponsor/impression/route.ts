import { NextResponse } from "next/server";
import { prisma, isDbAvailable } from "@/lib/prisma";
import { detectBot } from "@/lib/ai-bots";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Records one viewable impression of a sponsor placement (sent by
 * SponsorImpression). Stores only the campaign id and page path.
 */
export async function POST(req: Request) {
  if (detectBot(req.headers.get("user-agent")) || !isDbAvailable()) return new NextResponse(null, { status: 204 });
  try {
    const body = JSON.parse(await req.text()) as { id?: unknown; path?: unknown };
    const id = typeof body.id === "string" && body.id.length <= 64 ? body.id : "";
    const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 300) : null;
    if (!id) return new NextResponse(null, { status: 400 });
    const live = await prisma.sponsorCampaign.findFirst({ where: { id, active: true }, select: { id: true } });
    if (live) await prisma.sponsorEvent.create({ data: { campaignId: id, kind: "impression", path } });
  } catch (e) {
    logger.warn("sponsor.impression_failed", { message: e instanceof Error ? e.message : "unknown" });
  }
  return new NextResponse(null, { status: 204 });
}
