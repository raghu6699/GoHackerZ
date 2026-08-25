"use client";

import { useEffect } from "react";

/**
 * Fire-and-forget view ping: once per article per browser session.
 * sessionStorage survives in-tab navigation but not tab closes — deliberate:
 * a reader who comes back tomorrow counts again, a refresh doesn't.
 */
export function ViewPing({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `gh-viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // private mode etc. — still ping; worst case slight overcount
    }
    fetch(`/api/articles/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // document.referrer survives cases where the browser strips the Referer
      // header (referrer-policy); server buckets it to a source name.
      body: JSON.stringify({ referrer: document.referrer || null }),
    }).catch(() => {
      /* view counting must never disturb reading */
    });
  }, [slug]);

  return null;
}
