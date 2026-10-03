"use client";

import type { HackathonParticipant } from "./hackathons";

const STORAGE_PREFIX = "gh_passport_";
const ACTIVE_TICKET_KEY = "gh_active_ticket";
const ACTIVE_EMAIL_KEY = "gh_active_email";

/**
 * Returns a storage key scoped to both hackathonId AND the logged-in
 * user's email so that two different accounts on the same browser
 * never share passport data.
 */
function buildStorageKey(hackathonId: string, email?: string): string {
  const safeEmail = (email || "").trim().toLowerCase().replace(/[^a-z0-9@._-]/g, "");
  if (safeEmail) {
    return `${STORAGE_PREFIX}${hackathonId}__${safeEmail}`;
  }
  // Legacy fallback — used when email is unknown (visitor view)
  return `${STORAGE_PREFIX}${hackathonId}`;
}

export function saveMyPassport(participant: HackathonParticipant) {
  if (typeof window === "undefined") return;

  try {
    const key = buildStorageKey(
      participant.hackathonId || "default",
      participant.email
    );
    localStorage.setItem(key, JSON.stringify(participant));
    localStorage.setItem(ACTIVE_TICKET_KEY, participant.ticketNumber);
    // Persist the owning email so we can scope lookups correctly
    if (participant.email) {
      localStorage.setItem(ACTIVE_EMAIL_KEY, participant.email.trim().toLowerCase());
    }

    // Also store a long-lived cookie for server/client synchronization
    document.cookie = `gh_active_ticket=${participant.ticketNumber}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `gh_active_name=${encodeURIComponent(participant.name)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {
    console.error("Failed to save passport to storage:", e);
  }
}

export function getMyPassport(hackathonId = "gh-shipathon-2026"): HackathonParticipant | null {
  if (typeof window === "undefined") return null;

  try {
    // Try email-scoped key first (current user)
    const activeEmail = localStorage.getItem(ACTIVE_EMAIL_KEY);
    if (activeEmail) {
      const scopedKey = buildStorageKey(hackathonId, activeEmail);
      const scopedRaw = localStorage.getItem(scopedKey);
      if (scopedRaw) {
        return JSON.parse(scopedRaw);
      }
    }

    // Fallback: legacy unscoped key (for existing users who registered before this change)
    const legacyKey = buildStorageKey(hackathonId);
    const legacyRaw = localStorage.getItem(legacyKey);
    if (legacyRaw) {
      const parsed: HackathonParticipant = JSON.parse(legacyRaw);
      // Migrate to scoped key if we now have an email
      if (parsed.email && activeEmail && parsed.email.trim().toLowerCase() === activeEmail) {
        saveMyPassport(parsed);
        localStorage.removeItem(legacyKey);
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to read passport from storage:", e);
  }

  return null;
}

export function getActiveTicketNumber(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const val = localStorage.getItem(ACTIVE_TICKET_KEY);
    if (val) return val;

    // Check cookie
    const match = document.cookie.match(/gh_active_ticket=([^;]+)/);
    if (match) return match[1];
  } catch {
    return null;
  }

  return null;
}

/**
 * Clear the current user's passport from localStorage and cookies.
 * Call this on sign-out so that the next user sees a clean slate.
 */
export function clearMyPassport() {
  if (typeof window === "undefined") return;

  try {
    const activeEmail = localStorage.getItem(ACTIVE_EMAIL_KEY);

    // Remove all gh_passport_ keys (handles both scoped and legacy)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        // Only remove this user's scoped key, or the legacy unscoped key
        if (!activeEmail || k.includes("__" + activeEmail) || !k.includes("__")) {
          keysToRemove.push(k);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    localStorage.removeItem(ACTIVE_TICKET_KEY);
    localStorage.removeItem(ACTIVE_EMAIL_KEY);

    // Expire cookies
    document.cookie = "gh_active_ticket=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "gh_active_name=; path=/; max-age=0; SameSite=Lax";
  } catch (e) {
    console.error("Failed to clear passport from storage:", e);
  }
}
