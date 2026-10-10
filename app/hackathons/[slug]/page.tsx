import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHackathonBySlug, getAllSubmissions } from "@/lib/hackathons";
import { MyPassportBanner } from "@/components/MyPassportBanner";
import {
  Trophy,
  Calendar,
  Users,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Gift,
  HelpCircle,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) return { title: "Hackathon Not Found" };

  return {
    title: `${hackathon.title} — GoHackerz`,
    description: hackathon.tagline,
  };
}

export default async function HackathonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);

  if (!hackathon) {
    notFound();
  }

  const submissions = await getAllSubmissions(hackathon.id);

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="wrap max-w-5xl mx-auto space-y-10">
        {/* Active Passport Banner if visitor has already registered */}
        <MyPassportBanner slug={hackathon.slug} hackathonId={hackathon.id} />

        {/* Breadcrumb & Status */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link
            href="/hackathons"
            className="font-mono text-xs font-bold text-muted hover:text-purple transition-colors flex items-center gap-1.5"
          >
            ← BACK TO HACKATHONS
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/hackathons/${hackathon.slug}/admin`}
              className="px-3 py-1 bg-[#1A1440] text-[#C6FF3D] border border-[#7C5CFF]/40 font-mono text-xs font-bold rounded-full hover:bg-[#251f52] transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              ADMIN STUDIO
            </Link>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-black rounded-full shadow-sm ${
                hackathon.status === "ACTIVE"
                  ? "bg-[#E11D48] text-white"
                  : hackathon.status === "JUDGING"
                  ? "bg-amber-500 text-black"
                  : hackathon.status === "COMPLETED"
                  ? "bg-purple text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {hackathon.status === "ACTIVE" && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              )}
              {hackathon.status === "ACTIVE"
                ? "LIVE SPRINT ACTIVE"
                : hackathon.status === "JUDGING"
                ? "JUDGING IN PROGRESS"
                : hackathon.status === "COMPLETED"
                ? "🏆 HACKATHON COMPLETED"
                : "UPCOMING EVENT"}
            </span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-brand-dark text-white rounded-3xl p-7 sm:p-12 border-2 border-ink shadow-pop-xl relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#C6FF3D_1px,transparent_1px)] [background-size:20px_20px]"
            aria-hidden
          />

          <div className="relative z-10 space-y-6 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple/30 border border-purple text-purple-light font-mono text-xs font-bold">
                PRIZE POOL: {hackathon.prizePool}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white font-mono text-xs font-bold">
                👥 {hackathon.participantCount} REGISTERED
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white font-mono text-xs font-bold">
                🛡 {hackathon.teamCount} TEAMS
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {hackathon.title}
            </h1>

            <p className="text-base sm:text-xl text-[#D4CEF5] leading-relaxed">
              {hackathon.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={`/hackathons/${hackathon.slug}/register`}
                className="btn btn-lime text-brand-dark font-extrabold text-[15px] px-6 py-3.5 rounded-2xl shadow-pop flex items-center gap-2"
              >
                <span>GET HACKER PASSPORT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={`/hackathons/${hackathon.slug}/submit`}
                className="btn bg-card text-ink hover:bg-white font-bold text-[15px] px-6 py-3.5 rounded-2xl shadow-pop border-2 border-ink"
              >
                SUBMIT PROJECT 🚀
              </Link>

              {submissions.length > 0 && (
                <Link
                  href={`/hackathons/${hackathon.slug}/submissions`}
                  className="font-mono text-xs text-lime underline hover:text-white pt-2 sm:pt-0"
                >
                  View Showcase Gallery ({submissions.length}) →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tracks & Prizes Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
              Tracks & Cash Prizes ({hackathon.prizePool})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hackathon.tracks.map((track) => (
              <div
                key={track.id}
                className="bg-card border-2 border-ink rounded-3xl p-6 sm:p-7 shadow-pop-sm flex flex-col justify-between hover:border-purple transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-subtle uppercase">
                      TRACK #{track.id.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 bg-lime text-brand-dark font-mono text-xs font-black rounded-md">
                      {track.prize}
                    </span>
                  </div>

                  <h3 className="font-bold text-xl text-ink leading-snug">{track.title}</h3>

                  <p className="text-sm text-body leading-relaxed">{track.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-ink/10 flex flex-wrap gap-1.5">
                  {track.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-bg text-subtle font-mono text-[11px] font-bold rounded-md border border-ink/10"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Schedule & Milestones */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">Schedule & Timeline</h2>
          </div>

          <div className="bg-card border-2 border-ink rounded-3xl p-6 sm:p-8 shadow-pop-sm space-y-4">
            {hackathon.schedule.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-bg border border-ink/10 hover:border-ink transition-all"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-purple/10 text-purple border border-purple/30">
                    {item.time}
                  </span>
                  <div>
                    <h4 className="font-bold text-base text-ink">{item.title}</h4>
                    <p className="text-xs text-subtle mt-0.5">{item.description}</p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                    item.status === "active"
                      ? "bg-lime text-brand-dark animate-pulse"
                      : "bg-ink/5 text-subtle"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Sponsors & Perks */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
              Sponsors & Hacker Perks
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {hackathon.sponsors.map((s, idx) => (
              <div
                key={idx}
                className="bg-card border-2 border-ink rounded-2xl p-5 shadow-pop-sm space-y-2 hover:border-purple transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg text-ink">{s.logoText}</span>
                  <span className="font-mono text-[10px] text-muted font-bold uppercase">
                    {s.tier}
                  </span>
                </div>
                <p className="text-xs text-body leading-relaxed">{s.perk}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hackathon.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-card border-2 border-ink rounded-2xl p-6 shadow-pop-sm space-y-2"
              >
                <h4 className="font-bold text-base text-ink">{faq.q}</h4>
                <p className="text-sm text-body leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Card */}
        <div className="bg-brand-dark text-white rounded-3xl p-8 sm:p-12 border-2 border-ink shadow-pop-xl text-center space-y-4">
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to claim your Hacker Passport?
          </h3>
          <p className="text-sm sm:text-base text-[#D4CEF5] max-w-xl mx-auto">
            Registration takes less than 60 seconds. Form your team, get your scannable passport,
            and build the future.
          </p>
          <div className="pt-2">
            <Link
              href={`/hackathons/${hackathon.slug}/register`}
              className="btn btn-lime text-brand-dark font-extrabold text-base px-8 py-3.5 rounded-2xl shadow-pop inline-flex items-center gap-2"
            >
              <span>REGISTER NOW (FREE)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
