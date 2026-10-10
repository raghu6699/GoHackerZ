"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { HackathonCertificate } from "@/lib/hackathons";
import {
  Printer,
  Share2,
  Check,
  ExternalLink,
  ShieldCheck,
  Award,
  Sparkles,
  Trophy,
} from "lucide-react";

interface CertificateCardProps {
  certificate: HackathonCertificate;
  showActions?: boolean;
}

export function CertificateCard({
  certificate,
  showActions = true,
}: CertificateCardProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const verifyUrl = `${origin || "https://gohackerz.com"}/verify/${certificate.certNumber}`;

  const isWinner =
    certificate.type === "WINNER_FIRST" ||
    certificate.type === "WINNER_SECOND" ||
    certificate.type === "WINNER_THIRD" ||
    certificate.type === "TRACK_WINNER";

  const isFirstPlace = certificate.type === "WINNER_FIRST";
  const isSecondPlace = certificate.type === "WINNER_SECOND";
  const isThirdPlace = certificate.type === "WINNER_THIRD";

  const distinctionText =
    certificate.type === "WINNER_FIRST"
      ? `Grand Champion · 1st Place${certificate.trackName ? ` · ${certificate.trackName}` : ""}`
      : certificate.type === "WINNER_SECOND"
      ? `First Runner-Up · 2nd Place${certificate.trackName ? ` · ${certificate.trackName}` : ""}`
      : certificate.type === "WINNER_THIRD"
      ? `Second Runner-Up · 3rd Place${certificate.trackName ? ` · ${certificate.trackName}` : ""}`
      : certificate.type === "TRACK_WINNER"
      ? `Track Champion${certificate.trackName ? ` · ${certificate.trackName}` : ""}`
      : certificate.awardTitle !== "Certificate of Participation"
      ? certificate.awardTitle
      : "";

  const titleHeading = isWinner
    ? "Certificate of Achievement"
    : certificate.awardTitle || "Certificate of Participation";

  const kicker = isWinner
    ? "GoHackerz · Award of Excellence"
    : `GoHackerz · ${certificate.title || "Engineering Hackathon"}`;

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
    `${certificate.awardTitle} - ${certificate.title}`
  )}&organizationName=GoHackerz&issueYear=${new Date(
    certificate.issuedAt
  ).getFullYear()}&issueMonth=${
    new Date(certificate.issuedAt).getMonth() + 1
  }&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(
    certificate.certNumber
  )}`;

  const tweetText = `Proud to receive my official ${certificate.awardTitle} for the ${certificate.title} on @GoHackerz! 🚀⚡ Check out my verified credential: ${verifyUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweetText
  )}`;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Action Toolbar */}
      {showActions && (
        <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-2xl bg-[#131124] border border-[#2a244d] shadow-xl print:hidden">
          <div className="flex items-center gap-2 text-xs text-[#a59fcf]">
            <ShieldCheck className="w-4 h-4 text-[#C6FF3D]" />
            <span>
              Verifiable ID:{" "}
              <strong className="text-white font-mono">{certificate.certNumber}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-[#201c3b] hover:bg-[#2c2652] text-xs font-semibold text-white border border-[#3b336a] transition-colors flex items-center gap-1.5 shadow-sm"
              title="Print or Save PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#C6FF3D]" />
              Print / Save PDF
            </button>

            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              Add to LinkedIn
            </a>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-[#1D9BF0] hover:bg-[#0c7abf] text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share to X
            </a>

            <button
              onClick={handleCopyLink}
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-[#201c3b] hover:bg-[#2c2652] text-xs font-semibold text-[#C6FF3D] border border-[#3b336a] transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#C6FF3D]" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* The Authentic Certificate Frame */}
      <div className="certificate-shell w-full max-w-4xl">
        <article
          className={`relative isolation-isolate w-full overflow-hidden p-[4.4%_5.2%] bg-white text-[#1A1440] shadow-2xl rounded-sm aspect-[1.414/1] print:aspect-auto print:shadow-none print:w-full print:m-0 print:p-8 ${
            isWinner ? "border-2 border-[#5B3EE8]" : "border border-[#D7D3EA]"
          }`}
          style={{
            fontFamily: '"Space Grotesk", system-ui, sans-serif',
          }}
        >
          {/* Outer & Inner Thin Rules */}
          <div className="absolute inset-[16px] border border-[#7C5CFF] pointer-events-none opacity-80" />
          <div className="absolute inset-[22px] border border-[#D7D3EA] pointer-events-none opacity-90" />

          {/* Corner Ornaments */}
          <span className="absolute top-[16px] left-[16px] w-[32px] h-[32px] border-t-2 border-l-2 border-[#7C5CFF]" />
          <span className="absolute top-[16px] right-[16px] w-[32px] h-[32px] border-t-2 border-r-2 border-[#7C5CFF]" />
          <span className="absolute bottom-[16px] left-[16px] w-[32px] h-[32px] border-b-2 border-l-2 border-[#7C5CFF]" />
          <span className="absolute bottom-[16px] right-[16px] w-[32px] h-[32px] border-b-2 border-r-2 border-[#7C5CFF]" />

          <div className="flex h-full flex-col items-center justify-between text-center relative z-10">
            {/* Top Brand & Metadata Bar */}
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2.5 text-left">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-serif text-lg font-bold border ${
                    isFirstPlace
                      ? "bg-amber-400 text-black border-amber-600 shadow-md"
                      : isWinner
                      ? "bg-[#7C5CFF] text-white border-[#5B3EE8]"
                      : "bg-[#C6FF3D] text-[#1A1440] border-[#1A1440]"
                  }`}
                >
                  {isFirstPlace ? "🏆" : "GH"}
                </div>
                <div>
                  <div className="text-[12px] font-bold tracking-tight text-[#1A1440]">
                    GoHackerz
                  </div>
                  <div className="text-[8px] font-semibold tracking-widest text-[#5B3EE8] uppercase">
                    Build · Ship · Share
                  </div>
                </div>
              </div>

              <div className="text-right font-mono text-[9px] text-[#4A4473]">
                <span>OFFICIAL CREDENTIAL ID</span>
                <strong className="block text-[10px] font-bold text-[#1A1440]">
                  {certificate.certNumber}
                </strong>
              </div>
            </div>

            {/* Main Certificate Typography */}
            <div className="w-full my-auto py-2">
              <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#7C5CFF] mb-1">
                {kicker}
              </p>

              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-normal text-[#1A1440] tracking-tight leading-tight"
                style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
              >
                {titleHeading}
              </h1>

              <div className="flex items-center justify-center gap-3 my-2 text-[#7C5CFF]">
                <div className="w-12 h-px bg-[#7C5CFF]/40" />
                <span className="text-xs">✦</span>
                <div className="w-12 h-px bg-[#7C5CFF]/40" />
              </div>

              <p
                className="text-2xl sm:text-3xl md:text-4xl italic font-normal text-[#1A1440] my-1"
                style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
              >
                {certificate.recipientName}
              </p>

              {certificate.teamName && (
                <p className="text-xs font-medium text-[#7C5CFF] tracking-wide">
                  Squad: <span className="font-bold">{certificate.teamName}</span>
                </p>
              )}

              <p className="max-w-xl mx-auto text-xs sm:text-sm text-[#4A4473] leading-relaxed mt-2">
                is awarded this certificate in recognition of their active participation and contribution to
                <strong className="block text-[#1A1440] font-bold mt-0.5">
                  {certificate.title}
                </strong>
              </p>

              {distinctionText && (
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-[#5B3EE8]/10 text-[#5B3EE8] text-[11px] font-bold tracking-wider uppercase border border-[#5B3EE8]/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  {distinctionText}
                </div>
              )}
            </div>

            {/* Bottom Bar: Signatures, QR Code & Date */}
            <div className="flex w-full items-end justify-between px-2 pt-1 border-t border-[#D7D3EA]/60">
              {/* Director Signature */}
              <div className="w-28 sm:w-36 text-center flex flex-col items-center justify-end">
                <img
                  src="/logo/header-logo.png"
                  alt="GoHackerz"
                  className="h-6 sm:h-7 w-auto object-contain mix-blend-multiply mb-0.5"
                />
                <div className="w-full h-px bg-[#1A1440] my-1" />
                <div className="text-[8px] font-semibold uppercase tracking-wider text-[#4A4473]">
                  Hackathon Director
                </div>
              </div>

              {/* Center Seal & Date */}
              <div className="text-center text-[9px] text-[#4A4473] leading-tight">
                <div>Issued on</div>
                <strong className="text-[#1A1440] text-[10px]">{formattedDate}</strong>
                <div className="text-[8px] text-[#7C5CFF] font-medium truncate max-w-[140px]">{certificate.title || "GoHackerz Arena"}</div>
              </div>

              {/* QR Verification Code */}
              <div className="flex flex-col items-center gap-1">
                <div className="p-1 bg-white border border-[#D7D3EA] rounded shadow-xs">
                  <QRCodeSVG value={verifyUrl} size={44} level="M" />
                </div>
                <div className="text-[7px] font-mono tracking-tight text-[#4A4473]">
                  SCAN TO VERIFY
                </div>
              </div>
            </div>
          </div>

          {/* Tamper Seal watermark */}
          <div className="absolute right-[32px] bottom-[28px] text-[7px] font-mono text-[#4A4473]/60 tracking-wider pointer-events-none print:hidden">
            SECURE VERIFIABLE HASH · GOHACKERZ ORG
          </div>
        </article>
      </div>
    </div>
  );
}
