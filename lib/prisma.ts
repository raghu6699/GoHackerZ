import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

// Prisma singleton — avoids exhausting connections during dev hot-reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Returns a connection string suited to serverless/edge runtimes.
 *
 * Supabase exposes its pooler (~*.pooler.supabase.com) on two ports:
 *   - 5432 — SESSION mode: every client occupies a full backend connection,
 *     capped low (default pool_size 15) → "max clients reached in session
 *     mode … pool_size: 15" when concurrent Vercel function instances each
 *     open several connections.
 *   - 6543 — TRANSACTION mode: many clients are multiplexed over a small set
 *     of real backends — what a many-instance serverless workload needs.
 *
 * If DATABASE_URL is sitting on the session pooler (5432), transparently move
 * it to the transaction pooler (6543) so the fix ships in code instead of
 * requiring every deployment to hand-tune the env var.
 */
function serverlessConnectionString(raw = process.env.DATABASE_URL ?? ""): string {
  // Swap only the session-pooler port; host, credentials and params are unchanged.
  if (/pooler\.supabase\.com/.test(raw) && /:5432\//.test(raw)) {
    return raw.replace(":5432/", ":6543/");
  }
  return raw;
}

function createPrisma() {
  const rawConnectionString = process.env.DATABASE_URL;

  // Fail loud and specific. An undefined connectionString makes pg throw an
  // opaque error deep inside the first query — indistinguishable from a
  // network blurb and useless in logs. This mirrors the fail-fast env guards
  // added for Supabase in middleware.ts / supabase-browser.ts.
  if (!rawConnectionString) {
    throw new Error(
      "DATABASE_URL is not set. On Vercel: Settings → Environment Variables → " +
        "add DATABASE_URL (use the Supabase *transaction* pooled connection " +
        "string, port 6543, for serverless), scope it to Production + Preview, " +
        "then redeploy."
    );
  }

  const connectionString = serverlessConnectionString(rawConnectionString);

  // Serverless-safe connection pooling. Each Vercel function instance keeps its
  // own Prisma client + pool; if we let the driver adapter construct its default
  // multi-connection pool, N concurrent function instances can each grab up to
  // 10 connections and collectively exhaust Supabase's session-mode cap (15) →
  // "EMAXCLIENTS max clients reached … pool_size: 15". Application traffic is
  // short-lived, so one connection per instance is all we need — pg queues any
  // concurrent queries and the singleton above keeps the pool warm per instance.
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000, // fail fast instead of queueing behind 15 slots
    idleTimeoutMillis: 30_000, // free the connection back to Supabase when idle
  });

  // Take over the pool: pass the instance + keep it alive on adapter dispose so
  // it is reused (disposeExternalPool defaults to false, but be explicit).
  const adapter = new PrismaPg(pool, { disposeExternalPool: false });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/** Check if database connection string is available in environment. */
export function isDbAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL);
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