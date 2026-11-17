import { getLatest, getAllTopics } from "@/lib/queries";
import { getAllHackathons } from "@/lib/hackathons";
import { SITE_URL } from "@/lib/site";
import { SITE_DESCRIPTION } from "@/lib/seo";

export const revalidate = 3600;

/** /llms.txt: a curated, machine-readable map of the site for AI answer engines. */
export async function GET() {
  const [articles, topics, hackathons] = await Promise.all([
    getLatest(40).catch(() => []),
    getAllTopics().catch(() => []),
    getAllHackathons().catch(() => []),
  ]);

  const lines: string[] = [
    "# RepoRally",
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "RepoRally (also written Repo Rally, reporally.com) is a free publishing platform for software builders. Writers publish essays, tutorials, build logs and post-mortems. The platform also hosts community hackathons, with certificates that can be verified publicly.",
    "",
    "## Key pages",
    `- [Home](${SITE_URL}): latest and featured writing`,
    `- [Read](${SITE_URL}/read): all published articles`,
    `- [Hackathons](${SITE_URL}/hackathons): current and past community hackathons`,
    `- [Topics](${SITE_URL}/topics): browse writing by topic`,
    `- [About](${SITE_URL}/about): who runs RepoRally and why`,
    `- [Manifesto](${SITE_URL}/manifesto): what RepoRally stands for`,
    `- [Writing guidelines](${SITE_URL}/guidelines): what makes a good post`,
    `- [RSS feed](${SITE_URL}/rss.xml)`,
    "",
  ];

  if (hackathons.length) {
    lines.push("## Hackathons");
    for (const h of hackathons) {
      lines.push(`- [${h.title}](${SITE_URL}/hackathons/${h.slug}): ${h.tagline}`);
    }
    lines.push("");
  }

  if (topics.length) {
    lines.push("## Topics");
    for (const t of topics) lines.push(`- [${t.name}](${SITE_URL}/topic/${t.slug})`);
    lines.push("");
  }

  if (articles.length) {
    lines.push("## Recent articles");
    for (const a of articles) {
      const dek = (a.dek || "").replace(/\s+/g, " ").trim();
      lines.push(`- [${a.title}](${SITE_URL}/article/${a.slug})${dek ? `: ${dek}` : ""}`);
    }
    lines.push("");
  }

  lines.push("## Optional", `- [Full text of recent articles](${SITE_URL}/llms-full.txt)`, "");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
