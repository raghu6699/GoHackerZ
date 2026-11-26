/**
 * Known AI and search crawlers, matched by user agent. Used to record which
 * pages answer engines fetch (see /admin/ai-visits). Order matters: the first
 * match wins, so more specific tokens come first.
 */
export type BotInfo = { name: string; vendor: string; kind: "ai-search" | "ai-training" | "ai-assistant" | "search" };

export const BOTS: (BotInfo & { re: RegExp })[] = [
  { name: "OAI-SearchBot", vendor: "OpenAI", kind: "ai-search", re: /OAI-SearchBot/i },
  { name: "ChatGPT-User", vendor: "OpenAI", kind: "ai-assistant", re: /ChatGPT-User/i },
  { name: "GPTBot", vendor: "OpenAI", kind: "ai-training", re: /GPTBot/i },
  { name: "Claude-SearchBot", vendor: "Anthropic", kind: "ai-search", re: /Claude-SearchBot/i },
  { name: "Claude-User", vendor: "Anthropic", kind: "ai-assistant", re: /Claude-User/i },
  { name: "ClaudeBot", vendor: "Anthropic", kind: "ai-training", re: /ClaudeBot|anthropic-ai/i },
  { name: "Perplexity-User", vendor: "Perplexity", kind: "ai-assistant", re: /Perplexity-User/i },
  { name: "PerplexityBot", vendor: "Perplexity", kind: "ai-search", re: /PerplexityBot/i },
  { name: "Google-CloudVertexBot", vendor: "Google", kind: "ai-assistant", re: /Google-CloudVertexBot/i },
  { name: "GoogleOther", vendor: "Google", kind: "ai-training", re: /GoogleOther/i },
  { name: "Googlebot", vendor: "Google", kind: "search", re: /Googlebot/i },
  { name: "bingbot", vendor: "Microsoft", kind: "search", re: /bingbot/i },
  { name: "Applebot", vendor: "Apple", kind: "ai-search", re: /Applebot/i },
  { name: "Amazonbot", vendor: "Amazon", kind: "ai-search", re: /Amazonbot/i },
  { name: "DuckAssistBot", vendor: "DuckDuckGo", kind: "ai-assistant", re: /DuckAssistBot/i },
  { name: "Meta-ExternalAgent", vendor: "Meta", kind: "ai-training", re: /meta-external(agent|fetcher)/i },
  { name: "Bytespider", vendor: "ByteDance", kind: "ai-training", re: /Bytespider/i },
  { name: "CCBot", vendor: "Common Crawl", kind: "ai-training", re: /CCBot/i },
  { name: "MistralAI-User", vendor: "Mistral", kind: "ai-assistant", re: /MistralAI-User/i },
  { name: "cohere-ai", vendor: "Cohere", kind: "ai-training", re: /cohere-(ai|training-data-crawler)/i },
  { name: "YouBot", vendor: "You.com", kind: "ai-search", re: /YouBot/i },
];

export function detectBot(ua: string | null | undefined): BotInfo | null {
  if (!ua) return null;
  for (const b of BOTS) if (b.re.test(ua)) return { name: b.name, vendor: b.vendor, kind: b.kind };
  return null;
}

export function botInfo(name: string): BotInfo | undefined {
  const b = BOTS.find((x) => x.name === name);
  return b && { name: b.name, vendor: b.vendor, kind: b.kind };
}

/** Shared secret between middleware and /api/ai-visit, derived from a server-only env var. */
export async function visitKey(): Promise<string> {
  const seed = process.env.DATABASE_URL || "";
  if (!seed) return "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("ai-visit:" + seed));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
