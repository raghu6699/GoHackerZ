"use client";

import { useEffect, useState } from "react";

export type HackathonBadge = "LIVE" | "SOON" | null;

/** LIVE if a hackathon is running now, SOON if one is coming up, otherwise nothing. */
export function useHackathonBadge(): HackathonBadge {
  const [badge, setBadge] = useState<HackathonBadge>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hackathons/live")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setBadge(d?.live > 0 ? "LIVE" : d?.upcoming > 0 ? "SOON" : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return badge;
}
