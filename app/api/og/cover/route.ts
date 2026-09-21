import sharp from "sharp";
import { getArticle } from "@/lib/queries";
import { generateSatoriOGCard } from "../route";

export const runtime = "nodejs";

/**
 * GET /api/og/cover?slug=<slug> OR ?url=<url>
 * Dynamic OG image transformation service:
 * - Crops & resizes cover images to exact 1200x630 (1.91:1 aspect ratio)
 * - Recompresses heavy images (>2MB) to lightweight progressive JPEGs (~120KB - 250KB)
 * - Directly renders dynamic Satori OG card (HTTP 200 OK) if no cover image is set or fetch fails.
 * - ZERO 302 REDIRECTS to ensure 100% compliance with social crawlers (Facebook, X, LinkedIn).
 */
export async function GET(req: Request) {
  let title = "GoHackerz";
  let author = "Community Contributor";
  let topic = "Engineering";
  let readingTime = "5";
  let imageUrl: string | null = null;

  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const rawUrl = searchParams.get("url");

    imageUrl = rawUrl;

    if (slug) {
      const article = await getArticle(slug);
      if (article) {
        title = article.title;
        author = article.authorUsername;
        topic = article.topicSlug;
        readingTime = String(article.readingTime);
        if (article.coverImage) {
          imageUrl = article.coverImage;
        }
      }
    }

    if (imageUrl) {
      try {
        const res = await fetch(imageUrl, {
          headers: {
            "User-Agent": "GoHackerz-OGFetcher/1.0",
          },
        });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const inputBuffer = Buffer.from(arrayBuffer);

          // Resize & crop to exact 1200x630 (1.91:1 ratio expected by OpenGraph)
          const outputBuffer = await sharp(inputBuffer)
            .resize(1200, 630, {
              fit: "cover",
              position: "center",
            })
            .jpeg({ quality: 82, progressive: true, mozjpeg: true })
            .toBuffer();

          return new Response(outputBuffer, {
            status: 200,
            headers: {
              "Content-Type": "image/jpeg",
              "Content-Length": String(outputBuffer.length),
              "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
            },
          });
        }
      } catch (err) {
        console.error("Failed to transform OG cover image, falling back to Satori card:", err);
      }
    }
  } catch (err) {
    console.error("GET /api/og/cover error:", err);
  }

  // Directly return Satori OG image card with HTTP 200 OK (NO 302 REDIRECTS!)
  return generateSatoriOGCard({ title, author, topic, readingTime });
}
