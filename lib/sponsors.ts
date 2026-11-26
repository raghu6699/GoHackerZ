import { prisma, isDbAvailable } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Paid sponsor placements. Campaigns live in the SponsorCampaign table and are
 * managed at /admin/sponsors. Impressions are counted in the browser when at
 * least half of the ad is on screen (POST /api/sponsor/impression); clicks go
 * through /go/[id], which logs the click and redirects with UTM tags. Known
 * crawlers are never counted.
 */

export type Placement = "card" | "banner";

export const PLACEMENTS: { id: Placement; label: string; where: string }[] = [
  { id: "banner", label: "Partner banner", where: "Full-width banner on the homepage, below the latest stories" },
  { id: "card", label: "Sponsored card", where: "Card beside the story list on the homepage" },
];

export function isPlacement(v: unknown): v is Placement {
  return v === "card" || v === "banner";
}

export type Campaign = {
  id: string;
  sponsor: string;
  headline: string;
  body: string;
  ctaLabel: string;
  url: string;
  logoUrl: string | null;
  tagline: string | null;
  tags: string[];
};

/** A live campaign for this placement (random pick if several), or null. */
export async function getActiveCampaign(placement: Placement): Promise<Campaign | null> {
  if (!isDbAvailable()) return null;
  try {
    const now = new Date();
    const rows = await prisma.sponsorCampaign.findMany({
      where: { placement, active: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      select: { id: true, sponsor: true, headline: true, body: true, ctaLabel: true, url: true, logoUrl: true, tagline: true, tags: true },
    });
    if (rows.length === 0) return null;
    return rows[Math.floor(Math.random() * rows.length)];
  } catch (e) {
    logger.warn("sponsors.load_failed", { placement, message: e instanceof Error ? e.message : "unknown" });
    return null;
  }
}

/** The tracked link for a campaign. A plain <a>, never next/link: prefetching would count fake clicks. */
export function clickHref(id: string): string {
  return `/go/${encodeURIComponent(id)}`;
}

/** Adds UTM tags so sponsors can see RepoRally traffic in their own analytics. Keeps tags they already set. */
export function withUtm(url: string, placement: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "reporally");
    if (!u.searchParams.has("utm_medium")) u.searchParams.set("utm_medium", "sponsored");
    if (!u.searchParams.has("utm_campaign")) u.searchParams.set("utm_campaign", placement);
    return u.toString();
  } catch {
    return url;
  }
}

export function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
