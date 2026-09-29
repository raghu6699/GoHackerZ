"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { QrCode } from "./QrCode";
import type { HackathonParticipant, HackathonTheme } from "@/lib/hackathons";
import {
  Share2,
  Download,
  RotateCw,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Code2,
  Calendar,
  ShieldCheck,
  Users,
  Trophy,
} from "lucide-react";

interface HackerPassportProps {
  participant: HackathonParticipant;
  hackathonTitle?: string;
  isOwner?: boolean;
  onThemeChange?: (theme: HackathonTheme) => void;
  className?: string;
}

const THEME_CONFIGS: Record<
  HackathonTheme,
  {
    name: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    accent: string;
    glow: string;
    barcodeColor: string;
    cardBg: string;
    hologramGlare: string;
  }
> = {
  lime: {
    name: "Cyber Lime",
    badgeBg: "bg-lime",
    badgeText: "text-brand-dark",
    border: "border-lime/60",
    accent: "#C6FF3D",
    glow: "rgba(198, 255, 61, 0.35)",
    barcodeColor: "#C6FF3D",
    cardBg: "from-[#110D28] via-[#1A1440] to-[#0A071B]",
    hologramGlare:
      "radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.4) 0%, rgba(198,255,61,0.25) 30%, rgba(124,92,255,0.2) 60%, transparent 100%)",
  },
  neon: {
    name: "Hyper Neon",
    badgeBg: "bg-pink",
    badgeText: "text-white",
    border: "border-pink/60",
    accent: "#FF7AC6",
    glow: "rgba(255, 122, 198, 0.4)",
    barcodeColor: "#FF7AC6",
    cardBg: "from-[#1A0926] via-[#2D1245] to-[#0D0414]",
    hologramGlare:
      "radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.4) 0%, rgba(255,122,198,0.3) 30%, rgba(111,211,255,0.2) 65%, transparent 100%)",
  },
  matrix: {
    name: "Matrix Terminal",
    badgeBg: "bg-[#00FF66]",
    badgeText: "text-black",
    border: "border-[#00FF66]/60",
    accent: "#00FF66",
    glow: "rgba(0, 255, 102, 0.35)",
    barcodeColor: "#00FF66",
    cardBg: "from-[#051408] via-[#0A2610] to-[#020A04]",
    hologramGlare:
      "radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.35) 0%, rgba(0,255,102,0.3) 35%, rgba(0,200,80,0.15) 70%, transparent 100%)",
  },
  gold: {
    name: "VIP Gold",
    badgeBg: "bg-[#FFD700]",
    badgeText: "text-black",
    border: "border-[#FFD700]/70",
    accent: "#FFD700",
    glow: "rgba(255, 215, 0, 0.35)",
    barcodeColor: "#FFD700",
    cardBg: "from-[#1F1803] via-[#332705] to-[#120E02]",
    hologramGlare:
      "radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.45) 0%, rgba(255,215,0,0.35) 35%, rgba(255,180,50,0.15) 70%, transparent 100%)",
  },
};

