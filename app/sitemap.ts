import type { MetadataRoute } from "next";
import { getLatest, getAllTopics, getAllAuthors } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Degrade gracefully when the DB is unreachable (e.g. Docker image builds
  // without a database) — an empty sitemap beats a failed build.
  try {
    const [articles, topics, authors] = await Promise.all([
      getLatest(500),
      getAllTopics(),
      getAllAuthors(),
    ]);

    return [
      { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
      { url: `${SITE_URL}/read`, changeFrequency: "daily", priority: 0.9 },
      { url: `${SITE_URL}/topics`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${SITE_URL}/deep-dives`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${SITE_URL}/manifesto`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${SITE_URL}/guidelines`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${SITE_URL}/guestbook`, changeFrequency: "weekly", priority: 0.5 },
      { url: `${SITE_URL}/feed`, changeFrequency: "daily", priority: 0.7 },
      { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
      { url: `${SITE_URL}/search`, changeFrequency: "weekly", priority: 0.3 },
      ...topics.map((t) => ({
        url: `${SITE_URL}/topic/${t.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...authors.map((a) => ({
        url: `${SITE_URL}/writer/${a.username}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
      ...articles.map((a) => ({
        url: `${SITE_URL}/article/${a.slug}`,
        lastModified: new Date(a.publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return [{ url: SITE_URL, changeFrequency: "hourly", priority: 1 }];
  }
}