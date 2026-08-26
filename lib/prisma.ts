import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Prisma singleton — avoids exhausting connections during dev hot-reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;

  // Fail loud and specific. An undefined connectionString makes pg throw an
  // opaque error deep inside the first query — indistinguishable from a
  // network blurb and useless in logs. This mirrors the fail-fast env guards
  // added for Supabase in middleware.ts / supabase-browser.ts.
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. On Vercel: Settings → Environment Variables → " +
        "add DATABASE_URL (use the Supabase *pooled* connection string, port 6543, " +
        "for serverless), scope it to Production + Preview, then redeploy."
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createPrisma();
  return globalForPrisma.prisma;
}

/**
 * Lazy Prisma singleton — the client is only constructed on the first actual
 * property access (i.e. first query), not at import time. Keeps importing
 * this module side-effect-free, so unit tests (and anything else without a
 * DATABASE_URL) can import query helpers without triggering the env guard.
 * The globalThis cache still avoids exhausting connections on dev hot-reload.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});