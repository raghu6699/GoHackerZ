import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/profile";
import { getUserParticipantsByEmail, loadPersistedParticipants } from "@/lib/participant-store";
import { prisma, isDbAvailable } from "@/lib/prisma";
import { PassportRedirectClient } from "@/components/PassportRedirectClient";

export const metadata = {
  title: "Redirecting to Hacker Passport | GoHackerz",
};

export default async function HackerPassportRedirectPage() {
  const user = await getCurrentDbUser();

  if (!user || !user.email) {
    redirect("/signin?next=/hackathons/passport");
  }

  const cleanEmail = user.email.trim().toLowerCase();

  // 1. Check Postgres DB if available (most canonical)
  if (isDbAvailable()) {
    try {
      const pDb = await prisma.hackathonParticipant.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
        include: { hackathon: true },
        orderBy: { createdAt: "desc" },
      });
      if (pDb) {
        const hackSlug = pDb.hackathon?.slug || (pDb.hackathonId || "shipathon-2026").replace(/^gh-/, "");
        redirect(`/hackathons/${hackSlug}/pass/${pDb.ticketNumber}`);
      }
    } catch (e) {
      console.warn("[HackerPassportRedirect] DB lookup notice:", e);
    }
  }

  // 2. Check disk store
  const fromDisk = getUserParticipantsByEmail(cleanEmail);
  if (fromDisk.length > 0) {
    const sorted = [...fromDisk].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const p = sorted[0];
    const hackSlug = (p.hackathonId || "shipathon-2026").replace(/^gh-/, "");
    redirect(`/hackathons/${hackSlug}/pass/${p.ticketNumber}`);
  }

  // 3. Fallback to client-side localStorage and portfolio resolver
  return <PassportRedirectClient userEmail={cleanEmail} />;
}
