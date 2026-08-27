"use client";

import { useEffect, useRef, useState } from "react";
import type { TocHeading } from "@/lib/content";

/**
 * Medium-style table of contents for long articles.
 *
 * Two pieces, both fed by `extractHeadings()` (server-side):
 *  - TableOfContentsCard — static contents card rendered right below the
 *    byline, listing every h2 section as an anchor link.
 *  - SectionNavbar — sticky strip under the site nav that appears once the
 *    reader scrolls past the intro; highlights the active section while
 *    scrolling and lets you jump between sections seamlessly.
 */

/**
 * Contents card ("What's in this post"). Plain anchors so every section is
 * deep-linkable; landing offset comes from the global `[id] scroll-margin-top`.
 */
export function TableOfContentsCard({ headings }: { headings: TocHeading[] }) {
  return (
    <nav aria-label="Table of contents" className="card p-5 sm:p-6 mb-8">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-3 h-3 rounded-[3px] bg-lime border-2 border-ink shrink-0" />
        <h2 className="font-mono text-[11px] font-bold tracking-widest text-subtle">
          {"WHAT\u2019S IN THIS POST"}
        </h2>
      </div>
      <ol className="space-y-1">
        {headings.map((h, i) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="group flex items-baseline gap-3 rounded-lg px-2 py-1.5 hover:bg-lime/25 transition-colors"
            >
              <span className="font-mono text-[11px] font-bold text-purple shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[15px] leading-snug group-hover:underline decoration-2 underline-offset-2">
                {h.text}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Sticky horizontal section strip. Sticks directly under the site nav,
 * reveals itself after the reader passes `#toc-reveal` (end of the byline),
 * and tracks the active section on scroll — rAF-throttled like ReadingProgress.
 */
export function SectionNavbar({ headings }: { headings: TocHeading[] }) {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [top, setTop] = useState(64); // fallback = rough sticky-nav height
  const rafRef = useRef(0);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef(new Map<string, HTMLAnchorElement>());
  // While the user is flicking through the strip themselves, don't fight them.
  const suppressAutoScrollUntil = useRef(0);

  // The bar must stick to the bottom edge of whatever height the real nav has.
  useEffect(() => {
    const nav = document.querySelector("nav");
    const measure = () =>
      setTop(nav instanceof HTMLElement ? nav.offsetHeight : 64);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const update = () => {
      rafRef.current = 0;

      const probe = document.getElementById("toc-reveal");
      if (probe) setVisible(probe.getBoundingClientRect().top <= 100);

      let current: string | null = null;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 140) current = h.id;
        else break;
      }
      setActiveId(current);
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
  }, [headings]);

  // Keep the active chip inside the visible part of the strip.
  useEffect(() => {
    if (!activeId || Date.now() < suppressAutoScrollUntil.current) return;
    const scroller = scrollerRef.current;
    const chip = chipsRef.current.get(activeId);
    if (scroller && chip) {
      scroller.scrollTo({
        left: chip.offsetLeft - scroller.clientWidth / 2 + chip.clientWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeId]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Article sections"
      aria-hidden={!visible}
      style={{ top }}
      className={`sticky z-40 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-3 pointer-events-none"
      }`}
    >
      <div className="bg-bg/95 backdrop-blur-md border-y-2 border-ink">
        <div
          ref={scrollerRef}
          onWheel={(e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY))
              suppressAutoScrollUntil.current = Date.now() + 2000;
          }}
          onPointerDown={() => {
            suppressAutoScrollUntil.current = Date.now() + 2500;
          }}
          className="toc-strip overflow-x-auto"
        >
          <div className="flex items-center gap-2 min-w-max px-6 py-2.5 w-fit mx-auto">
            <span className="font-mono text-[10px] font-bold tracking-widest text-subtle mr-1 shrink-0">
              SECTIONS
            </span>
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                ref={(el) => {
                  if (el) chipsRef.current.set(h.id, el);
                  else chipsRef.current.delete(h.id);
                }}
                aria-current={activeId === h.id ? "true" : undefined}
                title={h.text}
                className={`chip whitespace-nowrap max-w-[240px] truncate transition-colors ${
                  activeId === h.id
                    ? "bg-lime font-bold shadow-pop-sm"
                    : "hover:bg-lime/30"
                }`}
              >
                {h.text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}