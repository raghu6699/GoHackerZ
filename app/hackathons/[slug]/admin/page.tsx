import React from "react";
import { notFound } from "next/navigation";
import { getHackathonBySlug } from "@/lib/hackathons";
import { getParticipantsForHackathon, getCertificatesForHackathon } from "@/lib/participant-store";
import { AdminControlClient } from "./AdminControlClient";

interface AdminPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata = {
  title: "Hackathon Admin Control & Awards Studio | GoHackerz",
};

export default async function HackathonAdminPage({ params }: AdminPageProps) {
  const { slug } = await params;

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) {
    notFound();
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
