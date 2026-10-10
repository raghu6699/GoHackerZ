import Link from "next/link";
import type { Metadata } from "next";
import { getAllHackathons } from "@/lib/hackathons";
import { MyPassportBanner } from "@/components/MyPassportBanner";
import { HostHackathonSection } from "@/components/HostHackathonSection";
import {
  Trophy,
  Users,
  Sparkles,
  ArrowRight,
  Zap,
  Flame,
  Shield,
  Code,
  Calendar,
  Layers,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Hackathons Directory — GoHackerz",
  description:
    "Explore and compete in premier engineering hackathons on GoHackerz. Build bleeding-edge software, earn your animated Holographic Hacker Passport, and win cash prizes.",
};

export default async function HackathonsPage() {
  const hackathons = await getAllHackathons();
  const activeHackathon = hackathons.find((h) => h.status === "ACTIVE") || hackathons[0];
  const isCompleted = activeHackathon?.status === "COMPLETED";
  const isJudging = activeHackathon?.status === "JUDGING";

  const liveCount = hackathons.filter((h) => h.status === "ACTIVE").length;
  const totalBuilders = hackathons.reduce((acc, h) => acc + (h.participantCount || 0), 0);

  return (
    <div className="min-h-screen py-8 sm:py-14">
      <div className="wrap max-w-6xl mx-auto space-y-10 sm:space-y-14">
        {/* Active Passport Banner if visitor has already registered */}
        {activeHackathon && (
          <MyPassportBanner slug={activeHackathon.slug} hackathonId={activeHackathon.id} />
        )}

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-brand-dark text-white rounded-3xl p-7 sm:p-14 border-2 border-ink shadow-pop-xl">
          {/* Cyber matrix background accents */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#C6FF3D_1px,transparent_1px)] [background-size:24px_24px]"
            aria-hidden
          />
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime/15 border border-lime text-lime font-mono text-[12px] font-bold tracking-wider">
              {liveCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-lime animate-ping" />}
              <span>
                {liveCount > 0
                  ? `⚡ ${liveCount} LIVE SPRINT${liveCount > 1 ? "S" : ""} ACTIVE IN ARENA`
                  : "OFFICIAL GOHACKERZ ARENA"}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
              Ship Bleeding-Edge Code. <br />
              <span className="text-lime underline decoration-wavy decoration-purple/60">
                Claim Cash & Glory.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[#D4CEF5] leading-relaxed max-w-2xl">
              Welcome to the premier platform for software engineers who ship. Form a squad, earn
              your 3D holographic Hacker Passport, submit lightweight project links, and compete in
              flagship and partner hackathons.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {activeHackathon && (
                <Link
                  href={`/hackathons/${activeHackathon.slug}`}
                  className="btn btn-lime text-brand-dark font-extrabold text-[15px] px-6 py-3.5 rounded-2xl shadow-pop flex items-center gap-2 group"
                >
                  <span>EXPLORE FEATURED SPRINT</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

              <a
                href="#all-hackathons"
                className="btn bg-purple text-white hover:bg-purple-dark font-bold text-[15px] px-6 py-3.5 rounded-2xl shadow-pop border-2 border-ink"
              >
                VIEW ALL ARENAS ({hackathons.length}) ⚡
              </a>
            </div>

            {/* Live Stats Strip */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="font-mono text-xs text-[#8e88b8] block">ACTIVE & HOSTED ARENAS</span>
                <span className="text-2xl font-black text-white font-mono">{hackathons.length}</span>
              </div>
              <div>
                <span className="font-mono text-xs text-[#8e88b8] block">TOTAL GLOBAL BUILDERS</span>
                <span className="text-2xl font-black text-lime font-mono">
                  {Math.max(1240, totalBuilders)}+
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="font-mono text-xs text-[#8e88b8] block">PRIZES & CASH GRANTS</span>
                <span className="text-2xl font-black text-purple font-mono">$50,000+</span>
              </div>
            </div>
          </div>
        </section>

        {/* Directory Grid: All Live, Upcoming & Partner Hackathons */}
        <section id="all-hackathons" className="space-y-6 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Flame className="w-6 h-6 text-purple" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                  All Hackathon Arenas
                </h2>
                <p className="text-xs sm:text-sm text-muted">
                  Discover active sprints, partner hackathons, and past showcases on GoHackerz
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg rounded-xl border border-ink/15 font-mono text-xs text-subtle">
              <Layers className="w-4 h-4 text-purple" />
              <span>{hackathons.length} Hackathon{hackathons.length !== 1 ? "s" : ""} Available</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {hackathons.map((h) => {
              const hIsCompleted = h.status === "COMPLETED";
              const hIsJudging = h.status === "JUDGING";
              const hIsActive = h.status === "ACTIVE";
              const sponsorName = h.sponsors?.[0]?.name;

              return (
                <div
                  key={h.id || h.slug}
                  className="bg-card border-2 border-ink shadow-pop-lg rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all hover:-translate-y-1 hover:border-purple group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 font-mono text-[11px] font-extrabold rounded-md ${
                            hIsCompleted
                              ? "bg-purple text-white"
                              : hIsJudging
                              ? "bg-amber-400 text-brand-dark"
                              : hIsActive
                              ? "bg-lime text-brand-dark"
                              : "bg-sky text-brand-dark"
                          }`}
                        >
                          {hIsCompleted
                            ? "🏆 CONCLUDED"
                            : hIsJudging
                            ? "⚖️ JUDGING"
                            : hIsActive
                            ? "● LIVE SPRINT"
                            : "📅 UPCOMING"}
                        </span>
                        {sponsorName && sponsorName !== "GoHackerz" && (
                          <span className="px-2 py-0.5 bg-[#141030] text-[#ded8ff] font-mono text-[11px] font-bold rounded-md border border-purple/30">
                            Partner: {sponsorName}
                          </span>
                        )}
                      </div>

                      <span className="px-2.5 py-0.5 bg-purple/10 text-purple font-mono text-[11px] font-black rounded-md border border-purple/20">
                        {h.prizePool}
                      </span>
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <Link href={`/hackathons/${h.slug}`} className="group-hover:text-purple transition-colors">
                        <h3 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                          {h.title}
                        </h3>
                      </Link>
                      <p className="text-xs sm:text-sm text-body mt-1.5 line-clamp-2 leading-relaxed">
                        {h.tagline || h.description}
                      </p>
                    </div>

                    {/* Tracks Preview */}
                    {h.tracks && h.tracks.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="font-mono text-[10px] font-bold text-subtle uppercase tracking-wider block">
                          TRACKS & PRIZES:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {h.tracks.slice(0, 3).map((t) => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 rounded-md bg-bg border border-ink/15 font-mono text-[10px] text-ink font-semibold flex items-center gap-1"
                            >
                              <span className="text-purple font-bold">#</span>
                              <span>{t.title}</span>
                            </span>
                          ))}
                          {h.tracks.length > 3 && (
                            <span className="px-1.5 py-0.5 font-mono text-[10px] text-muted">
                              +{h.tracks.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-6 mt-6 border-t border-ink/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-muted font-mono text-[11px]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-purple" />
                        {h.participantCount || 0} Registered
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hIsCompleted ? (
                        <Link
                          href={`/hackathons/${h.slug}/submissions`}
                          className="btn btn-lime text-brand-dark font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm"
                        >
                          Showcase 🚀
                        </Link>
                      ) : (
                        <Link
                          href={`/hackathons/${h.slug}/register`}
                          className="btn btn-lime text-brand-dark font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm"
                        >
                          Get Passport 🎫
                        </Link>
                      )}

                      <Link
                        href={`/hackathons/${h.slug}`}
                        className="btn bg-bg hover:bg-brand-dark hover:text-white text-ink border border-ink/20 font-mono text-xs px-3 py-2 rounded-xl transition-all"
                      >
                        Enter Arena →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Grid: Differentiator Platform Highlights */}
        <section className="space-y-6 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
              The Pure Builder Experience
            </h2>
            <p className="text-body text-sm sm:text-base">
              Engineered from the ground up to respect developer time and spotlight high-craft
              engineering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-pop-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple/20 border border-purple flex items-center justify-center text-purple font-bold">
                🎫
              </div>
              <h3 className="font-bold text-lg text-ink">Holographic 3D Passports</h3>
              <p className="text-sm text-body leading-relaxed">
                Receive an interactive cyber-boarding pass with custom themes, scannable QR verification,
                and one-click export for Twitter & LinkedIn.
              </p>
            </div>

            <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-pop-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple/20 border border-purple flex items-center justify-center text-purple font-bold">
                ⚡
              </div>
              <h3 className="font-bold text-lg text-ink">Zero-Bloat Submissions</h3>
              <p className="text-sm text-body leading-relaxed">
                No painful multi-gigabyte video uploads. Just drop your GitHub repo, live URL, Gamma
                pitch deck, and YouTube walkthrough.
              </p>
            </div>

            <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-pop-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink/20 border border-pink flex items-center justify-center text-pink font-bold">
                🏆
              </div>
              <h3 className="font-bold text-lg text-ink">Community Credential</h3>
              <p className="text-sm text-body leading-relaxed">
                Winners and shippers receive permanent verified badges on their GoHackerz profile,
                plus direct introductions to sponsors and dev funds.
              </p>
            </div>
          </div>
        </section>

        {/* Host a Hackathon Proposal Section */}
        <HostHackathonSection />
      </div>
    </div>
  );
}
