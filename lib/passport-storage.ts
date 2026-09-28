"use client";

import type { HackathonParticipant } from "./hackathons";

const STORAGE_PREFIX = "gh_passport_";

export function saveMyPassport(participant: HackathonParticipant) {
  if (typeof window === "undefined") return;

  try {
    const key = `${STORAGE_PREFIX}${participant.hackathonId || "default"}`;
    localStorage.setItem(key, JSON.stringify(participant));
    localStorage.setItem("gh_active_ticket", participant.ticketNumber);

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
    const key = `${STORAGE_PREFIX}${hackathonId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to read passport from storage:", e);
  }

  return null;
}

export function getActiveTicketNumber(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const val = localStorage.getItem("gh_active_ticket");
    if (val) return val;

    // Check cookie
    const match = document.cookie.match(/gh_active_ticket=([^;]+)/);
    if (match) return match[1];
  } catch {
    return null;
  }

  return null;
}
