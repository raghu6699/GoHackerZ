import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getParticipantByTicket, getHackathonBySlug } from "@/lib/hackathons";
import { generateQrMatrix } from "@/lib/qr";

export const runtime = "nodejs";

const THEME_COLORS: Record<string, string> = {
  lime: "#a3e635",
  purple: "#c084fc",
  sky: "#38bdf8",
  pink: "#f472b6",
  amber: "#fbbf24",
};

function normaliseTheme(theme?: string): string {
  if (!theme) return "lime";
  const lower = theme.toLowerCase().trim();
  if (["neon", "electric violet", "purple"].includes(lower)) return "purple";
  if (["matrix", "cyan", "sky"].includes(lower)) return "sky";
  if (["gold", "solar gold", "amber"].includes(lower)) return "amber";
  if (["pink", "magenta", "neon magenta"].includes(lower)) return "pink";
  return THEME_COLORS[lower] ? lower : "lime";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; ticketId: string }> }
) {
  const { ticketId, slug } = await params;
  const { searchParams } = new URL(req.url);
  const [participant, hackathon] = await Promise.all([
    getParticipantByTicket(ticketId),
    getHackathonBySlug(slug),
  ]);
  if (!participant) return new Response("Ticket not found", { status: 404 });

  const cleanSlug = slug.replace(/^gh-/, "");
  const eventTitle = hackathon?.title || (cleanSlug ? cleanSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "GoHackerz Hackathon");
  const flightNo = `GH-${cleanSlug ? cleanSlug.toUpperCase().slice(0, 8) : "2026"}`;
  
  let formattedDate = "12 OCT 2026";
  if (participant.createdAt) {
    try {
      const d = new Date(participant.createdAt);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
      }
    } catch {}
  }

  const accent = THEME_COLORS[normaliseTheme(searchParams.get("theme") || participant.themeStyle)];
  const name = participant.name || "Verified Builder";
  const role = participant.roleTitle || "Fullstack & AI Engineer";
  const ticket = participant.ticketNumber || ticketId;
  const team = participant.teamName
    ? `${participant.teamName}${participant.teamCode ? ` [${participant.teamCode}]` : ""}`
    : "Solo Competitor";
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const passportUrl = `${new URL(req.url).origin}/hackathons/${slug}/pass/${ticket}`;
  const qr = generateQrMatrix(passportUrl);
  let barcodeHash = 0;
  for (const char of ticket) barcodeHash = (barcodeHash * 31 + char.charCodeAt(0)) % 100000;
  const barcode = Array.from({ length: 44 }, (_, index) => {
    const value = (barcodeHash * (index + 13)) % 10;
    return { width: (value % 3) + 1.5, gap: (value % 2) + 1.5 };
  });

  return new ImageResponse(
    <div style={{ display: "flex", width: "1200px", height: "620px", color: "#fff", fontFamily: "sans-serif", background: "linear-gradient(145deg, #111218 0%, #171923 50%, #0d0e13 100%)", border: "1px solid #ffffff22", borderRadius: "28px", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "36px 40px", background: `radial-gradient(ellipse at 0% 50%, ${accent}18 0%, transparent 65%)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ffffff22", paddingBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "12px", background: accent, color: "#090d0b", fontSize: "24px", fontWeight: 900 }}>GH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ color: "#ffffff88", fontSize: "11px", letterSpacing: "2px", fontWeight: 700 }}>GOHACKERZ AIRWAYS // SPACEPORT</span>
              <span style={{ color: "#fff", fontSize: "21px", fontWeight: 900 }}>{eventTitle.toUpperCase()}</span>
            </div>
          </div>
          <span style={{ color: accent, border: `1px solid ${accent}66`, background: `${accent}18`, borderRadius: "20px", padding: "9px 13px", fontSize: "11px", fontWeight: 800 }}>FIRST CLASS BUILDER</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ color: "#ffffff66", fontSize: "11px", letterSpacing: "2px" }}>ORIGIN (DEV)</span>
            <span style={{ color: "#fff", fontSize: "38px", fontWeight: 900 }}>LOCAL</span>
            <span style={{ color: "#ffffff99", fontSize: "12px" }}>Localhost:3000</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "220px" }}>
            <span style={{ color: "#ffffff99", fontSize: "10px", letterSpacing: "2px" }}>PROD SHIP</span>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <div style={{ height: "2px", flex: 1, background: "#ffffff44" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", margin: "0 8px", borderRadius: "50%", background: accent, color: "#090d0b", fontSize: "11px", fontWeight: 900 }}>GH</div>
              <div style={{ height: "2px", flex: 1, background: "#ffffff44" }} />
            </div>
            <span style={{ color: "#ffffff66", fontSize: "9px", letterSpacing: "1px" }}>NON-STOP GLOBAL</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
            <span style={{ color: "#ffffff66", fontSize: "11px", letterSpacing: "2px" }}>DESTINATION (PROD)</span>
            <span style={{ color: accent, fontSize: "38px", fontWeight: 900 }}>SHIP</span>
            <span style={{ color: "#ffffff99", fontSize: "12px" }}>Production Cloud</span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", background: "#ffffff0d", border: "1px solid #ffffff22", borderRadius: "16px", padding: "12px 6px" }}>
          {[
            ["PASSENGER NAME", name.toUpperCase()], ["FLIGHT NO.", flightNo], ["BOARDING GATE", "GATE B-42"], ["SEAT / TIER", "01A (PRIORITY)"],
            ["SQUAD ALLIANCE", team], ["TRACK / ROLE", role], ["DATE & DEPARTURE", formattedDate], ["STATUS", "BOARDING"],
          ].map(([label, value], index) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "6px", width: "25%", padding: "9px 10px", borderRight: index % 4 === 3 ? "none" : "1px solid #ffffff12" }}>
              <span style={{ color: "#ffffff66", fontSize: "8px", letterSpacing: "1px" }}>{label}</span>
              <span style={{ color: label === "BOARDING GATE" ? accent : label === "STATUS" ? "#34d399" : "#fff", fontSize: "11px", fontWeight: 800, overflow: "hidden", whiteSpace: "nowrap" }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderTop: "1px solid #ffffff22", paddingTop: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ color: "#ffffff66", fontSize: "8px", letterSpacing: "2px" }}>PASSENGER TICKET</span>
            <span style={{ color: accent, fontFamily: "monospace", fontSize: "15px", fontWeight: 800 }}>#{ticket}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
            <div style={{ display: "flex", alignItems: "stretch", height: "34px" }}>
              {barcode.map((bar, index) => <div key={index} style={{ width: `${bar.width}px`, marginRight: `${bar.gap}px`, background: "#ffffffdd" }} />)}
            </div>
            <span style={{ color: "#ffffff77", fontSize: "8px", letterSpacing: "2px" }}>*{ticket}*</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "360px", padding: "36px 28px", background: "#08090caa", borderLeft: "1px dashed #ffffff44" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ color: "#ffffff66", fontSize: "9px", letterSpacing: "2px" }}>PASSENGER STUB</span>
          <span style={{ color: "#fff", fontSize: "15px", fontWeight: 800 }}>FLIGHT GH-2026</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#ffffff0d", border: "1px solid #ffffff22", borderRadius: "12px", padding: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "10px", background: `${accent}22`, border: `1px solid ${accent}66`, color: accent, fontSize: "17px", fontWeight: 900 }}>{initials}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: 800 }}>{name}</span>
            <span style={{ color: "#ffffff99", fontSize: "9px" }}>{role} · #{ticket}</span>
            <span style={{ color: "#34d399", fontSize: "8px", fontWeight: 800 }}>GATE VERIFIED</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", alignSelf: "center", padding: "11px", background: "#fff", borderRadius: "14px" }}>
          {qr.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: "flex", height: `${145 / qr.length}px` }}>
              {row.map((dark, columnIndex) => <div key={columnIndex} style={{ width: `${145 / qr.length}px`, background: dark ? "#0d0e13" : "#fff" }} />)}
            </div>
          ))}
          <span style={{ color: "#2c2f38", fontSize: "8px", fontWeight: 900, letterSpacing: "2px" }}>SCAN TO BOARD</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ffffff22", paddingTop: "14px" }}>
          {[["GATE", "B-42"], ["SEAT", "01A"], ["BOARD", "GRP 1"]].map(([label, value]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
              <span style={{ color: "#ffffff66", fontSize: "8px" }}>{label}</span>
              <span style={{ color: label === "SEAT" ? accent : "#fff", fontSize: "12px", fontWeight: 900 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 620,
      headers: {
        "Content-Disposition": `attachment; filename="GoHackerz-BoardingPass-${ticket}.png"`,
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}