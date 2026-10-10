import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCertificateByNumber, getCertificateByTicket } from "@/lib/participant-store";
import { CertificateCard } from "@/components/CertificateCard";
import { ShieldCheck, ArrowLeft, Award, ExternalLink, CheckCircle } from "lucide-react";

interface VerifyPageProps {
  params: Promise<{ certNumber: string }>;
}

export async function generateMetadata({ params }: VerifyPageProps) {
  const { certNumber } = await params;
  let cert = await getCertificateByNumber(certNumber);
  if (!cert) {
    cert = await getCertificateByTicket(certNumber);
  }

  if (!cert) {
    return { title: "Certificate Verification | GoHackerz" };
  }

  return {
    title: `${cert.recipientName} - ${cert.awardTitle} | GoHackerz Credential`,
    description: `Official verified ${cert.awardTitle} awarded to ${cert.recipientName} for ${cert.title} on GoHackerz.`,
  };
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { certNumber } = await params;

  let cert = await getCertificateByNumber(certNumber);
  if (!cert) {
    cert = await getCertificateByTicket(certNumber);
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-[#0A0718] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <Award className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Certificate Not Found</h1>
        <p className="text-[#8e88b8] max-w-md mb-6">
          No active certificate was found for identifier <code className="text-white bg-[#1A1440] px-2 py-1 rounded font-mono">{certNumber}</code>. It may still be under review or pending issuance.
        </p>
        <Link
          href="/hackathons"
          className="px-5 py-2.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6c48ff] text-white font-medium text-sm transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Hackathons
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070512] text-white selection:bg-[#7C5CFF] selection:text-white py-10 px-4 sm:px-6">
      {/* Top Banner Navigation */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-2 text-sm text-[#a59fcf] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GoHackerz</span>
        </Link>

        {/* Verification Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <CheckCircle className="w-4 h-4" />
          <span>Officially Verified GoHackerz Credential</span>
        </div>
      </div>

      {/* Main Certificate Card Component */}
      <main className="max-w-4xl mx-auto flex flex-col items-center">
        <CertificateCard certificate={cert} showActions={true} />

        {/* Verification Details Box */}
        <div className="w-full max-w-4xl mt-8 p-6 rounded-2xl bg-[#0F0C24] border border-[#251F47] print:hidden">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-4">
            <ShieldCheck className="w-4 h-4 text-[#C6FF3D]" />
            <h3>Cryptographic Verification Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-[#161233] border border-[#2c2459]">
              <div className="text-[#8881b6] uppercase font-mono text-[10px]">Issued To</div>
              <div className="text-white font-semibold mt-1">{cert.recipientName}</div>
              {cert.roleTitle && (
                <div className="text-[#a59fcf] text-[11px]">{cert.roleTitle}</div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-[#161233] border border-[#2c2459]">
              <div className="text-[#8881b6] uppercase font-mono text-[10px]">Event & Title</div>
              <div className="text-white font-semibold mt-1">{cert.title}</div>
              <div className="text-[#C6FF3D] font-mono text-[11px]">{cert.awardTitle}</div>
            </div>

            <div className="p-3 rounded-xl bg-[#161233] border border-[#2c2459]">
              <div className="text-[#8881b6] uppercase font-mono text-[10px]">Issuance Date</div>
              <div className="text-white font-semibold mt-1">
                {new Date(cert.issuedAt).toUTCString()}
              </div>
              <div className="text-emerald-400 text-[11px]">Signature Valid & Recorded</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
