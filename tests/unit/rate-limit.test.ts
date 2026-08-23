import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimits, getClientIp } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit, then blocks", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("k", 5, 60_000, now).ok).toBe(true);
    }
    const blocked = checkRateLimit("k", 5, 60_000, now);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("refills tokens as time passes", () => {
    const start = 1_000_000;
    for (let i = 0; i < 3; i++) checkRateLimit("r", 3, 60_000, start);
    expect(checkRateLimit("r", 3, 60_000, start).ok).toBe(false);

    // half the window passed → ~1.5 tokens refilled → one request allowed
    expect(checkRateLimit("r", 3, 60_000, start + 30_000).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    for (let i = 0; i < 2; i++) checkRateLimit("a", 2, 60_000);
    expect(checkRateLimit("a", 2, 60_000).ok).toBe(false);
    expect(checkRateLimit("b", 2, 60_000).ok).toBe(true);
  });
});

describe("getClientIp", () => {
  const headers = (h: Record<string, string>) =>
    new Headers(h) as unknown as Headers;

  it("prefers the first x-forwarded-for entry", () => {
    const req = { headers: headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }) };
    expect(getClientIp(req)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip then unknown", () => {
    expect(getClientIp({ headers: headers({ "x-real-ip": "3.3.3.3" }) })).toBe("3.3.3.3");
    expect(getClientIp({ headers: headers({}) })).toBe("unknown");
  });
});
