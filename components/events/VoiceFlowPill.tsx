"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Create a screen where a farmer can ask today's tomato price in Telugu.",
  "Add a bill total and a one-tap WhatsApp share for the shopkeeper.",
  "Explain this prescription in simple Hindi, with timings for each tablet.",
  "Make the form fill itself from what the citizen says. Then show a summary.",
  "Now add a loading state and make the buttons bigger for thumbs.",
];

/** A Flow-style dictation pill: waveform + text that "types itself" as if spoken. */
export function VoiceFlowPill() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    try {
      setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {}
  }, []);

  useEffect(() => {
    if (reduced) return;
    const phrase = PHRASES[phraseIdx];
    if (chars < phrase.length) {
      const t = setTimeout(() => setChars((c) => c + 1), 38);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setChars(0);
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
    }, 2200);
    return () => clearTimeout(t);
  }, [chars, phraseIdx, reduced]);

  const text = reduced ? PHRASES[0] : PHRASES[phraseIdx].slice(0, chars);
  const speaking = !reduced && chars < PHRASES[phraseIdx].length;

  return (
    <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-white/[0.06] p-4 sm:p-5 backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(124,92,255,0.55)]">
      <div className="flex items-center gap-3 rounded-full bg-black/40 border border-white/10 px-4 py-2.5">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C6FF3D] text-[#1A1440]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
          </svg>
        </span>
        <div className="flex h-6 flex-1 items-center gap-[3px]" aria-hidden>
          {Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-[#B9A7FF]"
              style={{
                height: speaking ? undefined : 4,
                animation: speaking ? `bb-wave 900ms ease-in-out ${(i % 9) * 70}ms infinite alternate` : undefined,
                opacity: speaking ? 1 : 0.4,
              }}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/50 hidden sm:block">
          {speaking ? "Listening" : "Done"}
        </span>
      </div>

      <p className="mt-4 min-h-[3.5rem] px-1 text-left text-base sm:text-lg leading-relaxed text-white/90">
        {text}
        {speaking && <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-1 animate-pulse bg-[#C6FF3D]" />}
      </p>

      <style>{`
        @keyframes bb-wave { from { height: 4px; } to { height: 22px; } }
      `}</style>
    </div>
  );
}
