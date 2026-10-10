import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentDbUser } from "@/lib/profile";
import { getHackathonBySlug, getParticipantByEmail, FLAGSHIP_HACKATHON } from "@/lib/hackathons";
import { HackathonRegisterClient } from "@/components/HackathonRegisterClient";
import { Lock, Ticket, Trophy, UserCheck, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Register for Hackathon — GoHackerz",
  description: "Register for GoHackerz hackathons, form a squad, and mint your 3D Holographic Hacker Passport.",
};

export default async function HackathonRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const teamParam = sp.team || sp.invite || sp.code || sp.join;
  const nextParam = teamParam
    ? `/hackathons/${slug}/register?team=${encodeURIComponent(String(teamParam))}`
    : `/hackathons/${slug}/register`;

  const [user, hackathonData] = await Promise.all([
    getCurrentDbUser(),
    getHackathonBySlug(slug),
  ]);

  const isFlagshipSlug = slug === FLAGSHIP_HACKATHON.slug || slug === "shipathon-2026" || slug === "gh-shipathon-2026";
  const hackathon = hackathonData || (isFlagshipSlug ? FLAGSHIP_HACKATHON : {
    ...FLAGSHIP_HACKATHON,
    id: slug.startsWith("gh-") ? slug : `gh-${slug}`,
    slug: slug.replace(/^gh-/, ""),
    title: slug.replace(/^gh-/, "").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
  });

  if (!user) {
    return (
      <div className="wrap max-w-4xl py-12">
        <div className="rounded-3xl border-2 border-ink bg-card p-6 sm:p-10 shadow-pop-lg space-y-6">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">
            <Lock className="w-4 h-4 text-purple" />
            <span>Authentication Required</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink dark:text-white">
              Sign in to claim your Hacker Passport
            </h1>
            <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted max-w-2xl">
              To participate in <strong className="text-ink dark:text-white">{hackathon.title}</strong>, build with a squad, and mint your official 3D Holographic Hacker Passport, you must be signed in to your GoHackerz account.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href={`/signin?next=${encodeURIComponent(nextParam)}`}
              className="btn btn-purple btn-lg font-mono font-bold text-sm flex items-center gap-2"
            >
              <span>Sign In to Register</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/signup?next=${encodeURIComponent(nextParam)}`}
              className="btn btn-lime text-[#1A1440] btn-lg font-mono font-bold text-sm"
            >
              <span>Create Free Account</span>
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-ink bg-[#17132a] p-5 text-white">
            <div className="flex items-center gap-2 text-lime font-bold text-base">
              <Ticket className="w-5 h-5 text-lime" />
              <span>3D Holographic Pass</span>
            </div>
            <p className="mt-2 text-xs text-[#ded8ff] leading-relaxed">
              Mint a unique digital boarding pass with your scannable QR verification code.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-ink bg-lime p-5 text-[#1A1440]">
            <div className="flex items-center gap-2 font-bold text-base">
              <Trophy className="w-5 h-5 text-purple" />
              <span>Prize Grants</span>
            </div>
            <p className="mt-2 text-xs font-medium leading-relaxed">
              Compete for cash grants, trophy badges, and sponsor cloud infrastructure credits.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-ink bg-card p-5">
            <div className="flex items-center gap-2 font-bold text-base text-purple">
              <UserCheck className="w-5 h-5" />
              <span>Profile History</span>
            </div>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Your hackathon tickets & squad links are saved permanently to your profile history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if this specific logged-in user is already registered on the server
  const existingParticipant = user.email
    ? await getParticipantByEmail(hackathon.id, user.email)
    : null;

  // If hackathon is closed and user is NOT registered, show Closed State
  const isClosed = hackathon.status === "COMPLETED" || hackathon.status === "JUDGING";

  if (isClosed && !existingParticipant) {
    return (
      <div className="wrap max-w-4xl py-12">
        <div className="rounded-3xl border-2 border-ink bg-card p-6 sm:p-10 shadow-pop-lg space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Registrations Closed</span>
          </div>

          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink dark:text-white">
              {hackathon.status === "COMPLETED"
                ? "This Hackathon Has Concluded"
                : "Registrations Are Closed for Judging"}
            </h1>
            <p className="mt-3 text-base text-muted leading-relaxed">
              {hackathon.status === "COMPLETED"
                ? `Registration for ${hackathon.title} is now closed. Official certificates and visa stamps have been minted for all participants.`
                : `Registration for ${hackathon.title} is currently closed while projects are being evaluated by the judging panel.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href={`/hackathons/${slug}`}
              className="btn btn-purple font-mono font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <span>Back to Hackathon Overview</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/hackathons/${slug}/submissions`}
              className="btn btn-lime text-[#1A1440] font-mono font-bold text-sm px-6 py-3 rounded-xl"
            >
              <span>View Project Showcase 🚀</span>
            </Link>
            <Link
              href="/passport"
              className="btn bg-bg border-2 border-ink text-ink font-mono font-bold text-sm px-6 py-3 rounded-xl hover:bg-card"
            >
              <span>Check My Passport</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HackathonRegisterClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      }}
      hackathon={hackathon}
      slug={slug}
      initialParticipant={existingParticipant}
    />
  );
}
