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
  console.log("Wiping all articles, comments, reactions, and user profiles...");

  await prisma.comment.deleteMany({});
  await prisma.reaction.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.wallNote.deleteMany({});
  await prisma.article.deleteMany({});

  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`Deleted ${deletedUsers.count} user profiles.`);

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
