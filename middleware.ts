import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { detectBot, visitKey } from "@/lib/ai-bots";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Refreshes the Supabase auth session on every request so access-token
 * cookies stay valid (recommended pattern for @supabase/ssr).
 * Also rate-limits mutating /api/* traffic per IP.
 */
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;

  // Record AI / search crawler page views (fire-and-forget, never blocks the page).
  if ((request.method === "GET" || request.method === "HEAD") && !pathname.startsWith("/api/")) {
    const bot = detectBot(request.headers.get("user-agent"));
    if (bot) {
      event.waitUntil(
        visitKey()
          .then((key) =>
            key
              ? fetch(new URL("/api/ai-visit", request.url), {
                  method: "POST",
                  headers: { "content-type": "application/json", "x-ai-visit-key": key, "user-agent": "reporally-internal" },
                  body: JSON.stringify({ bot: bot.name, path: pathname, ua: request.headers.get("user-agent") }),
                })
              : undefined
          )
          .catch(() => undefined)
      );
    }
  }

  // Rate limit write traffic to the API: 30 mutations/min per IP.
  if (
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    pathname.startsWith("/api/") &&
    pathname !== "/api/ai-visit"
  ) {
    const rl = checkRateLimit(`api:${getClientIp(request)}`, 30, 60_000);
    if (!rl.ok) {
      logger.warn("ratelimit.blocked", {
        ip: getClientIp(request),
        path: pathname,
        method: request.method,
        retryAfterSec: rl.retryAfterSec,
      });
      return new NextResponse(
        JSON.stringify({ error: "Too many requests — slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rl.retryAfterSec),
          },
        }
      );
    }
  }

  let response = NextResponse.next({ request });

  // Auth session refresh — but a missing/broken Supabase config must never
  // crash the whole site. Pages enforce auth independently (server-side
  // redirects), so failing open here only costs the edge-level shortcut.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logger.warn("middleware.missing_supabase_env", { path: pathname });
    return response;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // IMPORTANT: do not remove — triggers token refresh when needed
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Edge-level gate: unauthenticated users never even render protected pages
    const isProtected =
      pathname.startsWith("/profile") ||
      pathname === "/write" ||
      pathname.startsWith("/write/") ||
      pathname.startsWith("/review");
    if (isProtected && !user) {
      const url = new URL("/signin", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  } catch (e) {
    logger.error("middleware.auth_refresh_failed", {
      message: e instanceof Error ? e.message : "unknown",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};