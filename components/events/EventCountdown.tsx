"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

/** Live countdown to the event start, switching to "live now" and "ended" states. */
export function EventCountdown({ start, end }: { start: string; end: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();

  if (now !== null && now >= endMs) {
    return (
      <div className="font-mono text-sm font-bold uppercase tracking-widest text-white/60">
        The build day has ended
      </div>
    );
  }
  if (now !== null && now >= startMs) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#C6FF3D]/50 bg-[#C6FF3D]/10 px-4 py-2 font-mono text-sm font-black uppercase tracking-widest text-[#C6FF3D]">
        <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[#C6FF3D]" /> Live now
      </div>
    );
  }

  const p = now === null ? null : parts(startMs - now);
  const cells: [string, string][] = [
    [p ? String(p.d) : "--", "days"],
    [p ? String(p.h).padStart(2, "0") : "--", "hours"],
    [p ? String(p.m).padStart(2, "0") : "--", "min"],
    [p ? String(p.s).padStart(2, "0") : "--", "sec"],
  ];

  return (
    <div className="flex flex-col items-center gap-2" aria-label="Time until the event starts">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">Starts in</div>
      <div className="flex items-center gap-2 sm:gap-3">
        {cells.map(([n, l]) => (
          <div key={l} className="min-w-[64px] rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-md sm:min-w-[78px]">
            <div className="text-2xl font-black tabular-nums text-white sm:text-3xl">{n}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/45">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