export function HackerPassport({
  participant,
  hackathonTitle = "GoHackerz Global Shipathon 2026",
  isOwner = true,
  onThemeChange,
  className = "",
}: HackerPassportProps) {
  const [currentTheme, setCurrentTheme] = useState<HackathonTheme>(
    participant.themeStyle || "lime"
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // 3D Tilt calculation & Card element refs
  const cardRef = useRef<HTMLDivElement>(null);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = rect.width;
    const height = rect.height;

    // Normalizing between -1 and 1
    const xRel = (x / width - 0.5) * 2;
    const yRel = (y / height - 0.5) * 2;

    const maxTilt = 14;
    setTilt({
      rotateX: -yRel * maxTilt,
      rotateY: xRel * maxTilt,
      glareX: Math.round((x / width) * 100),
      glareY: Math.round((y / height) * 100),
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  }, []);

  const theme = THEME_CONFIGS[currentTheme];
  const ticketUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/hackathons/shipathon-2026/pass/${participant.ticketNumber}`
      : `https://gohackerz.com/hackathons/shipathon-2026/pass/${participant.ticketNumber}`;

  const handleThemeSelect = (t: HackathonTheme) => {
    setCurrentTheme(t);
    onThemeChange?.(t);
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticketUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareX = () => {
    const text = encodeURIComponent(
      `I just secured my official Hacker Passport for the ${hackathonTitle} on @GoHackerz! ⚡\n\nTicket: #${participant.ticketNumber}\nTeam: ${participant.teamName || "Solo Builder"}\n\nClaim your pass or inspect mine here:`
    );
    const url = encodeURIComponent(ticketUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  // High-Resolution True Card PNG Download via html2canvas
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const targetElement = isFlipped ? backCardRef.current : frontCardRef.current;
      if (!targetElement) return;

      const previousTilt = { ...tilt };
      // Temporarily flatten 3D tilt for a pristine straight capture
      setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

      // Small delay for DOM layout settling
      await new Promise((resolve) => setTimeout(resolve, 80));

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(targetElement, {
        scale: 3, // Ultra-sharp 3x retina resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.querySelector("[data-card-container]") as HTMLElement;
          if (clonedCard) {
            clonedCard.style.transform = "none";
          }
          const clonedFront = clonedDoc.querySelector("[data-pass-front]") as HTMLElement;
          if (clonedFront) {
            clonedFront.style.transform = "none";
          }
          const clonedBack = clonedDoc.querySelector("[data-pass-back]") as HTMLElement;
          if (clonedBack) {
            clonedBack.style.transform = "none";
          }
        },
      });

      // Restore user interaction tilt
      setTilt(previousTilt);

      const link = document.createElement("a");
      link.download = `GoHackerz-Passport-${participant.ticketNumber || "Ticket"}${isFlipped ? "-dossier" : ""}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Passport export error:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Theme & Controls Bar */}
      <div className="w-full max-w-[620px] flex flex-wrap items-center justify-between gap-3 mb-5 px-2">
        <div className="flex items-center gap-1.5 bg-brand-dark/90 backdrop-blur-md border border-ink/20 p-1.5 rounded-xl shadow-sm">
          <span className="font-mono text-[11px] text-muted font-bold px-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-lime" /> THEME:
          </span>
          {(["lime", "neon", "matrix", "gold"] as HackathonTheme[]).map((t) => (
            <button
              key={t}
              onClick={() => handleThemeSelect(t)}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg transition-all ${
                currentTheme === t
                  ? "bg-purple text-white shadow-sm border border-white/20"
                  : "text-muted hover:text-white hover:bg-white/10"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="btn btn-sm btn-ghost border border-ink/20 bg-card hover:bg-purple hover:text-white text-ink text-[12px] font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shadow-pop-sm"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{isFlipped ? "VIEW PASSPORT" : "VIEW DOSSIER"}</span>
        </button>
      </div>

      {/* 3D Perspective Card Wrapper */}
      <div
        className="w-full max-w-[620px] perspective-[1200px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={cardRef}
          data-card-container
          style={
            {
              transform: `rotateX(${tilt.rotateX}deg) rotateY(${
                tilt.rotateY + (isFlipped ? 180 : 0)
              }deg)`,
              transformStyle: "preserve-3d",
              transition:
                tilt.rotateX === 0 && tilt.rotateY === 0
                  ? "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)"
                  : "transform 0.08s ease-out",
              "--gx": `${tilt.glareX}%`,
              "--gy": `${tilt.glareY}%`,
            } as React.CSSProperties
          }
          className="relative w-full rounded-3xl border-2 shadow-2xl transition-shadow duration-300"
        >
          {/* ========================================================================= */}
          {/* CARD FRONT: THE HACKER PASSPORT CREDENTIAL */}
          {/* ========================================================================= */}
          <div
            ref={frontCardRef}
            data-pass-front
            className={`w-full rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${theme.cardBg} border-2 ${theme.border} text-white relative overflow-hidden backface-hidden shadow-pop-lg`}
            style={{
              boxShadow: `0 20px 40px -10px ${theme.glow}, 6px 6px 0 #1A1440`,
            }}
          >
            {/* Holographic Iridescent Glare Layer */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 mix-blend-color-dodge transition-opacity duration-300"
              style={{ background: theme.hologramGlare }}
            />

            {/* Subtle Tech Hex/Grid Background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
              aria-hidden
            />

            {/* Left & Right Authentic Boarding Pass Notches */}
            <div className="absolute top-[48%] -left-4 w-8 h-8 rounded-full bg-bg border-r-2 border-ink shadow-inner pointer-events-none" />
            <div className="absolute top-[48%] -right-4 w-8 h-8 rounded-full bg-bg border-l-2 border-ink shadow-inner pointer-events-none" />

            {/* Top Pass Header */}
            <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-6 relative z-10">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full animate-ping"
                  style={{ backgroundColor: theme.accent }}
                />
                <div>
                  <span className="font-mono text-[11px] font-black tracking-widest text-white/70 uppercase block">
                    OFFICIAL HACKER CREDENTIAL
                  </span>
                  <span className="font-bold text-[15px] sm:text-[17px] text-white tracking-tight">
                    {hackathonTitle}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-[10px] text-white/60 tracking-widest uppercase block">
                  PASS CODE
                </span>
                <span
                  className="font-mono font-black text-[15px] sm:text-[17px] px-2 py-0.5 rounded border border-white/20 bg-black/40"
                  style={{ color: theme.accent }}
                >
                  #{participant.ticketNumber}
                </span>
              </div>
            </div>

            {/* Middle Section: Hacker Profile & QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-center mb-6 relative z-10">
              <div className="space-y-4">
                {/* Hacker Call-Sign & Name */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {participant.isCaptain ? "★ TEAM CAPTAIN" : "● SHIPPER"}
                    </span>
                    {participant.submission && (
                      <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-lime text-brand-dark">
                        🚀 PROJECT SUBMITTED
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                    {participant.name}
                  </h3>
                  <p
                    className="font-mono text-[13px] sm:text-[14px] font-semibold mt-0.5"
                    style={{ color: theme.accent }}
                  >
                    // {participant.roleTitle}
                  </p>
                </div>

                {/* Team Info & Handles */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-3.5 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-white/60">ALLIANCE / TEAM:</span>
                    <span className="font-bold text-white">
                      {participant.teamName || "Solo Competitor"}
                    </span>
                  </div>

                  {participant.teamCode && (
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-white/10">
                      <span className="text-white/60">INVITE CODE:</span>
                      <span
                        className="font-bold font-mono tracking-widest px-1.5 py-0.5 rounded bg-black/30"
                        style={{ color: theme.accent }}
                      >
                        {participant.teamCode}
                      </span>
                    </div>
                  )}

                  {participant.teammates && participant.teammates.length > 1 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10">
                      <span className="text-[10px] font-mono text-white/50 block mb-1">
                        SQUAD MEMBERS ({participant.teammates.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {participant.teammates.map((m, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center text-[10px] font-mono bg-white/10 text-white px-2 py-0.5 rounded-md"
                          >
                            👤 {m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Scannable Vector QR Code with Hologram Frame */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/50 border border-white/20 shadow-lg mx-auto sm:mx-0">
                <QrCode
                  value={ticketUrl}
                  size={124}
                  fgColor={theme.accent}
                  bgColor="transparent"
                  className="rounded-lg"
                />
                <span className="font-mono text-[9px] text-white/70 font-bold tracking-widest mt-2">
                  SCAN TO VERIFY
                </span>
                <a
                  href={ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9px] text-white/50 hover:text-white underline mt-0.5"
                >
                  OPEN PASS ↗
                </a>
              </div>
            </div>

            {/* Bottom Barcode with Laser Sweep Scanner */}
            <div className="pt-4 border-t border-dashed border-white/20 relative z-10">
              <div className="flex items-center justify-between font-mono text-[10px] text-white/60 mb-2">
                <span>SECURITY: ENCRYPTED // TIER-1</span>
                <span>GOHACKERZ PLATFORM ID</span>
              </div>

              {/* Cyber Barcode Simulation with Laser Beam */}
              <div className="relative h-10 w-full bg-black/40 rounded-lg overflow-hidden flex items-end justify-between px-3 py-1.5 border border-white/10">
                {/* Horizontal Laser Line Animation */}
                <div
                  className="absolute inset-y-0 w-2.5 blur-[2px] opacity-80 pointer-events-none animate-[marquee_2.8s_ease-in-out_infinite_alternate]"
                  style={{
                    backgroundColor: theme.accent,
                    boxShadow: `0 0 12px ${theme.accent}`,
                  }}
                />

                {/* Barcode Stripes */}
                {Array.from({ length: 48 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-full rounded-sm"
                    style={{
                      width: idx % 3 === 0 ? "3px" : idx % 5 === 0 ? "4px" : "1.5px",
                      backgroundColor: idx % 7 === 0 ? "transparent" : theme.barcodeColor,
                      opacity: idx % 7 === 0 ? 0 : 0.85,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD BACK: MISSION DOSSIER & SCHEDULE */}
          {/* ========================================================================= */}
          <div
            ref={backCardRef}
            data-pass-back
            className={`absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${theme.cardBg} border-2 ${theme.border} text-white backface-hidden [transform:rotateY(180deg)] shadow-pop-lg flex flex-col justify-between overflow-y-auto`}
            style={{
              boxShadow: `0 20px 40px -10px ${theme.glow}, 6px 6px 0 #1A1440`,
            }}
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-lime" />
                  <span className="font-mono text-[13px] font-black tracking-wider uppercase text-white">
                    HACKER MISSION DOSSIER
                  </span>
                </div>
                <span
                  className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-white/20"
                  style={{ color: theme.accent }}
                >
                  #{participant.ticketNumber}
                </span>
              </div>

              {/* Schedule Highlights */}
              <div className="space-y-3 mb-4">
                <span className="font-mono text-[10px] text-white/50 tracking-widest uppercase block">
                  TIMELINE & MILESTONES
                </span>

                <div className="space-y-2 text-[12px] font-mono">
                  <div className="flex items-start gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                    <span className="text-lime font-bold">01</span>
                    <div>
                      <div className="font-bold text-white">Hacking Sprint Kickoff</div>
                      <div className="text-[11px] text-white/70">
                        Day 1 · 09:00 UTC · Timer begins
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                    <span className="text-sky font-bold">02</span>
                    <div>
                      <div className="font-bold text-white">Soft Submission & Pitch Polish</div>
                      <div className="text-[11px] text-white/70">
                        Gamma pitch decks & demo video links
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                    <span className="text-pink font-bold">03</span>
                    <div>
                      <div className="font-bold text-white">Submission Lock & Grand Demos</div>
                      <div className="text-[11px] text-white/70">
                        Judging deliberation & trophy awards
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secret Hacker Perks */}
              <div className="bg-black/30 border border-white/15 p-3 rounded-2xl mb-3">
                <span className="font-mono text-[10px] text-lime font-bold uppercase block mb-1">
                  🎁 HACKER PERKS UNLOCKED
                </span>
                <p className="text-[12px] text-white/80 leading-relaxed font-mono">
                  • 100K Supabase Vector credits
                  <br />• Vercel Edge compute deployment tier
                  <br />• Official Verified Shipper badge on GoHackerz profile
                </p>
              </div>
            </div>

            {/* Flip Back CTA */}
            <div className="pt-3 border-t border-white/15 flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/50">
                CLICK TO RETURN TO PASSPORT
              </span>
              <button
                onClick={() => setIsFlipped(false)}
                className="font-mono text-[11px] font-bold text-lime underline hover:text-white"
              >
                RETURN TO FRONT →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="w-full max-w-[620px] flex flex-wrap items-center justify-between gap-3 mt-6">
        <div className="flex items-center gap-2">
          {/* Download Image Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn-sm bg-card text-ink border-2 border-ink hover:bg-purple hover:text-white font-mono text-[12px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl shadow-pop-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? "GENERATING..." : "DOWNLOAD PASS (PNG)"}</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className="btn btn-sm bg-card text-ink border-2 border-ink hover:bg-lime hover:text-brand-dark font-mono text-[12px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl shadow-pop-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-lime" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "COPIED URL!" : "COPY LINK"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Share on X */}
          <button
            onClick={handleShareX}
            className="btn btn-sm bg-[#000000] text-white border-2 border-ink hover:bg-black/80 font-mono text-[12px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl shadow-pop-sm transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-sky" />
            <span>SHARE ON X</span>
          </button>

          {/* Submit Link if owner */}
          {isOwner && (
            <Link
              href={`/hackathons/shipathon-2026/submit?ticket=${participant.ticketNumber}`}
              className="btn btn-sm btn-purple font-mono text-[12px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl shadow-pop-sm"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{participant.submission ? "EDIT SUBMISSION" : "SUBMIT PROJECT"}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
