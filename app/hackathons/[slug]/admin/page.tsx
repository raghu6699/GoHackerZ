import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getHackathonBySlug } from "@/lib/hackathons";
import { getParticipantsForHackathon, getCertificatesForHackathon } from "@/lib/participant-store";
import { getCurrentDbUser } from "@/lib/profile";
import { isUserAdmin } from "@/lib/admin-auth";
import { AdminControlClient } from "./AdminControlClient";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

interface AdminPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Hackathon Admin Control & Awards Studio | GoHackerz",
};

export default async function HackathonAdminPage({ params }: AdminPageProps) {
  const { slug } = await params;

  // 1. Verify Hackathon exists
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) {
    notFound();
  }

  // 2. Strict Admin Role Verification
  const user = await getCurrentDbUser();
  const isAdmin = isUserAdmin(user);

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-pink/15 border-2 border-pink flex items-center justify-center mb-5 shadow-pop-sm">
          <ShieldAlert className="w-8 h-8 text-pink" />
        </div>
        <h1 className="text-3xl font-black text-ink tracking-tight mb-2">
          Admin Access Restricted
        </h1>
        <p className="text-sm text-body max-w-md mb-6 leading-relaxed">
          The Hackathon Control & Awards Studio is restricted to GoHackerz Event Directors and authorized administrators.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/hackathons/${slug}`}
            className="btn btn-sm btn-purple font-mono text-xs font-bold px-5 py-2.5 shadow-pop-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hackathon
          </Link>
          {!user && (
            <Link
              href={`/signin?next=/hackathons/${slug}/admin`}
              className="btn btn-sm btn-lime text-brand-dark font-mono text-xs font-bold px-5 py-2.5 shadow-pop-sm flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in as Admin
            </Link>
          )}
        </div>
      </div>
    );
  }

  const participants = await getParticipantsForHackathon(slug);
  const certificates = await getCertificatesForHackathon(slug);

  return (
    <AdminControlClient
      slug={slug}
      initialStatus={hackathon.status}
      hackathonTitle={hackathon.title}
      participants={participants}
      initialCertificates={certificates}
    />
  );
}

