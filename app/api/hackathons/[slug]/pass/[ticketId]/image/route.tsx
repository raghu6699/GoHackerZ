import { ImageResponse } from "next/og";
import { getParticipantByTicket } from "@/lib/hackathons";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// Theme accent colours (must match HackerPassport.tsx)
const THEME_COLORS: Record<string, string> = {
  lime:   "#a3e635",
  purple: "#c084fc",
  sky:    "#38bdf8",
  pink:   "#f472b6",
  amber:  "#fbbf24",
};

function normaliseTheme(t?: string): string {
  if (!t) return "lime";
  const lower = t.toLowerCase().trim();
  if (lower === "neon" || lower === "electric violet" || lower === "purple") return "purple";
  if (lower === "matrix" || lower === "cyan" || lower === "sky") return "sky";
  if (lower === "gold" || lower === "solar gold" || lower === "amber") return "amber";
  if (lower === "pink" || lower === "magenta" || lower === "neon magenta") return "pink";
  if (THEME_COLORS[lower]) return lower;
  return "lime";
}

// Load logo once
let logoDataUrl = "";
try {
  const p = path.join(process.cwd(), "public/logo/neon-terminal-logo-sm.png");
  if (fs.existsSync(p)) {
    logoDataUrl = `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
  }
} catch {/* swallow */}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; ticketId: string }> }
) {
  const { ticketId, slug } = await params;
  const { searchParams } = new URL(req.url);
  // Allow optional theme override via ?theme=purple
  const themeOverride = searchParams.get("theme") || undefined;

  const participant = await getParticipantByTicket(ticketId);
  if (!participant) {
    return new Response("Ticket not found", { status: 404 });
  }

  const themeKey  = normaliseTheme(themeOverride || participant.themeStyle);
  const accent    = THEME_COLORS[themeKey] ?? "#a3e635";
  const name      = participant.name || "Verified Builder";
  const role      = participant.roleTitle || "Builder";
  const ticket    = participant.ticketNumber || ticketId;
  const teamLabel = participant.teamName || "Solo Competitor";
  const isCaptain = participant.isCaptain;
  const hackTitle = "GoHackerz Global Shipathon 2026";

  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Boarding pass image — 940 × 420 px (same visual aspect ratio as the card)
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "940px",
          height: "420px",
          background: "#08090c",
          borderRadius: "20px",
          overflow: "hidden",
          fontFamily: "sans-serif",
          position: "relative",
          border: `1.5px solid ${accent}44`,
        }}
      >
        {/* Left glow */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "340px",
            height: "420px",
            background: `radial-gradient(ellipse at 0% 50%, ${accent}28 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* ── LEFT PANEL ─────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "32px 36px",
            width: "340px",
            flexShrink: 0,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoDataUrl} alt="GoHackerz" width={120} height={28} style={{ objectFit: "contain" }} />
            ) : (
              <span style={{ color: accent, fontSize: "18px", fontWeight: 700, letterSpacing: "2px" }}>
                GOHACKERZ
              </span>
            )}
            <span style={{ color: "#ffffff55", fontSize: "11px", letterSpacing: "3px" }}>
              HACKER PASSPORT — BOARDING PASS
            </span>
          </div>

          {/* Avatar + Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${accent}55, ${accent}22)`,
                border: `2px solid ${accent}88`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 800,
                color: accent,
              }}
            >
              {initials}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ color: "#ffffff", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                {name}
              </span>
              <span style={{ color: accent, fontSize: "12px", fontWeight: 600, letterSpacing: "1.5px" }}>
                {role.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Ticket number */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ color: "#ffffff44", fontSize: "10px", letterSpacing: "2px" }}>TICKET</span>
            <span
              style={{
                fontFamily: "monospace",
                color: accent,
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "2px",
                background: `${accent}15`,
                padding: "4px 10px",
                borderRadius: "6px",
                border: `1px solid ${accent}40`,
              }}
            >
              #{ticket}
            </span>
          </div>
        </div>

        {/* Dashed divider */}
        <div
          style={{
            width: "1px",
            height: "340px",
            alignSelf: "center",
            background: `repeating-linear-gradient(to bottom, ${accent}55 0, ${accent}55 8px, transparent 8px, transparent 16px)`,
            flexShrink: 0,
            display: "flex",
          }}
        />

        {/* ── RIGHT PANEL ─────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "32px 36px",
            flex: 1,
          }}
        >
          {/* Event info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ color: "#ffffff44", fontSize: "10px", letterSpacing: "2px" }}>EVENT</span>
            <span style={{ color: "#ffffff", fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
              {hackTitle}
            </span>
          </div>

          {/* Squad info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ color: "#ffffff44", fontSize: "10px", letterSpacing: "2px" }}>SQUAD</span>
            <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: 600 }}>
              {teamLabel}
            </span>
            {isCaptain && (
              <span
                style={{
                  color: accent,
                  fontSize: "10px",
                  letterSpacing: "2px",
                  fontWeight: 700,
                  background: `${accent}18`,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: `1px solid ${accent}44`,
                  alignSelf: "flex-start",
                }}
              >
                CAPTAIN
              </span>
            )}
          </div>

          {/* Bottom row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            {/* Status badge */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ color: "#ffffff44", fontSize: "10px", letterSpacing: "2px" }}>STATUS</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: `${accent}18`,
                  border: `1px solid ${accent}44`,
                  borderRadius: "6px",
                  padding: "5px 12px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: accent,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: accent, fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px" }}>
                  CONFIRMED
                </span>
              </div>
            </div>

            {/* Watermark */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
              <span style={{ color: "#ffffff22", fontSize: "9px", letterSpacing: "2px" }}>
                BOARDING GATE 42
              </span>
              <span style={{ color: "#ffffff22", fontSize: "9px", letterSpacing: "2px" }}>
                PRIORITY PASSENGER
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: "#ffffff11",
                  fontSize: "9px",
                  letterSpacing: "1px",
                }}
              >
                gohackerz.com
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 940,
      height: 420,
      headers: {
        // Tell browser to download with this filename, not just display
        "Content-Disposition": `attachment; filename="GoHackerz-BoardingPass-${ticket}.png"`,
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
