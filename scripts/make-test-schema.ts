import { prisma } from "../lib/prisma";
async function main() {
  await prisma.$executeRawUnsafe("DROP SCHEMA IF EXISTS reporally_test CASCADE");
  await prisma.$executeRawUnsafe("CREATE SCHEMA reporally_test");
  console.log("TEST SCHEMA CREATED");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
