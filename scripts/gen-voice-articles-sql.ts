/**
 * Turns content/voice-articles/*.md into SQL (scripts/voice-articles.sql) using the
 * platform's own article parser. Run: npx tsx scripts/gen-voice-articles-sql.ts > scripts/voice-articles.sql
 * Each file: "key: value" header lines, a line with ---, then the article body.
 */
import fs from "fs";
import path from "path";
import { parseBlocks } from "../lib/content";

const dir = path.join(process.cwd(), "content/voice-articles");
const q = (s: string) => "'" + s.replace(/'/g, "''") + "'";
const out: string[] = [];
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

files.forEach((f, i) => {
  const raw = fs.readFileSync(path.join(dir, f), "utf8");
  const [head, ...rest] = raw.split("\n---\n");
  const body = rest.join("\n---\n").trim();
  const meta: Record<string, string> = {};
  head.split("\n").forEach((l) => {
    const m = /^(\w+):\s*(.*)$/.exec(l);
    if (m) meta[m[1]] = m[2];
  });
  const blocks = parseBlocks(body);
  const words = body.split(/\s+/).length;
  const rt = Math.max(1, Math.round(words / 200));
  // staggered publish times so the feed order is stable (last file = newest)
  const minutesAgo = (files.length - i) * 10;
  const id = "cvoice" + (i + 1) + "x" + Math.random().toString(36).slice(2, 10);
  out.push(`insert into "Article" ("id","slug","title","dek","content","status","readingTime","tags","featured","isSponsored","publishedAt","authorId","topicId","createdAt","updatedAt")
select ${q(id)}, ${q(meta.slug)}, ${q(meta.title)}, ${q(meta.dek)}, $j$${JSON.stringify(blocks)}$j$::jsonb, 'PUBLISHED', ${rt}, ARRAY['voice','wispr-flow','bolo-and-build']::text[], false, false, now() - interval '${minutesAgo} minutes', (select id from "User" where email='ud.ai.journey@gmail.com'), (select id from "Topic" where slug=${q(meta.topic)}), now(), now()
where exists (select 1 from "User" where email='ud.ai.journey@gmail.com') and exists (select 1 from "Topic" where slug=${q(meta.topic)})
on conflict ("slug") do nothing;`);
});

console.log(out.join("\n"));
console.error(files.length + " articles");
