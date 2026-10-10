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

export function getMyPassport(
  hackathonId = "gh-shipathon-2026",
  forEmail?: string
): HackathonParticipant | null {
  if (typeof window === "undefined") return null;

  try {
    const activeEmail = (forEmail || localStorage.getItem(ACTIVE_EMAIL_KEY) || "")
      .trim()
      .toLowerCase();

    if (activeEmail) {
      // Look up email-scoped key
      const scopedKey = buildStorageKey(hackathonId, activeEmail);
      const scopedRaw = localStorage.getItem(scopedKey);
      if (scopedRaw) {
        const parsed: HackathonParticipant = JSON.parse(scopedRaw);
        if (parsed.email && parsed.email.trim().toLowerCase() === activeEmail) {
          return parsed;
        }
      }
    }

    // Fallback: check active ticket
    const activeTicket = (localStorage.getItem(ACTIVE_TICKET_KEY) || "").trim().toUpperCase();

    // Check all storage keys for matching passport
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed: HackathonParticipant = JSON.parse(raw);
            if (activeTicket && parsed.ticketNumber?.toUpperCase() === activeTicket) {
              return parsed;
            }
            if (activeEmail && parsed.email?.trim().toLowerCase() === activeEmail) {
              return parsed;
            }
          }
        } catch {}
      }
    }
  } catch (e) {
    console.error("Failed to read passport from storage:", e);
  }

  return null;
}

export function getActiveTicketNumber(forEmail?: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const activeEmail = (forEmail || localStorage.getItem(ACTIVE_EMAIL_KEY) || "")
      .trim()
      .toLowerCase();

    if (!activeEmail) return null;

    const pass = getMyPassport("gh-shipathon-2026", activeEmail);
    if (pass && pass.email && pass.email.trim().toLowerCase() === activeEmail) {
      return pass.ticketNumber;
    }
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
