import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { articles, authors, topics } from "../lib/data";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("Seeding GoHackerz...");

  for (const t of topics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { name: t.name, emoji: t.emoji, color: t.color, description: t.description },
      create: { slug: t.slug, name: t.name, emoji: t.emoji, color: t.color, description: t.description },
    });
  }
  console.log("topics seeded: " + topics.length);

  const userIds = new Map<string, string>();
  for (const a of authors) {
    const data = {
      username: a.username,
      name: a.name,
      bio: a.bio,
      company: a.company,
      avatarColor: a.avatarColor,
      role: (a.username === "amara" ? "EDITOR" : "WRITER") as "EDITOR" | "WRITER",
      trustLevel: 2,
    };
    const user = await prisma.user.upsert({
      where: { email: a.username + "@gohackerz.com" },
      update: data,
      create: { email: a.username + "@gohackerz.com", ...data },
    });
    userIds.set(a.username, user.id);
  }
  console.log("authors seeded: " + authors.length);

  for (const art of articles) {
    const topic = await prisma.topic.findUnique({ where: { slug: art.topicSlug } });
    if (!topic) throw new Error("Topic not found: " + art.topicSlug);

    const base = {
      title: art.title,
      dek: art.dek,
      content: art.content,
      readingTime: art.readingTime,
      tags: art.tags,
      featured: art.featured ?? false,
      status: "PUBLISHED" as const,
      publishedAt: new Date(art.publishedAt),
      reactionCount: art.reactions,
      commentCount: art.comments,
      bookmarkCount: art.bookmarks,
      authorId: userIds.get(art.authorUsername)!,
      topicId: topic.id,
    };

    await prisma.article.upsert({
      where: { slug: art.slug },
      update: base,
      create: { slug: art.slug, ...base },
    });
  }
  console.log("articles seeded: " + articles.length);

  const [users, topicCount, articleCount] = await prisma.$transaction([
    prisma.user.count(),
    prisma.topic.count(),
    prisma.article.count(),
  ]);
  console.log("Done - users: " + users + ", topics: " + topicCount + ", articles: " + articleCount);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
