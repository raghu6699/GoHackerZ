"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Counts one viewable impression for a sponsor campaign: sent once per page
 * view, when at least half of the ad has been on screen. Crawlers that do not
 * run JavaScript never count, and the API drops known bots too.
 */
export function SponsorImpression({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let sent = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (sent || !entries.some((e) => e.isIntersecting)) return;
        sent = true;
        io.disconnect();
        const body = JSON.stringify({ id: campaignId, path: window.location.pathname });
        if (!navigator.sendBeacon?.("/api/sponsor/impression", body)) {
          fetch("/api/sponsor/impression", { method: "POST", body, keepalive: true }).catch(() => undefined);
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [campaignId]);

  return <div ref={ref}>{children}</div>;
}
