import { SITE_URL } from "@/lib/site";

/** IndexNow key. Public by design: it is served at /<key>.txt to prove site ownership. */
export const INDEXNOW_KEY = "81155cbe4ae4ea46a3e8cfb83d42381a";

/** Tell Bing and other IndexNow engines about new or changed URLs. Never throws, never blocks. */
export function pingIndexNow(paths: string[]): void {
  if (process.env.NODE_ENV !== "production") return;
  const host = new URL(SITE_URL).host;
  if (host.includes("vercel.app") || host.includes("localhost")) return;
  const urlList = paths.map((p) => (p.startsWith("http") ? p : `${SITE_URL}${p}`));
  fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}
