import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the currently authenticated Supabase user and mirrors them into
 * the public.User table (Prisma). Returns null when not signed in.
 */
export async function getCurrentDbUser() {
  const supabase = await createClient();
  // Fail open: no Supabase env configured ⇒ treat the visitor as signed out
  // instead of letting createServerClient throw and 500ing every auth-aware
  // route (react/bookmark/comments/follow/…). Mirrors middleware + browser.
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) return null;

  const metaName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    (user.user_metadata?.name as string | undefined)?.trim();
  const fallback = user.email.split("@")[0];
  const name = metaName || fallback;
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;
  // Deterministic, collision-resistant username derived from the auth id
  const username =
    fallback.toLowerCase().replace(/[^a-z0-9]+/g, "") + "_" + user.id.slice(0, 6);

  try {
    // Already linked by authId?
    let byAuthId = await prisma.user.findUnique({ where: { authId: user.id } });
    if (byAuthId) {
      // Auto-sync real name, email & avatarUrl from Supabase Auth / Gmail
      if (
        byAuthId.name === "Test User" ||
        byAuthId.email === "testuser@gohackerz.com" ||
        (metaName && byAuthId.name !== metaName) ||
        (user.email && byAuthId.email !== user.email)
      ) {
        byAuthId = await prisma.user.update({
          where: { id: byAuthId.id },
          data: {
            email: user.email,
            name,
            avatarUrl: byAuthId.avatarUrl ?? avatarUrl,
          },
        });
      }
      return byAuthId;
    }

    // Already linked by id?
    const byId = await prisma.user.findUnique({ where: { id: user.id } });
    if (byId) {
      return byId;
    }

    // Same email signed up before (e.g. re-registered after an auth reset or DB wipe)?
    // Re-link the existing profile instead of violating the unique email index.
    const byEmail = await prisma.user.findUnique({ where: { email: user.email } });
    if (byEmail) {
      const updated = await prisma.user.update({
        where: { id: byEmail.id },
        data: { authId: user.id, name: byEmail.name || name },
      });
      // Send Welcome Email via Resend (AWAITED to prevent Vercel serverless function termination)
      try {
        const { sendEmail, welcomeEmail } = await import("@/lib/mailer");
        await sendEmail(welcomeEmail(user.email));
      } catch (err) {
        console.error("Error triggering welcome email on re-link:", err);
      }
      return updated;
    }

    const newDbUser = await prisma.user.create({
      data: { authId: user.id, email: user.email, name, username, role: "READER" },
    });

    // Send Welcome Email via Resend (AWAITED to prevent Vercel serverless function termination)
    try {
      const { sendEmail, welcomeEmail } = await import("@/lib/mailer");
      const mailRes = await sendEmail(welcomeEmail(user.email));
      console.info("Onboarding welcome email result:", JSON.stringify(mailRes));
    } catch (err) {
      console.error("Error triggering welcome email on signup:", err);
    }

    return newDbUser;
  } catch (err) {
    console.error("Error in getCurrentDbUser database operation:", err);
    // Return a synthetic user profile derived from Supabase Auth so signed-in
    // users are NEVER falsely displayed as signed-out on /write or other pages.
    return {
      id: user.id,
      authId: user.id,
      email: user.email,
      name: name,
      username: username,
      role: "READER" as const,
      trustLevel: 0,
      bio: null,
      company: null,
      avatarColor: "purple",
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      createdAt: new Date(),
    };
  }
}
