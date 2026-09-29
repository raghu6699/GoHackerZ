import fs from "fs";
import path from "path";
import type { HackathonParticipant, HackathonTeam, HackathonSubmission } from "./hackathons";

const DATA_DIR = path.join(process.cwd(), "data");
const PARTICIPANTS_FILE = path.join(DATA_DIR, "participants.json");
const TEAMS_FILE = path.join(DATA_DIR, "teams.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn("Could not create data directory:", e);
    }
  }
}

/**
 * Load all persisted participants from disk.
 */
export function loadPersistedParticipants(): HackathonParticipant[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(PARTICIPANTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(PARTICIPANTS_FILE, "utf-8");
    if (!data.trim()) return [];
    return JSON.parse(data) as HackathonParticipant[];
  } catch (error) {
    console.error("Failed to read participants from disk:", error);
    return [];
  }
}

/**
 * Persist a participant to disk (creates or updates).
 */
export function persistParticipant(participant: HackathonParticipant): void {
  try {
    ensureDirectoryExists();
    const current = loadPersistedParticipants();
    const index = current.findIndex(
      (p) =>
        p.ticketNumber.toUpperCase() === participant.ticketNumber.toUpperCase() ||
        p.id === participant.id
    );

    if (index >= 0) {
      current[index] = { ...current[index], ...participant };
    } else {
      current.push(participant);
    }

    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(current, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save participant to disk:", error);
  }
}

/**
 * Find a participant by ticket number from disk storage.
 */
export function getPersistedParticipantByTicket(ticketNumber: string): HackathonParticipant | null {
  if (!ticketNumber) return null;
  const clean = ticketNumber.trim().toUpperCase();
  const list = loadPersistedParticipants();
  return list.find((p) => p.ticketNumber.toUpperCase() === clean) || null;
}

/**
 * Persist team to disk.
 */
export function persistTeam(team: HackathonTeam): void {
  try {
    ensureDirectoryExists();
    let current: HackathonTeam[] = [];
    if (fs.existsSync(TEAMS_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));
      } catch {
        current = [];
      }
    }
    const idx = current.findIndex((t) => t.inviteCode.toUpperCase() === team.inviteCode.toUpperCase());
    if (idx >= 0) {
      current[idx] = team;
    } else {
      current.push(team);
    }
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(current, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save team to disk:", error);
  }
}

/**
 * Load persisted teams.
 */
export function loadPersistedTeams(): HackathonTeam[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(TEAMS_FILE)) return [];
    return JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));
  } catch {
    return [];
  }
}
