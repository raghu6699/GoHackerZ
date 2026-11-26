import { after, type NextRequest } from "next/server";
import { prisma, isDbAvailable } from "@/lib/prisma";
import { detectBot } from "@/lib/ai-bots";
import { withUtm, isHttpUrl } from "@/lib/sponsors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Tracked sponsor link: logs a click (not for known bots) and redirects to
 * the sponsor's site with UTM tags. Unknown ids go to /advertise.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/go/[id]">) {
  const { id } = await ctx.params;
  const go = (location: string) =>
    new Response(null, { status: 302, headers: { Location: location, "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" } });
  if (!isDbAvailable() || id.length > 64) return go(new URL("/advertise", req.url).toString());

  let campaign: { id: string; url: string; placement: string } | null = null;
  try {
    campaign = await prisma.sponsorCampaign.findUnique({ where: { id }, select: { id: true, url: true, placement: true } });
  } catch (e) {
    logger.warn("sponsor.click_lookup_failed", { message: e instanceof Error ? e.message : "unknown" });
  }
  if (!campaign || !isHttpUrl(campaign.url)) {
    return go(new URL("/advertise", req.url).toString());
  }

  if (!detectBot(req.headers.get("user-agent"))) {
    const campaignId = campaign.id;
    const referer = req.headers.get("referer");
    let path: string | null = null;
    try {
      path = referer ? new URL(referer).pathname.slice(0, 300) : null;
    } catch {}
    after(() =>
      prisma.sponsorEvent
        .create({ data: { campaignId, kind: "click", path } })
        .catch((e) => logger.warn("sponsor.click_store_failed", { message: e instanceof Error ? e.message : "unknown" }))
    );
  }

  return go(withUtm(campaign.url, campaign.placement));
}
