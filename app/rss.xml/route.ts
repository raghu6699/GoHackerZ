import { getLatest } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

export const revalidate = 1800;

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** RSS 2.0 feed — how aggregators and readers subscribe to GoHackerz. */
export async function GET() {
  const SITE_FALLBACK = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>GoHackerz — Where builders actually write</title>
    <link>${SITE_URL}</link>
    <description>Honest engineering essays, teardowns and post-mortems.</description>
    <language>en</language>
  </channel>
</rss>`;

  let articles;
  try {
    articles = await getLatest(50);
  } catch {
    // DB unavailable (image build, transient outage) — serve a valid empty feed
    return new Response(SITE_FALLBACK, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  const items = articles
    .map(
      (a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${SITE_URL}/article/${a.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/article/${a.slug}</guid>
      <description>${esc(a.dek)}</description>
      <author>${esc(a.authorUsername)}@gohackerz.com (${esc(a.authorUsername)})</author>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>GoHackerz — Where builders actually write</title>
    <link>${SITE_URL}</link>
    <description>Honest engineering essays, teardowns and post-mortems.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}