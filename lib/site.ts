export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://reporally.com");

/** Official profiles for entity linking (sameAs). Set NEXT_PUBLIC_SOCIAL_LINKS to a comma-separated list of full URLs. */
export const SOCIAL_LINKS: string[] = (process.env.NEXT_PUBLIC_SOCIAL_LINKS || "")
  .split(",")
  .map((u) => u.trim())
  .filter((u) => /^https:\/\//.test(u));
