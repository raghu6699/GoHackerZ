import type { Metadata } from "next";
import type { HackathonData } from "@/lib/hackathons";
import { SITE_URL } from "@/lib/site";
import { BOLO_SLUG } from "@/lib/curated-events";

/** Per-event share image. Curated events get a designed card; others fall back to the site card. */
export function hackathonShareImage(hackathon: Pick<HackathonData, "slug" | "title">) {
  if (hackathon.slug === BOLO_SLUG) {
    return {
      url: `${SITE_URL}/og/bolo-and-build.png`,
      width: 1200,
      height: 630,
      alt: `${hackathon.title}: a voice-only hackathon, Sat 28 Nov 2026, Hyderabad and online`,
    };
  }
  return {
    url: `${SITE_URL}/og-image.png`,
    width: 1200,
    height: 630,
    alt: `${hackathon.title} on RepoRally`,
  };
}

function clip(text: string, max = 200): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
}

/** Title, description, canonical, Open Graph and Twitter card for a hackathon URL. */
export function hackathonSocialMetadata(
  hackathon: HackathonData,
  opts: { path?: string; title?: string } = {}
): Metadata {
  const url = `${SITE_URL}/hackathons/${hackathon.slug}${opts.path ?? ""}`;
  const title = opts.title ?? `${hackathon.title}: ${hackathon.tagline} | RepoRally`;
  const description =
    hackathon.slug === BOLO_SLUG
      ? "Sat 28 Nov, Hyderabad + online. Build an app for India with any coding agent, driven entirely by voice with Wispr Flow, then publish your build log. Free to join."
      : clip(hackathon.description || hackathon.tagline);
  const image = hackathonShareImage(hackathon);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "RepoRally",
      locale: "en_US",
      url,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}
