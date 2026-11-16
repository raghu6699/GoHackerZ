import Link from "next/link";
import { Trophy, Award, Sparkles } from "lucide-react";
import type { HackathonCertificate } from "@/lib/hackathons";

const MEDAL: Record<string, { label: string; bg: string }> = {
  WINNER_FIRST: { label: "1st place", bg: "linear-gradient(135deg,#FFE27A,#E8A91A)" },
  WINNER_SECOND: { label: "2nd place", bg: "linear-gradient(135deg,#F3F5FB,#AEB6CC)" },
  WINNER_THIRD: { label: "3rd place", bg: "linear-gradient(135deg,#F0B27A,#B86B2C)" },
};

const ORDER = ["WINNER_FIRST", "WINNER_SECOND", "WINNER_THIRD", "TRACK_WINNER", "HONORABLE_MENTION"];

/** Public results for a concluded event. Participation certificates are not winners. */
export function WinnersSection({
  certificates,
  dark = false,
  hackathonTitle,
}: {
  certificates: HackathonCertificate[];
  dark?: boolean;
  hackathonTitle: string;
}) {
  const winners = certificates
    .filter((c) => c.type !== "PARTICIPATION")
    .sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));

  const card = dark
    ? "border-white/10 bg-white/[0.05] text-white"
    : "border-ink bg-card text-ink shadow-pop-sm";
  const sub = dark ? "text-white/60" : "text-subtle";

  return (
    <section id="winners" className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className={`w-6 h-6 ${dark ? "text-[#C6FF3D]" : "text-purple"}`} />
        <h2 className={`text-2xl sm:text-3xl font-extrabold ${dark ? "text-white" : "text-ink"}`}>Winners</h2>
      </div>

      {winners.length === 0 ? (
        <p className={`text-sm ${sub}`}>
          {hackathonTitle} has concluded. The winners will be announced here very soon.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {winners.map((w) => {
            const medal = MEDAL[w.type];
            return (
              <div key={w.certNumber} className={`rounded-2xl border-2 p-5 ${card}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    style={{ background: medal?.bg ?? (dark ? "#7C5CFF" : "#C6FF3D") }}
                  >
                    {medal ? <Trophy className="w-5 h-5 text-[#1A1440]" /> : w.type === "TRACK_WINNER" ? <Award className="w-5 h-5 text-[#1A1440]" /> : <Sparkles className="w-5 h-5 text-[#1A1440]" />}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold leading-tight">{w.awardTitle}</div>
                    {w.trackName && <div className={`font-mono text-[11px] ${sub}`}>{w.trackName}</div>}
                  </div>
                </div>
                <div className="text-lg font-black">{w.recipientName}</div>
                {w.teamName && <div className={`text-sm ${sub}`}>Squad: {w.teamName}</div>}
                {w.projectName && <div className={`text-sm ${sub}`}>Project: {w.projectName}</div>}
                <Link
                  href={`/verify/${w.certNumber}`}
                  className={`mt-3 inline-block font-mono text-[11px] font-bold hover:underline ${dark ? "text-[#C6FF3D]" : "text-purple"}`}
                >
                  Verify certificate →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
