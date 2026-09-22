import { describe, expect, it } from "vitest";

describe("production site configuration", () => {
  it("uses the production domain instead of localhost in public metadata", async () => {
    const { SITE_URL } = await import("@/lib/site");
    expect(SITE_URL).toBe(process.env.NEXT_PUBLIC_SITE_URL || "https://go-hacker.vercel.app");
  });
});
