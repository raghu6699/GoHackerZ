import type { MetadataRoute } from "next";
import { getLatest, getAllTopics, getAllAuthors } from "@/lib/queries";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
      { url: SITE, changeFrequency: "hourly", priority: 1 },
      { url: `${SITE}/search`, changeFrequency: "weekly", priority: 0.3 },
      ...topics.map((t) => ({
        url: `${SITE}/topic/${t.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...authors.map((a) => ({
        url: `${SITE}/writer/${a.username}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
      ...articles.map((a) => ({
        url: `${SITE}/article/${a.slug}`,
        lastModified: new Date(a.publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return [{ url: SITE, changeFrequency: "hourly", priority: 1 }];
  }
}