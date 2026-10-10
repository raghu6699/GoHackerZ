import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCertificateByTicket, getParticipantByTicket } from "@/lib/participant-store";
import { getHackathonBySlug } from "@/lib/hackathons";
import { CertificateCard } from "@/components/CertificateCard";
import { ShieldCheck, ArrowLeft, Award, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ParticipantCertificatePageProps {
  params: Promise<{ slug: string; ticketNumber: string }>;
}

export default async function ParticipantCertificatePage({
  params,
}: ParticipantCertificatePageProps) {
  const { slug, ticketNumber } = await params;

  const cert = await getCertificateByTicket(ticketNumber);
  const participant = await getParticipantByTicket(ticketNumber);

  if (!cert) {
    return (
      <div className="min-h-screen bg-[#0A0718] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
          <Award className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Certificate In Progress</h1>
        <p className="text-[#8e88b8] max-w-md mb-6">
          The certificate for ticket <code className="text-white bg-[#1A1440] px-2 py-1 rounded font-mono">{ticketNumber}</code> will be automatically issued once the hackathon concludes and judging is finalized.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={`/hackathons/${slug}/pass/${ticketNumber}`}
            className="px-5 py-2.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6c48ff] text-white font-medium text-sm transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            View Hacker Passport
          </Link>
        </div>
      </div>
    );
  }

  // If certificate exists, redirect to canonical verify URL or render directly
  return (
    <div className="min-h-screen bg-[#070512] text-white py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between print:hidden">
        <Link
          href={`/hackathons/${slug}/pass/${ticketNumber}`}
          className="inline-flex items-center gap-2 text-sm text-[#a59fcf] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Hacker Passport</span>
        </Link>
      </div>

      <main className="max-w-4xl mx-auto flex flex-col items-center">
        <CertificateCard certificate={cert} showActions={true} />
      </main>
    </div>
  );
}
