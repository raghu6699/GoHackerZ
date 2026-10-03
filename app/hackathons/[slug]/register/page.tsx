import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentDbUser } from "@/lib/profile";
import { getHackathonBySlug, getParticipantByEmail, FLAGSHIP_HACKATHON } from "@/lib/hackathons";
import { HackathonRegisterClient } from "@/components/HackathonRegisterClient";
import { Lock, Ticket, Trophy, UserCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Register for Hackathon — GoHackerz",
  description: "Register for GoHackerz hackathons, form a squad, and mint your 3D Holographic Hacker Passport.",
};

export default async function HackathonRegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [user, hackathonData] = await Promise.all([
    getCurrentDbUser(),
    getHackathonBySlug(slug),
  ]);

  const hackathon = hackathonData || FLAGSHIP_HACKATHON;

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
              href={`/signin?next=/hackathons/${slug}/register`}
              className="btn btn-purple btn-lg font-mono font-bold text-sm flex items-center gap-2"
            >
              <span>Sign In to Register</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/signup?next=/hackathons/${slug}/register`}
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
