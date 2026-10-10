/**
 * Centralized Admin Verification for GoHackerz
 */

export const DEFAULT_ADMIN_EMAILS = [
  "ud.ai.journey@gmail.com",
  "raghu@gohackerz.com",
  "admin@gohackerz.com",
];

export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];
  return Array.from(
    new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...envEmails])
  );
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const adminList = getAdminEmails();
  return adminList.includes(clean);
}

export function isUserAdmin(user?: {
  email?: string | null;
  role?: string | null;
  app_metadata?: any;
  user_metadata?: any;
} | null): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.app_metadata?.role === "admin" || user.app_metadata?.role === "ADMIN") return true;
  if (user.user_metadata?.role === "admin" || user.user_metadata?.role === "ADMIN") return true;
  return isAdminEmail(user.email);
}

export const isSuperAdmin = isUserAdmin;

export function canUserManageHackathon(
  user?: {
    email?: string | null;
    role?: string | null;
    app_metadata?: any;
    user_metadata?: any;
  } | null,
  hackathon?: {
    hostEmail?: string | null;
    hostKey?: string | null;
  } | null,
  providedKey?: string | null
): boolean {
  if (isUserAdmin(user)) return true;
  if (providedKey && hackathon?.hostKey && providedKey.trim() === hackathon.hostKey.trim()) {
    return true;
  }
  if (!user?.email || !hackathon?.hostEmail) return false;
  return user.email.trim().toLowerCase() === hackathon.hostEmail.trim().toLowerCase();
}

