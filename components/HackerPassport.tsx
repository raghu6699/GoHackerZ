"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { QrCode } from "./QrCode";
import {
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  ShieldCheck,
  Code2,
  Plane,
  Radio,
  ExternalLink,
  Wifi,
  Sparkle,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import type { HackathonParticipant, HackathonTheme } from "@/lib/hackathons";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */
interface HackerPassportProps {
  participant: HackathonParticipant;
  hackathonTitle: string;
  isOwner: boolean;
  /** Route slug, e.g. "gh-shipathon-2026" */
  slug?: string;
  /** Ticket id, e.g. "GH-2026-X89B" */
  ticketId?: string;
  onThemeChange?: (t: HackathonTheme) => void;
}

/* ------------------------------------------------------------------ */
/*  Braille encoding                                                    */
/* ------------------------------------------------------------------ */
const BRAILLE_LETTERS: Record<string, string> = {
  a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓",
  i: "⠊", j: "⠚", k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏",
  q: "⠟", r: "⠗", s: "⠎", t: "⠞", u: "⠥", v: "⠧", w: "⠺", x: "⠭",
  y: "⠽", z: "⠵",
};
const BRAILLE_DIGITS = ["⠚","⠁","⠃","⠉","⠙","⠑","⠋","⠛","⠓","⠊"];

export function nameToBraille(input: string): string {
  let out = "";
  let inNum = false;
  for (const raw of input) {
    const ch = raw.toLowerCase();
    if (/[0-9]/.test(ch)) {
      if (!inNum) { out += "⠼"; inNum = true; }
      out += BRAILLE_DIGITS[parseInt(ch, 10)];
    } else if (/[a-z]/.test(ch)) {
      inNum = false;
      if (raw !== ch) out += "⠠";
      out += BRAILLE_LETTERS[ch];
    } else {
      inNum = false;
      out += raw === " " ? "⠀" : raw;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Theme Styling for Boarding Pass                                    */
/* ------------------------------------------------------------------ */
type ThemeKey = "lime" | "purple" | "sky" | "pink" | "amber";

interface ThemeStyle {
  name: string;
  accent: string;
  accentGlow: string;
  accentBg: string;
  accentBorder: string;
  badgeBg: string;
  badgeText: string;
  hologram: string;
}

const THEMES: Record<ThemeKey, ThemeStyle> = {
  lime: {
    name: "Cyber Lime",
    accent: "#a3e635",
    accentGlow: "rgba(163, 230, 53, 0.35)",
    accentBg: "rgba(163, 230, 53, 0.08)",
    accentBorder: "rgba(163, 230, 53, 0.4)",
    badgeBg: "#a3e635",
    badgeText: "#090d0b",
    hologram: "linear-gradient(135deg, #a3e635 0%, #38bdf8 50%, #facc15 100%)",
  },
  purple: {
    name: "Electric Violet",
    accent: "#c084fc",
    accentGlow: "rgba(192, 132, 252, 0.35)",
    accentBg: "rgba(192, 132, 252, 0.08)",
    accentBorder: "rgba(192, 132, 252, 0.4)",
    badgeBg: "#c084fc",
    badgeText: "#0d0914",
    hologram: "linear-gradient(135deg, #c084fc 0%, #f472b6 50%, #60a5fa 100%)",
  },
  sky: {
    name: "Supersonic Cyan",
    accent: "#38bdf8",
    accentGlow: "rgba(56, 189, 248, 0.35)",
    accentBg: "rgba(56, 189, 248, 0.08)",
    accentBorder: "rgba(56, 189, 248, 0.4)",
    badgeBg: "#38bdf8",
    badgeText: "#061017",
    hologram: "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #34d399 100%)",
  },
  pink: {
    name: "Neon Magenta",
    accent: "#f472b6",
    accentGlow: "rgba(244, 114, 182, 0.35)",
    accentBg: "rgba(244, 114, 182, 0.08)",
    accentBorder: "rgba(244, 114, 182, 0.4)",
    badgeBg: "#f472b6",
    badgeText: "#17060e",
    hologram: "linear-gradient(135deg, #f472b6 0%, #fb923c 50%, #a855f7 100%)",
  },
  amber: {
    name: "Solar Gold",
    accent: "#fbbf24",
    accentGlow: "rgba(251, 191, 36, 0.35)",
    accentBg: "rgba(251, 191, 36, 0.08)",
    accentBorder: "rgba(251, 191, 36, 0.4)",
    badgeBg: "#fbbf24",
    badgeText: "#140e04",
    hologram: "linear-gradient(135deg, #fbbf24 0%, #f87171 50%, #38bdf8 100%)",
  },
};

/* ------------------------------------------------------------------ */
/*  Procedural Barcode Generator (SVG)                                */
/* ------------------------------------------------------------------ */
const BarcodePattern = ({ code, height = 48 }: { code: string; height?: number }) => {
  const bars = useMemo(() => {
    let result: { w: number; gap: number }[] = [];
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = (hash * 31 + code.charCodeAt(i)) % 100000;
    }
    for (let i = 0; i < 44; i++) {
      const val = (hash * (i + 13)) % 10;
      const w = (val % 3) + 1.5;
      const gap = (val % 2) + 1.5;
      result.push({ w, gap });
    }
    return result;
  }, [code]);

  return (
    <svg className="w-full" height={height} xmlns="http://www.w3.org/2000/svg">
      <g fill="#ffffff" opacity="0.85">
        {bars.map((bar, idx) => {
          let x = idx * 5.2;
          return <rect key={idx} x={x} y={0} width={bar.w} height={height} rx={0.5} />;
        })}
      </g>
    </svg>
  );
};

export function normalizeTheme(theme?: string): ThemeKey {
  if (!theme) return "lime";
  const lower = theme.toLowerCase().trim();
  if (lower === "neon" || lower === "electric violet" || lower === "purple") return "purple";
  if (lower === "matrix" || lower === "matrix green" || lower === "sky" || lower === "cyan") return "sky";
  if (lower === "gold" || lower === "solar gold" || lower === "prestige gold" || lower === "amber") return "amber";
  if (lower === "pink" || lower === "magenta" || lower === "neon magenta") return "pink";
  if (THEMES[lower as ThemeKey]) return lower as ThemeKey;
  return "lime";
}

/* ================================================================== */
/*  Main Hacker Boarding Pass Component                               */
/* ================================================================== */
export function HackerPassport({
  participant,
  hackathonTitle,
  isOwner,
  slug,
  ticketId,
  onThemeChange,
}: HackerPassportProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeKey>(
    normalizeTheme(participant.themeStyle)
  );

  useEffect(() => {
    if (participant.themeStyle) {
      setActiveTheme(normalizeTheme(participant.themeStyle));
    }
  }, [participant.themeStyle]);

  const theme = THEMES[activeTheme] || THEMES.lime;
  const displayName = participant.name || "Verified Builder";
  const brailleName = useMemo(() => nameToBraille(displayName), [displayName]);
  const activeSlug = slug || participant.hackathonId || "gh-shipathon-2026";
  const activeTicketId = ticketId || participant.ticketNumber || "GH-2026-X89B";

  const passportUrl = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://gohackerz.com";
    return `${origin}/hackathons/${activeSlug}/pass/${activeTicketId}`;
  }, [activeSlug, activeTicketId]);

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleThemeSelect = (key: ThemeKey) => {
    setActiveTheme(key);
    onThemeChange?.(key as HackathonTheme);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(passportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShareX = () => {
    const text = encodeURIComponent(
      `⚡ BOARDING PASS CONFIRMED: Heading to ${hackathonTitle} on @GoHackerz!\n\n🎫 Ticket: #${activeTicketId}\n🚀 Track / Role: ${
        participant.roleTitle || "Fullstack & AI Engineer"
      }\n👥 Squad: ${
        participant.teamName || "Solo Competitor"
      }\n\nScan my official boarding pass →`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(passportUrl)}`,
      "_blank"
    );
  };

  const passRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!passRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(passRef.current, {
        pixelRatio: 3,
        backgroundColor: "#08090c",
      });
      const a = document.createElement("a");
      a.download = `GoHackerz-BoardingPass-${activeTicketId}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      try {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(passRef.current, {
          scale: 3,
          backgroundColor: "#08090c",
          useCORS: true,
        });
        const a = document.createElement("a");
        a.download = `GoHackerz-BoardingPass-${activeTicketId}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      } catch (e) {
        console.error("Download error:", e);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full select-none">
      {/* ─── CONTROLS HEADER ─── */}
      <div className="w-full max-w-[940px] flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-white/70">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accent }} />
            <span>BOARDING GATE 42 • PRIORITY PASSENGER</span>
          </div>
        </div>

        {/* Theme Picker */}
        <div className="flex items-center gap-2 bg-[#12131a] border border-white/10 px-3 py-1.5 rounded-xl shadow-lg">
          <span className="font-mono text-[10px] text-white/50 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" style={{ color: theme.accent }} />
            STYLE:
          </span>
          {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
            const isSelected = activeTheme === key;
            return (
              <button
                key={key}
                type="button"
                title={THEMES[key].name}
                onClick={() => handleThemeSelect(key)}
                className={`w-5 h-5 rounded-full transition-all ${
                  isSelected ? "scale-125 ring-2 ring-white shadow-lg" : "opacity-60 hover:opacity-100"
                }`}
                style={{ backgroundColor: THEMES[key].accent }}
              />
            );
          })}
        </div>
      </div>

      {/* ─── HORIZONTAL BOARDING PASS SPREAD ─── */}
      <div className="w-full flex justify-center py-2 px-1">
        <div
          ref={passRef}
          className="relative w-full max-w-[940px] rounded-3xl overflow-hidden text-white shadow-2xl flex flex-col md:flex-row items-stretch"
          style={{
            background: "linear-gradient(145deg, #111218 0%, #171923 50%, #0d0e13 100%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 30px 80px -15px rgba(0, 0, 0, 0.8), 0 0 40px -10px " + theme.accentGlow,
          }}
        >
          {/* Subtle Background Cyber Grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* ======================================================== */}
          {/* LEFT: MAIN FLIGHT BOARDING PASS                          */}
          {/* ======================================================== */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6 relative z-10">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-md"
                  style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                >
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.25em] text-white/50 uppercase font-black block">
                    GOHACKERZ AIRWAYS // SPACEPORT
                  </span>
                  <span className="font-mono text-sm sm:text-base font-extrabold text-white tracking-wide">
                    GLOBAL SHIPATHON 2026
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] font-black tracking-wider uppercase border"
                  style={{
                    backgroundColor: theme.accentBg,
                    borderColor: theme.accentBorder,
                    color: theme.accent,
                  }}
                >
                  ★ FIRST CLASS BUILDER
                </span>
              </div>
            </div>

            {/* Flight Vector: Origin -> Destination */}
            <div className="grid grid-cols-3 items-center py-2">
              <div>
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest block">
                  ORIGIN (DEV)
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-black text-white tracking-tighter">
                  LOCAL
                </span>
                <span className="font-mono text-[10px] text-white/60 block mt-0.5">
                  Localhost:3000
                </span>
              </div>

              {/* Flight Vector Graphic */}
              <div className="flex flex-col items-center justify-center px-2">
                <span className="font-mono text-[9px] text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  PROD SHIP
                </span>
                <div className="w-full flex items-center gap-1">
                  <div className="h-[2px] flex-1 bg-white/20 rounded-full" />
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: theme.accent, color: theme.badgeText }}
                  >
                    <Plane className="w-3.5 h-3.5 rotate-90" />
                  </div>
                  <div className="h-[2px] flex-1 bg-white/20 rounded-full" />
                </div>
                <span className="font-mono text-[8px] text-white/40 mt-1 uppercase">
                  NON-STOP GLOBAL
                </span>
              </div>

              <div className="text-right">
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest block">
                  DESTINATION (PROD)
                </span>
                <span
                  className="font-mono text-3xl sm:text-4xl font-black tracking-tighter"
                  style={{ color: theme.accent }}
                >
                  SHIP
                </span>
                <span className="font-mono text-[10px] text-white/60 block mt-0.5">
                  Production Cloud
                </span>
              </div>
            </div>

            {/* Passenger & Flight Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div>
                <span className="font-mono text-[8.5px] text-white/40 uppercase tracking-wider block">
                  PASSENGER NAME
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-white truncate block">
                  {displayName.toUpperCase()}
                </span>
              </div>

              <div>
                <span className="font-mono text-[8.5px] text-white/40 uppercase tracking-wider block">
                  FLIGHT NO.
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-white block">
                  GH-2026
                </span>
              </div>

              <div>
                <span className="font-mono text-[8.5px] text-white/40 uppercase tracking-wider block">
                  BOARDING GATE
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-white block" style={{ color: theme.accent }}>
                  GATE B-42
                </span>
              </div>

              <div>
                <span className="font-mono text-[8.5px] text-white/40 uppercase tracking-wider block">
                  SEAT / TIER
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-white block">
                  01A (PRIORITY)
                </span>
              </div>

              <div>
                <span className="font-mono text-[8.5px] text-white/40 uppercase tracking-wider block">
                  SQUAD ALLIANCE
                </span>
                <span className="font-mono text-xs font-bold text-white/90 truncate block">
                  {participant.teamName
                    ? `${participant.teamName}${participant.teamCode ? ` [${participant.teamCode}]` : ""}`
                    : "Solo Competitor"}
                </span>
              </div>

              <div>
                <span className="font-mono text-[8.5px] text-white/40 uppercase tracking-wider block">
                  TRACK / ROLE
                </span>
                <span className="font-mono text-xs font-bold text-white/90 truncate block">
                  {participant.roleTitle || "Fullstack & AI Engineer"}
                </span>
              </div>

              <div>
                <span className="font-mono text-[8.5px] text-white/40 uppercase tracking-wider block">
                  DATE & DEPARTURE
                </span>
                <span className="font-mono text-xs font-bold text-white/90 block">
                  12 OCT 2026
                </span>
              </div>

              <div>
                <span className="font-mono text-[8.5px] text-white/40 uppercase tracking-wider block">
                  STATUS
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  BOARDING
                </span>
              </div>
            </div>

            {/* Bottom Bar: Braille Encoding + 1D Barcode Graphic */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
              {/* Tactile Braille Name Bar */}
              <div className="space-y-0.5">
                <span className="font-mono text-[8px] text-white/40 uppercase tracking-widest block">
                  TACTILE BRAILLE IDENTIFIER:
                </span>
                <p
                  className="font-sans text-xl font-bold tracking-[0.2em] text-white/90 leading-none py-0.5 select-none"
                  title={displayName}
                >
                  {brailleName}
                </p>
              </div>

              {/* 1D Barcode Visual */}
              <div className="w-full sm:w-[220px]">
                <BarcodePattern code={activeTicketId} height={36} />
                <span className="font-mono text-[8px] text-white/40 tracking-[0.25em] text-center block mt-1">
                  *{activeTicketId}*
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PERFORATED NOTCHED DIVIDER (Aviation Tear-Off Strip)      */}
          {/* ======================================================== */}
          <div className="relative hidden md:flex flex-col items-center justify-between py-0 w-8 shrink-0">
            {/* Top Cutout Notch */}
            <div className="w-6 h-6 rounded-full bg-[#08090c] -mt-3 border-b border-white/20 shadow-inner" />

            {/* Dashed Vertical Perforation */}
            <div className="h-full border-r-2 border-dashed border-white/20 my-1" />

            {/* Bottom Cutout Notch */}
            <div className="w-6 h-6 rounded-full bg-[#08090c] -mb-3 border-t border-white/20 shadow-inner" />
          </div>

          {/* Horizontal Divider for Mobile */}
          <div className="relative flex md:hidden items-center justify-between px-0 h-6">
            <div className="w-6 h-6 rounded-full bg-[#08090c] -ml-3 border-r border-white/20" />
            <div className="w-full border-b-2 border-dashed border-white/20 mx-1" />
            <div className="w-6 h-6 rounded-full bg-[#08090c] -mr-3 border-l border-white/20" />
          </div>

          {/* ======================================================== */}
          {/* RIGHT: TEAR-OFF BOARDING PASS STUB (Passenger Receipt)   */}
          {/* ======================================================== */}
          <div
            className="w-full md:w-[280px] p-6 flex flex-col justify-between space-y-4 bg-black/40 relative z-10 shrink-0 border-t md:border-t-0 md:border-l border-white/10"
          >
            {/* Stub Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest block">
                  PASSENGER STUB
                </span>
                <span className="font-mono text-xs font-black text-white">
                  FLIGHT GH-2026
                </span>
              </div>
              <Ticket className="w-4 h-4 text-white/50" />
            </div>

            {/* Avatar & Passenger ID */}
            <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/50 border border-white/20 flex items-center justify-center shrink-0">
                {participant.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={participant.avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-sm font-black" style={{ color: theme.accent }}>
                    {initials}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-white truncate">
                  {displayName}
                </p>
                <p className="font-mono text-[9px] text-white/60 truncate">
                  {participant.roleTitle || "Fullstack & AI Engineer"} · #{participant.ticketNumber || activeTicketId}
                </p>
                <span className="font-mono text-[8px] text-emerald-400 font-bold block">
                  ● GATE VERIFIED
                </span>
              </div>
            </div>

            {/* QR Code Gate Scanner */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-lg">
              <QrCode value={passportUrl} size={110} fgColor="#0d0e13" bgColor="#ffffff" />
              <span className="font-mono text-[8px] text-[#2c2f38] font-black tracking-widest uppercase mt-1.5">
                SCAN TO BOARD
              </span>
            </div>

            {/* Stub Details */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-white/10 font-mono">
              <div>
                <span className="text-[7.5px] text-white/40 block">GATE</span>
                <span className="text-[11px] font-bold text-white">B-42</span>
              </div>
              <div>
                <span className="text-[7.5px] text-white/40 block">SEAT</span>
                <span className="text-[11px] font-bold" style={{ color: theme.accent }}>01A</span>
              </div>
              <div>
                <span className="text-[7.5px] text-white/40 block">BOARD</span>
                <span className="text-[11px] font-bold text-white">GRP 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ACTION BAR (High-Res Export, Share, Copy) ─── */}
      <div className="w-full max-w-[940px] flex flex-wrap items-center justify-between gap-3 px-1 pt-2">
        <div className="flex items-center gap-2">
          {/* Download High-Res PNG Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-bold rounded-xl text-brand-dark transition-all shadow-lg disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: theme.accent }}
          >
            <Download className={`w-4 h-4 ${downloading ? "animate-bounce" : ""}`} />
            <span>{downloading ? "GENERATING BOARDING PASS…" : "DOWNLOAD BOARDING PASS (PNG)"}</span>
          </button>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 px-3.5 py-2.5 font-mono text-xs font-bold rounded-xl bg-[#12131a] border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "COPIED TO CLIPBOARD!" : "COPY VERIFIED LINK"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Share on X */}
          <button
            type="button"
            onClick={handleShareX}
            className="flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-bold rounded-xl bg-black border border-white/20 text-white hover:bg-white/10 transition-all shadow-md cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-sky-400" />
            <span>SHARE ON X</span>
          </button>

          {/* Submit / Edit Project Button */}
          {isOwner && (
            <Link
              href={`/hackathons/${activeSlug}/submit?ticket=${participant.ticketNumber || activeTicketId}`}
              className="flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-bold rounded-xl bg-lime text-brand-dark hover:bg-lime/90 transition-all shadow-md"
            >
              <Code2 className="w-4 h-4" />
              <span>{participant.submission ? "EDIT SUBMISSION" : "SUBMIT PROJECT"}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
