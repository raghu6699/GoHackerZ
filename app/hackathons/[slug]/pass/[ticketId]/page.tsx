import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getParticipantByTicket, getHackathonBySlug, FLAGSHIP_HACKATHON } from "@/lib/hackathons";
import { PassPortPageClient } from "@/components/PassPortPageClient";
import { AlertCircle, ArrowRight, Ticket, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; ticketId: string }>;
}): Promise<Metadata> {
  const { slug, ticketId } = await params;
  const [participant, hackathon] = await Promise.all([
    getParticipantByTicket(ticketId),
    getHackathonBySlug(slug),
  ]);
  const title = participant?.name
    ? `${participant.name}'s Hacker Passport #${participant.ticketNumber} — GoHackerz`
    : `Hacker Passport #${ticketId.toUpperCase()} — GoHackerz`;
  const description = participant?.name
    ? `Official verified Hacker Passport for ${participant.name} (${participant.roleTitle}) on ${hackathon?.title || "GoHackerz Hackathon"}.`
    : `Official verified Hacker Passport #${ticketId.toUpperCase()} on ${hackathon?.title || "GoHackerz Hackathon"}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function HackerPassportPage({
  params,
}: {
  params: Promise<{ slug: string; ticketId: string }>;
}) {
  const { slug, ticketId } = await params;
  const hackathon = await getHackathonBySlug(slug);

  const cleanSlug = slug.replace(/^gh-/, "").toLowerCase();
  const isFlagship =
    cleanSlug === "shipathon-2026" ||
    cleanSlug === "shipathon" ||
    slug === "active" ||
    slug === "current";

  // Try to get participant from server memory or DB
  let participant = await getParticipantByTicket(ticketId);

  // Check if participant is registered for a different hackathon
  if (participant) {
    const pHackId = (participant.hackathonId || "").replace(/^gh-/, "").toLowerCase();
    const matchesThisHackathon = isFlagship
      ? (!pHackId || pHackId === "shipathon-2026" || pHackId === "shipathon")
      : (pHackId === cleanSlug || pHackId === `gh-${cleanSlug}`);

    if (!matchesThisHackathon) {
      const originalSlug = pHackId || "shipathon-2026";
      return (
        <div className="min-h-screen py-8 sm:py-14">
          <div className="wrap max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <Link
                href={`/hackathons/${slug}`}
                className="font-mono text-xs font-bold text-muted hover:text-purple transition-colors flex items-center gap-1.5"
              >
                ← BACK TO {hackathon?.title?.toUpperCase() || slug.toUpperCase()}
              </Link>
            </div>

            <div className="rounded-3xl border-2 border-ink bg-card p-6 sm:p-10 shadow-pop-lg space-y-6 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Different Hackathon Event Pass</span>
              </div>

              <div className="max-w-xl mx-auto space-y-3">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-ink dark:text-white">
                  Ticket #{ticketId.toUpperCase()} Belongs to a Different Event
                </h1>
                <p className="text-sm sm:text-base text-muted leading-relaxed">
                  This Hacker Passport is registered for <strong className="text-ink dark:text-white">{participant.hackathonId || "another hackathon"}</strong>, not for <strong className="text-ink dark:text-white">{hackathon?.title || slug}</strong>. Passports are isolated to each hackathon.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  href={`/hackathons/${originalSlug}/pass/${ticketId}`}
                  className="btn btn-purple font-mono font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>View Passport on Registered Event</span>
                </Link>
                <Link
                  href={`/hackathons/${slug}/register`}
                  className="btn btn-lime text-[#1A1440] font-mono font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Register for {hackathon?.title || slug}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // If not found in server memory, construct a minimal fallback skeleton for client lookup
  if (!participant) {
    const clean = ticketId.trim().toUpperCase();
    participant = {
      id: `part-${clean.toLowerCase()}`,
      hackathonId: hackathon?.id || `gh-${cleanSlug}`,
      ticketNumber: clean,
      name: "",
      email: "",
      roleTitle: "",
      themeStyle: "lime",
      isCaptain: false,
      teamName: "",
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

        {/* Client component: resolves real name from localStorage and handles isOwner logic */}
        <PassPortPageClient
          serverParticipant={participant}
          hackathonTitle={hackathon?.title || "GoHackerz Hackathon"}
          slug={slug}
          ticketId={ticketId}
        />
      </div>
    </div>
  );
}
