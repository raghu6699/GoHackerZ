import { NextResponse } from "next/server";
import sharp from "sharp";
import { getArticle } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

/**
 * GET /api/og/cover?slug=<slug> OR ?url=<url>
 * Dynamic OG image transformation service:
 * - Crops & resizes cover images to exact 1200x630 (1.91:1 aspect ratio)
 * - Recompresses heavy images (>2MB) to lightweight progressive JPEGs (~120KB - 250KB)
 * - Falls back to dynamic Satori OG card if no cover image is set or fetch fails.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const rawUrl = searchParams.get("url");

    let imageUrl = rawUrl;
    let title = "GoHackerz";
    let author = "Community Contributor";
    let topic = "Engineering";
    let readingTime = "5";

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
        const res = await fetch(imageUrl);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const inputBuffer = Buffer.from(arrayBuffer);

          // Resize & crop to exact 1200x630 (1.91:1 ratio expected by OpenGraph)
          // Recompress to progressive JPEG quality 82 for optimal file size (< 250KB)
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
        console.error("Failed to transform OG cover image:", err);
      }
    }

    // Fallback to dynamic Satori card generator if cover image is missing or fetch fails
    const fallbackUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&topic=${encodeURIComponent(topic)}&time=${readingTime}`;
    return NextResponse.redirect(fallbackUrl, 302);
  } catch (err) {
    console.error("GET /api/og/cover error:", err);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
