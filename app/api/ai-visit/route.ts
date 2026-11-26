import { NextResponse } from "next/server";
import { prisma, isDbAvailable } from "@/lib/prisma";
import { botInfo, visitKey } from "@/lib/ai-bots";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Internal: middleware reports a crawler page view here (fire-and-forget).
 * Only accepts calls signed with the shared key; stores bot name, path and
 * user agent. No IP addresses or visitor data.
 */
export async function POST(req: Request) {
  const key = await visitKey();
  if (!key || req.headers.get("x-ai-visit-key") !== key) {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const body = (await req.json()) as { bot?: string; path?: string; ua?: string };
    const bot = typeof body.bot === "string" ? botInfo(body.bot) : undefined;
    const path = typeof body.path === "string" ? body.path.slice(0, 300) : "";
    if (!bot || !path.startsWith("/") || !isDbAvailable()) return new NextResponse(null, { status: 204 });
    await prisma.aiBotVisit.create({
      data: { bot: bot.name, path, userAgent: typeof body.ua === "string" ? body.ua.slice(0, 300) : null },
    });
  } catch (e) {
    logger.warn("ai_visit.store_failed", { message: e instanceof Error ? e.message : "unknown" });
  }
  return new NextResponse(null, { status: 204 });
}
