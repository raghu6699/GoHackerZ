import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getParticipantByTicket, getHackathonBySlug } from "@/lib/hackathons";
import { PassPortPageClient } from "@/components/PassPortPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; ticketId: string }>;
}): Promise<Metadata> {
  const { ticketId } = await params;
  const participant = await getParticipantByTicket(ticketId);
  const title = participant?.name
    ? `${participant.name}'s Hacker Passport #${participant.ticketNumber} — GoHackerz`
    : `Hacker Passport #${ticketId.toUpperCase()} — GoHackerz`;
  const description = participant?.name
    ? `Official verified Hacker Passport for ${participant.name} (${participant.roleTitle}) on GoHackerz Global Shipathon 2026.`
    : `Official verified Hacker Passport #${ticketId.toUpperCase()} on GoHackerz Global Shipathon 2026.`;

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

  // Try to get participant from server memory (works if same worker)
  let participant = await getParticipantByTicket(ticketId);

  // If not found in server memory, construct a minimal fallback skeleton.
  // The CLIENT component will OVERRIDE this with real data from localStorage.
  if (!participant) {
    const clean = ticketId.trim().toUpperCase();
    participant = {
      id: `part-${clean.toLowerCase()}`,
      hackathonId: hackathon?.id || "gh-shipathon-2026",
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
          hackathonTitle={hackathon?.title || "GoHackerz Global Shipathon 2026"}
          slug={slug}
          ticketId={ticketId}
        />
      </div>
    </div>
  );
}
