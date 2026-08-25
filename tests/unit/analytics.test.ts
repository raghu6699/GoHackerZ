import { describe, expect, it } from "vitest";
import { bucketReferrer, sessionHashFor } from "@/lib/analytics";

describe("bucketReferrer", () => {
  it("returns null for empty/missing referrers (direct traffic)", () => {
    expect(bucketReferrer(null)).toBeNull();
    expect(bucketReferrer("")).toBeNull();
    expect(bucketReferrer("   ")).toBeNull();
  });

  it("buckets known sources", () => {
    expect(bucketReferrer("https://www.google.com/search?q=x")).toBe("google");
    expect(bucketReferrer("https://news.google.com/rss")).toBe("google");
    expect(bucketReferrer("https://x.com/someone")).toBe("twitter-x");
    expect(bucketReferrer("https://t.co/abc")).toBe("twitter-x");
    expect(bucketReferrer("https://www.linkedin.com/feed/")).toBe("linkedin");
    expect(bucketReferrer("https://old.reddit.com/r/webdev")).toBe("reddit");
    expect(bucketReferrer("https://news.ycombinator.com/item?id=1")).toBe("hacker-news");
    expect(bucketReferrer("https://hackernoon.com/post")).toBe("hackernoon");
    expect(bucketReferrer("https://dev.to/x")).toBe("dev-to");
  });

  it("marks same-site and localhost navigation as internal", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://gohackerz.com";
    try {
      expect(bucketReferrer("https://gohackerz.com/topic/ai")).toBe("internal");
      expect(bucketReferrer("http://localhost:3000/article/foo")).toBe("internal");
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = prev;
    }
  });

  it("falls back to other for unknown hosts, null for junk", () => {
    expect(bucketReferrer("https://example.org/page")).toBe("other");
    expect(bucketReferrer("not a url")).toBeNull();
  });
});

describe("sessionHashFor", () => {
  it("produces stable, salted, truncated hashes", () => {
    const prev = process.env.ANALYTICS_SALT;
    process.env.ANALYTICS_SALT = "test-salt";
    try {
      const a = sessionHashFor("1.2.3.4", "Mozilla/5.0");
      const b = sessionHashFor("1.2.3.4", "Mozilla/5.0");
      expect(a).toBe(b);
      expect(a).toMatch(/^[0-9a-f]{32}$/);
      expect(sessionHashFor("5.6.7.8", "Mozilla/5.0")).not.toBe(a);
      expect(sessionHashFor("1.2.3.4", "Chrome")).not.toBe(a);
    } finally {
      process.env.ANALYTICS_SALT = prev;
    }
  });

  it("handles missing ip/UA without crashing", () => {
    const prev = process.env.ANALYTICS_SALT;
    process.env.ANALYTICS_SALT = "test-salt";
    try {
      expect(sessionHashFor(null, null)).toMatch(/^[0-9a-f]{32}$/);
    } finally {
      process.env.ANALYTICS_SALT = prev;
    }
  });
});
