"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fixed top-of-viewport bar showing how far through the page the reader is.
 * Scroll updates are throttled to animation frames; purely decorative
 * (aria-hidden) since it duplicates document position.
 */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const update = () => {
      rafRef.current = 0;
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const next =
        total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
      setPct((prev) => (Math.abs(prev - next) > 0.25 ? next : prev));
    };
    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div aria-hidden className="fixed top-0 left-0 right-0 z-50 h-[5px] pointer-events-none">
      <div
        className="h-full bg-lime border-b-2 border-r-2 border-ink"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
