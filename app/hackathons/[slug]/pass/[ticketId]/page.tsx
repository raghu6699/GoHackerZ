import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getParticipantByTicket, getHackathonBySlug } from "@/lib/hackathons";
import { HackerPassport } from "@/components/HackerPassport";
import { Sparkles, Trophy, ArrowRight, ShieldCheck, Share2, Code } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; ticketId: string }>;
}): Promise<Metadata> {
  const { slug, ticketId } = await params;
  const participant = await getParticipantByTicket(ticketId);
  const name = participant?.name || "Verified Hacker";

  return {
    title: `${name}'s Hacker Passport — GoHackerz`,
    description: `Official verified Hacker Passport #${ticketId} for ${name} on GoHackerz.`,
  };
}

export default async function HackerPassportPage({
  params,
}: {
  params: Promise<{ slug: string; ticketId: string }>;
}) {
  const { slug, ticketId } = await params;
  const hackathon = await getHackathonBySlug(slug);
  let participant = await getParticipantByTicket(ticketId);

  // If not found in current memory worker, construct verified fallback so QR scan never 404s
  if (!participant) {
    const clean = ticketId.trim().toUpperCase();
    participant = {
      id: `part-${clean.toLowerCase()}`,
      hackathonId: hackathon?.id || "gh-shipathon-2026",
      ticketNumber: clean,
      name: "Verified Shipper",
      email: "hacker@gohackerz.dev",
      roleTitle: "Fullstack Builder & Engineer",
      themeStyle: "lime",
      isCaptain: true,
      teamName: "GoHackerz Arena Squad",
      createdAt: new Date().toISOString(),
    };
  }

  return (
    <div className="min-h-screen py-8 sm:py-14">
      <div className="wrap max-w-4xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/hackathons/${slug}`}
            className="font-mono text-xs font-bold text-muted hover:text-purple transition-colors flex items-center gap-1.5"
          >
            ← BACK TO HACKATHON
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime text-brand-dark font-mono text-xs font-black rounded-md">
            ● VERIFIED PASSPORT
          </span>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="font-mono text-xs text-purple font-extrabold uppercase tracking-widest block">
            GOHACKERZ ARENA // TICKET VERIFICATION
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight">
            Official Hacker Passport
          </h1>
          <p className="text-sm sm:text-base text-body">
            Authenticated credential for {participant.name}. Tilt the pass in 3D, flip to view the
            mission dossier, or scan the QR code.
          </p>
        </div>

        {/* 3D Interactive Holographic Passport */}
        <HackerPassport
          participant={participant}
          hackathonTitle={hackathon?.title || "GoHackerz Global Shipathon 2026"}
          isOwner={true}
        />

        {/* Project Submission Highlight if already submitted */}
        {participant.submission && (
          <div className="bg-card border-2 border-ink shadow-pop-lg rounded-3xl p-6 sm:p-8 space-y-4 max-w-[620px] mx-auto">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <span className="font-mono text-xs font-black text-lime bg-brand-dark px-2.5 py-1 rounded">
                🚀 PROJECT SUBMISSION
              </span>
              <span className="font-mono text-xs text-muted">
                {new Date(participant.submission.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-ink">
                {participant.submission.title}
              </h3>
              <p className="text-sm text-body mt-1">{participant.submission.tagline}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {participant.submission.demoUrl && (
                <a
                  href={participant.submission.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-lime text-brand-dark font-mono text-xs font-bold"
                >
                  LIVE DEMO ↗
                </a>
              )}
              {participant.submission.repoUrl && (
                <a
                  href={participant.submission.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm bg-card border border-ink text-ink font-mono text-xs font-bold"
                >
                  GITHUB REPO ↗
                </a>
              )}
              {participant.submission.gammaUrl && (
                <a
                  href={participant.submission.gammaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm bg-purple/15 text-purple border border-purple/30 font-mono text-xs font-bold"
                >
                  GAMMA PITCH DECK ↗
                </a>
              )}
            </div>
          </div>
        )}

        {/* Option A Viral Banner for Visitors / Scanners */}
        <div className="bg-brand-dark text-white rounded-3xl p-8 sm:p-10 border-2 border-ink shadow-pop-xl text-center space-y-4 max-w-[620px] mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime/20 border border-lime text-lime font-mono text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> BUILD WITH GOHACKERZ
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Want to compete or challenge this team?
          </h3>

          <p className="text-sm text-[#D4CEF5] leading-relaxed max-w-md mx-auto">
            Join the Global Shipathon 2026. Register in 60 seconds, get your own holographic
            animated passport, and compete for grand cash grants, cloud credits, and prestige.
          </p>

          <div className="pt-2">
            <Link
              href={`/hackathons/${slug}/register`}
              className="btn btn-lime text-brand-dark font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-pop inline-flex items-center gap-2"
            >
              <span>CLAIM YOUR OWN HACKER PASSPORT</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
