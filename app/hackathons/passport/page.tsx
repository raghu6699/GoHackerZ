import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/profile";
import { getUserParticipantsByEmail, loadPersistedParticipants } from "@/lib/participant-store";
import { prisma, isDbAvailable } from "@/lib/prisma";

export const metadata = {
  title: "Redirecting to Hacker Passport | GoHackerz",
};

export default async function HackerPassportRedirectPage() {
  const user = await getCurrentDbUser();

  if (!user || !user.email) {
    redirect("/signin?next=/hackathons/passport");
  }

  const cleanEmail = user.email.trim().toLowerCase();

  // 1. Check disk store
  const fromDisk = getUserParticipantsByEmail(cleanEmail);
  if (fromDisk.length > 0) {
    const p = fromDisk[0];
    const hackSlug = (p.hackathonId || "shipathon-2026").replace(/^gh-/, "");
    redirect(`/hackathons/${hackSlug}/pass/${p.ticketNumber}`);
  }

  // 2. Check Postgres DB if available
  if (isDbAvailable()) {
    try {
      const pDb = await prisma.hackathonParticipant.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
        include: { hackathon: true },
      });
      if (pDb) {
        const hackSlug = pDb.hackathon?.slug || "shipathon-2026";
        redirect(`/hackathons/${hackSlug}/pass/${pDb.ticketNumber}`);
      }
    } catch (e) {
      console.warn("[HackerPassportRedirect] DB lookup notice:", e);
    }
  }

  // 3. Fallback to latest flagship registration if none found
  redirect("/hackathons/shipathon-2026/register?notice=claim_passport");
}
