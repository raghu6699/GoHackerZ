import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString =
  "postgresql://postgres.wyqxfarmyygwzejvswwx:GoHackerZ%402026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({ connectionString, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Wiping all mock articles, comments, reactions, and mock users...");

  await prisma.reaction.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.wallNote.deleteMany({});

  const deletedArticles = await prisma.article.deleteMany({});
  console.log(`Deleted ${deletedArticles.count} mock articles.`);

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      OR: [
        { authId: null },
        { email: { endsWith: "@gohackerz.com" } },
        { username: { in: ["maya", "jordan", "dan", "sofia", "devon", "priya", "marcus", "alex", "amara"] } },
      ],
    },
  });
  console.log(`Deleted ${deletedUsers.count} mock user profiles.`);

  const [usersCount, articlesCount] = await prisma.$transaction([
    prisma.user.count(),
    prisma.article.count(),
  ]);

  console.log(`Cleanup complete! Remaining real users: ${usersCount}, articles: ${articlesCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
