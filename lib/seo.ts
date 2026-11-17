import type { HackathonData } from "@/lib/hackathons";
import { SITE_URL } from "@/lib/site";
import { BOLO_SLUG } from "@/lib/curated-events";

export const SITE_NAME = "RepoRally";
export const SITE_TAGLINE = "The publishing platform and hackathon home for builders and techies";
export const SITE_DESCRIPTION =
  "RepoRally is where developers publish honest engineering essays, build logs and post-mortems, and join community hackathons like Bolo & Build, a one-day voice-only hackathon in Hyderabad and online.";

/** Serialise JSON-LD safely for an inline script tag. */
export function ldJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const EVENT_STATUS: Record<HackathonData["status"], string> = {
  UPCOMING: "https://schema.org/EventScheduled",
  ACTIVE: "https://schema.org/EventScheduled",
  JUDGING: "https://schema.org/EventScheduled",
  COMPLETED: "https://schema.org/EventScheduled",
};

/** schema.org Event + FAQPage + BreadcrumbList for a hackathon page. */
export function hackathonJsonLd(h: HackathonData) {
  const url = `${SITE_URL}/hackathons/${h.slug}`;
  const isBolo = h.slug === BOLO_SLUG;
  const image = isBolo ? `${SITE_URL}/og/bolo-and-build.png` : `${SITE_URL}/og-image.png`;

  const event: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: h.title,
    description: isBolo
      ? "A one-day, voice-only hackathon. Builders dictate to a coding agent with Wispr Flow, build an app for India in one of five tracks, then publish their build log on RepoRally."
      : h.description || h.tagline,
    url,
    image: [image],
    startDate: h.startDate,
    endDate: h.endDate,
    eventStatus: EVENT_STATUS[h.status],
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    inLanguage: "en",
    isAccessibleForFree: true,
    location: [
      {
        "@type": "Place",
        name: isBolo ? "Hyderabad, India" : "Venue to be announced",
        address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressCountry: "IN" },
      },
      { "@type": "VirtualLocation", url },
    ],
    offers: {
      "@type": "Offer",
      url: `${url}/register`,
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString().slice(0, 10),
    },
    organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  const graph: unknown[] = [event];

  if (h.faqs?.length) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: h.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  graph.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Hackathons", item: `${SITE_URL}/hackathons` },
      { "@type": "ListItem", position: 3, name: h.title, item: url },
    ],
  });

  return graph;
}
