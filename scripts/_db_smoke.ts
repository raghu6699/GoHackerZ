import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  // read the raw env var and show just the host:port that the helper targets
  const raw = process.env.DATABASE_URL ?? "";
  const shown = raw.replace(/:[^:@/]+@/, ":****@").replace(/\/[^?]*\?/, "/db?");
  console.log("rewritten target:", shown.includes(":6543/") ? "6543 (transaction)" : "(not pooler/5432)");

  const a = await prisma.article.findFirst({ select: { id: true, slug: true } });
  console.log("query OK:", JSON.stringify(a));
  const n = await prisma.wallNote.count();
  console.log("wallNote:", n);
  await prisma.$disconnect();
  console.log("done");
}

main().catch((e) => {
  console.error("FAIL", e?.name, "|", e?.message);
  process.exit(1);
});