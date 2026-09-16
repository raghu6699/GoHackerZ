/**
 * In-memory token-bucket rate limiter.
 *
 * Good enough for a single serverless region / single Node process. On Vercel
 * each isolate keeps its own buckets — that still blunts bursts; swap in
 * Upstash Redis behind the same checkRateLimit() signature when multi-region.
 */

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  const refillPerMs = limit / windowMs;
  let bucket = buckets.get(key);

  // crude eviction so abuse can't balloon the map
  if (!bucket && buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }

  bucket = bucket ?? { tokens: limit, updatedAt: now };
  bucket.tokens = Math.min(limit, bucket.tokens + (now - bucket.updatedAt) * refillPerMs);
  bucket.updatedAt = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterSec: 0 };
  }

  buckets.set(key, bucket);
  return {
    ok: false,
    remaining: 0,
    retryAfterSec: Math.max(1, Math.ceil((1 - bucket.tokens) / refillPerMs / 1000)),
  };
}

/** Test helper — wipes all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Async rate limiter with Upstash Redis REST support for multi-region serverless.
 * Falls back seamlessly to checkRateLimit() when Upstash env vars are unset.
 */
export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return checkRateLimit(key, limit, windowMs);
  }

  try {
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
    const redisKey = `rl:${key}`;
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec],
      ]),
    });

    if (!res.ok) return checkRateLimit(key, limit, windowMs);
    const data = await res.json();
    const count = Number(data[0]?.result ?? 1);

    if (count <= limit) {
      return { ok: true, remaining: limit - count, retryAfterSec: 0 };
    }

    return { ok: false, remaining: 0, retryAfterSec: windowSec };
  } catch {
    return checkRateLimit(key, limit, windowMs);
  }
}

/** Best-effort client IP: Cloudflare / Vercel / proxy headers first, fallback "unknown". */
export function getClientIp(req: { headers: Headers }): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const firstIp = fwd.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  return "unknown";
}
