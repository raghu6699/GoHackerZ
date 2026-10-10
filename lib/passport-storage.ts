"use client";

import type { HackathonParticipant } from "./hackathons";

const STORAGE_PREFIX = "gh_passport_";
const ACTIVE_TICKET_KEY = "gh_active_ticket";
const ACTIVE_EMAIL_KEY = "gh_active_email";

export function cleanHackathonId(id?: string): string {
  if (!id) return "";
  return id.trim().toLowerCase().replace(/^gh-/, "");
}

/**
 * Returns a storage key scoped to both hackathonId AND the logged-in
 * user's email so that two different accounts or events never collide.
 */
function buildStorageKey(hackathonId: string, email?: string): string {
  const cleanId = cleanHackathonId(hackathonId);
  const safeEmail = (email || "").trim().toLowerCase().replace(/[^a-z0-9@._-]/g, "");
  if (safeEmail) {
    return `${STORAGE_PREFIX}${cleanId}__${safeEmail}`;
  }
  return `${STORAGE_PREFIX}${cleanId}`;
}

export function saveMyPassport(participant: HackathonParticipant) {
  if (typeof window === "undefined" || !participant) return;

  try {
    const cleanId = cleanHackathonId(participant.hackathonId || "default");
    if (!cleanId) return;
    const key = buildStorageKey(cleanId, participant.email);
    localStorage.setItem(key, JSON.stringify(participant));
    localStorage.setItem(`${ACTIVE_TICKET_KEY}_${cleanId}`, participant.ticketNumber);
    localStorage.setItem(ACTIVE_TICKET_KEY, participant.ticketNumber);

    // Persist the owning email so we can scope lookups correctly
    if (participant.email) {
      localStorage.setItem(ACTIVE_EMAIL_KEY, participant.email.trim().toLowerCase());
    }

    // Also store a long-lived cookie for server/client synchronization
    document.cookie = `gh_active_ticket_${cleanId}=${participant.ticketNumber}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `gh_active_ticket=${participant.ticketNumber}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `gh_active_name=${encodeURIComponent(participant.name)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {
    console.error("Failed to save passport to storage:", e);
  }
}

export function getMyPassport(
  hackathonId: string,
  forEmail?: string
): HackathonParticipant | null {
  if (typeof window === "undefined" || !hackathonId) return null;

  try {
    const cleanTarget = cleanHackathonId(hackathonId);
    if (!cleanTarget) return null;
    const activeEmail = (forEmail || localStorage.getItem(ACTIVE_EMAIL_KEY) || "")
      .trim()
      .toLowerCase();

    // 1. Check direct scoped key
    if (activeEmail) {
      const scopedKey = buildStorageKey(cleanTarget, activeEmail);
      const scopedRaw = localStorage.getItem(scopedKey);
      if (scopedRaw) {
        const parsed: HackathonParticipant = JSON.parse(scopedRaw);
        const parsedClean = cleanHackathonId(parsed.hackathonId);
        if (
          parsedClean === cleanTarget &&
          parsed.email &&
          parsed.email.trim().toLowerCase() === activeEmail
        ) {
          return parsed;
        }
      }

      // Also check with gh- prefix
      const scopedGhKey = `${STORAGE_PREFIX}gh-${cleanTarget}__${activeEmail}`;
      const scopedGhRaw = localStorage.getItem(scopedGhKey);
      if (scopedGhRaw) {
        const parsed: HackathonParticipant = JSON.parse(scopedGhRaw);
        const parsedClean = cleanHackathonId(parsed.hackathonId);
        if (
          parsedClean === cleanTarget &&
          parsed.email &&
          parsed.email.trim().toLowerCase() === activeEmail
        ) {
          return parsed;
        }
      }
    }

    // 2. Check unscoped key for this specific hackathon
    const unscopedKey = buildStorageKey(cleanTarget);
    const unscopedRaw = localStorage.getItem(unscopedKey);
    if (unscopedRaw) {
      const parsed: HackathonParticipant = JSON.parse(unscopedRaw);
      const parsedClean = cleanHackathonId(parsed.hackathonId);
      if (parsedClean === cleanTarget) {
        if (!activeEmail || !parsed.email || parsed.email.trim().toLowerCase() === activeEmail) {
          return parsed;
        }
      }
    }

    // 3. Fallback: inspect only keys matching this target hackathon
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith(`${STORAGE_PREFIX}${cleanTarget}__`) ||
          k.startsWith(`${STORAGE_PREFIX}gh-${cleanTarget}__`) ||
          k === `${STORAGE_PREFIX}${cleanTarget}` ||
          k === `${STORAGE_PREFIX}gh-${cleanTarget}`)
      ) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed: HackathonParticipant = JSON.parse(raw);
            const parsedClean = cleanHackathonId(parsed.hackathonId);
            if (parsedClean === cleanTarget) {
              if (
                !activeEmail ||
                !parsed.email ||
                parsed.email.trim().toLowerCase() === activeEmail
              ) {
                return parsed;
              }
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

export function getAllMyPassports(forEmail?: string): HackathonParticipant[] {
  if (typeof window === "undefined") return [];

  const results: HackathonParticipant[] = [];
  const seenTickets = new Set<string>();

  try {
    const activeEmail = (forEmail || localStorage.getItem(ACTIVE_EMAIL_KEY) || "")
      .trim()
      .toLowerCase();

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed: HackathonParticipant = JSON.parse(raw);
            if (parsed?.ticketNumber && !seenTickets.has(parsed.ticketNumber.toUpperCase())) {
              if (!activeEmail || !parsed.email || parsed.email.trim().toLowerCase() === activeEmail) {
                seenTickets.add(parsed.ticketNumber.toUpperCase());
                results.push(parsed);
              }
            }
          }
        } catch {}
      }
    }
  } catch (e) {
    console.error("Failed to list all passports from storage:", e);
  }

  return results;
}

export function getActiveTicketNumber(hackathonId: string, forEmail?: string): string | null {
  if (typeof window === "undefined" || !hackathonId) return null;

  try {
    const activeEmail = (forEmail || localStorage.getItem(ACTIVE_EMAIL_KEY) || "")
      .trim()
      .toLowerCase();

    const cleanHack = cleanHackathonId(hackathonId);
    if (!cleanHack) return null;
    const pass = getMyPassport(cleanHack, activeEmail || undefined);

    if (pass?.ticketNumber) {
      if (!activeEmail || !pass.email || pass.email.trim().toLowerCase() === activeEmail) {
        return pass.ticketNumber;
      }
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
      if (k && (k.startsWith(STORAGE_PREFIX) || k.startsWith(ACTIVE_TICKET_KEY))) {
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
