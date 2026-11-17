import { getLatest } from "@/lib/queries";
import { blocksToText } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

/** /llms-full.txt: plain-text bodies of recent articles, for AI answer engines. */
export async function GET() {
  const articles = await getLatest(60).catch(() => []);
  const parts = articles.map((a) => {
    let body = "";
    try {
      body = blocksToText(a.content);
    } catch {
      body = a.dek || "";
    }
    return `# ${a.title}\nURL: ${SITE_URL}/article/${a.slug}\nPublished: ${a.publishedAt.slice(0, 10)}\n\n${a.dek ? a.dek + "\n\n" : ""}${body}`;
  });
  const text = `# RepoRally: recent articles (full text)\nSource: ${SITE_URL}\n\n${parts.join("\n\n---\n\n")}\n`;
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
