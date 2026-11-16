/**
 * Only allow same-site, path-only redirect targets (e.g. "/hackathons/x/register?team=ABC").
 * Rejects absolute URLs, protocol-relative ("//host"), backslashes and header-injection chars,
 * so a crafted ?next= can never send someone off-site after signing in.
 */
export function safeNext(value?: string | null, fallback = "/"): string {
  if (!value) return fallback;
  const v = value.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\") || /[\r\n\t]/.test(v)) return fallback;
  return v;
}
