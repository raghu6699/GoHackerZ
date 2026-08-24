"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "gh-reading-zoom";
const MIN = 0.85;
const MAX = 1.3;
const STEP = 0.05;

function clamp(v: number): number {
  return Math.round(Math.min(MAX, Math.max(MIN, v)) * 100) / 100;
}

/**
 * Reader-controlled article text size (85%–130%).
 * Writes a --reading-zoom custom property that .reading consumes via calc();
 * choice persists across visits in localStorage.
 */
export function TextSizeControl() {
  const [zoom, setZoom] = useState(1);
  const [loaded, setLoaded] = useState(false);

  // Restore saved preference once on mount.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? parseFloat(raw) : NaN;
    setZoom(!isNaN(saved) ? clamp(saved) : 1);
    setLoaded(true);
  }, []);

  // Push the current scale into CSS.
  useEffect(() => {
    document.documentElement.style.setProperty("--reading-zoom", String(zoom));
  }, [zoom]);

  // Persist (but never overwrite the stored value with pre-load defaults).
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(zoom));
    } catch {
      /* private mode — sizing still works this session */
    }
  }, [zoom, loaded]);

  return (
    <div
      role="group"
      aria-label="Text size"
      className="inline-flex items-center gap-1 bg-card border-2 border-ink rounded-full shadow-pop-sm px-1.5 py-0.5 font-mono text-[12px] font-bold select-none"
    >
      <button
        type="button"
        onClick={() => setZoom((z) => clamp(z - STEP))}
        disabled={zoom <= MIN}
        title="Smaller text"
        aria-label="Decrease text size"
        className="w-7 h-7 rounded-full hover:bg-bg transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
      >
        A−
      </button>
      <span className="w-11 text-center text-subtle tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={() => setZoom((z) => clamp(z + STEP))}
        disabled={zoom >= MAX}
        title="Larger text"
        aria-label="Increase text size"
        className="w-7 h-7 rounded-full hover:bg-bg transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
      >
        A+
      </button>
    </div>
  );
}
