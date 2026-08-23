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

/** Best-effort client IP: Vercel/CDN proxy headers first, fallback "unknown". */
export function getClientIp(req: { headers: Headers }): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
