import Link from "next/link";
import type { Metadata } from "next";
import { getAllHackathons } from "@/lib/hackathons";
import { MyPassportBanner } from "@/components/MyPassportBanner";
import { Trophy, Users, Sparkles, ArrowRight, Zap, Flame, Shield, Code, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Hackathons — GoHackerz",
  description:
    "Compete in premier engineering hackathons on GoHackerz. Build bleeding-edge AI & Edge software, earn your animated Holographic Hacker Passport, and win cash prizes.",
};

export default async function HackathonsPage() {
  const hackathons = await getAllHackathons();
  const activeHackathon = hackathons.find((h) => h.status === "ACTIVE") || hackathons[0];

  return (
    <div className="min-h-screen py-8 sm:py-14">
      <div className="wrap max-w-6xl mx-auto space-y-10 sm:space-y-14">
        {/* Active Passport Banner if visitor has already registered */}
        <MyPassportBanner slug={activeHackathon.slug} hackathonId={activeHackathon.id} />

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-brand-dark text-white rounded-3xl p-7 sm:p-14 border-2 border-ink shadow-pop-xl">
          {/* Cyber matrix background accents */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#C6FF3D_1px,transparent_1px)] [background-size:24px_24px]"
            aria-hidden
          />
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime/15 border border-lime text-lime font-mono text-[12px] font-bold tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-lime animate-ping" />
              <span>OFFICIAL GOHACKERZ ARENA</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
              Ship Bleeding-Edge Code. <br />
              <span className="text-lime underline decoration-wavy decoration-purple/60">
                Claim Cash & Glory.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[#D4CEF5] leading-relaxed max-w-2xl">
              Welcome to the official arena for builders who ship. Form a squad, earn your 3D
              holographic Hacker Passport, submit lightweight links, and compete for community
              prestige and top-tier prizes.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={`/hackathons/${activeHackathon.slug}`}
                className="btn btn-lime text-brand-dark font-extrabold text-[15px] px-6 py-3.5 rounded-2xl shadow-pop flex items-center gap-2 group"
              >
                <span>ENTER ACTIVE HACKATHON</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={`/hackathons/${activeHackathon.slug}/register`}
                className="btn bg-purple text-white hover:bg-purple-dark font-bold text-[15px] px-6 py-3.5 rounded-2xl shadow-pop border-2 border-ink"
              >
                CLAIM HACKER PASSPORT 🎫
              </Link>
            </div>
          </div>
        </section>

        {/* Active Flagship Hackathon Card */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Flame className="w-6 h-6 text-purple" />
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                Active Flagship Hackathon
              </h2>
            </div>
            <span className="font-mono text-xs font-bold text-muted uppercase">
              STATUS: LIVE SPRINT
            </span>
          </div>

          <div className="bg-card border-2 border-ink shadow-pop-lg rounded-3xl p-6 sm:p-10 transition-all hover:border-purple">
            <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-8 items-center">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 bg-lime text-brand-dark font-mono text-xs font-extrabold rounded-md shadow-sm">
                    ● ACTIVE NOW
                  </span>
                  <span className="px-3 py-1 bg-purple/15 text-purple font-mono text-xs font-bold rounded-md border border-purple/30">
                    PRIZE POOL: {activeHackathon.prizePool}
                  </span>
                  <span className="px-3 py-1 bg-bg text-subtle font-mono text-xs font-bold rounded-md border border-ink/15">
                    👥 {activeHackathon.participantCount}+ BUILDERS
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
                    {activeHackathon.title}
                  </h3>
                  <p className="text-base sm:text-lg text-body mt-2 leading-relaxed">
                    {activeHackathon.tagline}
                  </p>
                </div>

                {/* Tracks preview */}
                <div className="space-y-2 pt-2">
                  <span className="font-mono text-[11px] font-bold text-subtle uppercase tracking-wider block">
                    COMPETITION TRACKS:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {activeHackathon.tracks.map((t) => (
                      <div
                        key={t.id}
                        className="bg-bg border border-ink/15 p-3 rounded-xl hover:border-purple transition-all"
                      >
                        <div className="font-mono text-xs font-extrabold text-purple">{t.prize}</div>
                        <div className="font-bold text-xs text-ink mt-0.5">{t.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Box */}
              <div className="bg-brand-dark text-white p-6 sm:p-8 rounded-2xl border-2 border-ink space-y-4 shadow-pop text-center lg:text-left">
                <div className="space-y-1">
                  <span className="font-mono text-xs text-lime font-bold uppercase tracking-wider">
                    REGISTRATION OPEN
                  </span>
                  <h4 className="text-xl font-bold text-white">48-Hour Ship Sprint</h4>
                  <p className="text-xs text-[#D4CEF5]">
                    Solo or squad up to 4 members. Get your verified animated ticket with custom QR.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <Link
                    href={`/hackathons/${activeHackathon.slug}/register`}
                    className="w-full btn btn-lime text-brand-dark font-extrabold py-3 rounded-xl shadow-pop text-center block text-sm"
                  >
                    REGISTER & GET PASSPORT ⚡
                  </Link>

                  <Link
                    href={`/hackathons/${activeHackathon.slug}`}
                    className="w-full btn bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl border border-white/20 text-center block text-xs font-mono"
                  >
                    VIEW TRACKS & SCHEDULE →
                  </Link>
                </div>
              </div>
            </div>
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

        {/* Sponsor Banner */}
        <section className="bg-brand-dark text-white rounded-3xl p-8 sm:p-10 border-2 border-ink shadow-pop-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="font-mono text-xs text-lime font-bold uppercase tracking-wider">
              FOR TECH COMPANIES & PROTOCOLS
            </span>
            <h3 className="text-2xl font-extrabold text-white">
              Want to host a hackathon on GoHackerz?
            </h3>
            <p className="text-sm text-[#D4CEF5] max-w-xl">
              Engage thousands of hungry developers who ship production-grade code. Sponsor a track,
              distribute API credits, and hire top talent.
            </p>
          </div>
          <Link
            href="/contact"
            className="btn btn-lime text-brand-dark font-extrabold px-6 py-3 rounded-xl shadow-pop text-sm whitespace-nowrap"
          >
            PARTNER WITH US →
          </Link>
        </section>
      </div>
    </div>
  );
}
