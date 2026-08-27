"use client";

import { useEffect, useRef, useState } from "react";
import type { TocHeading } from "@/lib/content";

/**
 * Medium-style table of contents for long articles.
 *
 * Two pieces, both fed by `extractHeadings()` (server-side):
 *  - TableOfContentsCard — static contents card rendered right below the
 *    byline, listing every h2 section as an anchor link.
 *  - FloatingToc — Medium's pinned right-edge button (stack-of-lines glyph);
 *    hovering or tapping it opens a flyout panel of all sections with the
 *    current one highlighted. Click a section to jump straight to it.
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
 * Medium's floating TOC — the little stack-of-lines button pinned to the
 * right edge of the viewport. Appears once the reader scrolls past the
 * byline (`#toc-reveal`); hovering or tapping opens a flyout listing every
 * section, with the one you're currently reading highlighted. Click a
 * section to jump straight to it. Active-section tracking is rAF-throttled
 * like ReadingProgress.
 */
export function FloatingToc({ headings }: { headings: TocHeading[] }) {
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const rafRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reveal past the intro; track the active section while scrolling.
  useEffect(() => {
    const update = () => {
      rafRef.current = 0;
      const probe = document.getElementById("toc-reveal");
      if (probe) setRevealed(probe.getBoundingClientRect().top <= 220);

      let current: string | null = null;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 160) current = h.id;
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

  // Close on Escape / outside tap; keep the active row visible in the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    panelRef.current
      ?.querySelector<HTMLAnchorElement>(`[data-toc="${activeId ?? ""}"]`)
      ?.scrollIntoView({ block: "nearest" });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, activeId]);

  if (headings.length === 0) return null;

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={`fixed right-3 sm:right-4 top-1/2 -translate-y-1/2 z-40 transition-opacity duration-300 ${
        revealed ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Story sections"
          title="Story sections"
          className="grid place-items-center w-10 h-10 rounded-full bg-card border-2 border-ink shadow-pop hover:-translate-y-0.5 transition-transform"
        >
          {/* Stack-of-lines glyph, echo the three-dot window chrome */}
          <span aria-hidden className="flex flex-col items-end gap-[4px]">
            <span className="h-[3px] w-[18px] rounded-full bg-ink" />
            <span className="h-[3px] w-[12px] rounded-full bg-ink/60" />
            <span className="h-[3px] w-[15px] rounded-full bg-ink/60" />
          </span>
        </button>

        {open && (
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-[min(76vw,300px)]">
            <div className="card p-2 shadow-pop-xl">
              <div className="font-mono text-[10px] font-bold tracking-widest text-subtle px-3 pt-2 pb-1">
                SECTIONS
              </div>
              <div
                ref={panelRef}
                className="toc-strip max-h-[min(60vh,420px)] overflow-y-auto"
              >
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    data-toc={h.id}
                    aria-current={activeId === h.id ? "true" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-start gap-2.5 rounded-xl px-3 py-2 text-[13.5px] leading-snug transition-colors ${
                      activeId === h.id
                        ? "bg-lime/40 font-bold text-ink"
                        : "hover:bg-lime/20"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-[6px] shrink-0 h-2 w-2 rounded-full border-2 border-ink ${
                        activeId === h.id ? "bg-lime" : "bg-transparent"
                      }`}
                    />
                    {h.text}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}