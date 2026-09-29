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
 * Automatically hydrates active squad roster from team record.
 */
export function getPersistedParticipantByTicket(ticketNumber: string): HackathonParticipant | null {
  if (!ticketNumber) return null;
  const clean = ticketNumber.trim().toUpperCase();
  const list = loadPersistedParticipants();
  const participant = list.find((p) => p.ticketNumber.toUpperCase() === clean);
  if (!participant) return null;

  // Hydrate teammates from canonical team record if in a team
  if (participant.teamCode) {
    const team = getPersistedTeamByCode(participant.teamCode);
    if (team) {
      participant.teamName = team.name;
      participant.teammates = team.members.map((m) => ({
        name: m.name,
        roleTitle: m.roleTitle,
        avatarUrl: m.avatarUrl,
      }));
    }
  }

  return participant;
}

/**
 * Load persisted teams from disk.
 */
export function loadPersistedTeams(): HackathonTeam[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(TEAMS_FILE)) return [];
    const raw = fs.readFileSync(TEAMS_FILE, "utf-8");
    if (!raw.trim()) return [];
    return JSON.parse(raw) as HackathonTeam[];
  } catch {
    return [];
  }
}

/**
 * Persist a team to disk (creates or updates).
 */
export function persistTeam(team: HackathonTeam): void {
  try {
    ensureDirectoryExists();
    const current = loadPersistedTeams();
    const idx = current.findIndex(
      (t) => t.inviteCode.toUpperCase() === team.inviteCode.toUpperCase() || t.id === team.id
    );
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
 * Find a team by its unique invite code (e.g. VOID-42).
 */
export function getPersistedTeamByCode(code: string): HackathonTeam | null {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  const teams = loadPersistedTeams();
  return teams.find((t) => t.inviteCode.toUpperCase() === clean) || null;
}

/**
 * Add a participant to a team and synchronize teammates across all members.
 */
export function addMemberToTeam(params: {
  teamCode: string;
  participantTicket: string;
}): { success: boolean; team?: HackathonTeam; error?: string } {
  const code = params.teamCode.trim().toUpperCase();
  const team = getPersistedTeamByCode(code);
  if (!team) {
    return { success: false, error: `Team with invite code "${code}" was not found.` };
  }

  const participant = getPersistedParticipantByTicket(params.participantTicket);
  if (!participant) {
    return { success: false, error: "Participant not found." };
  }

  // Check if team is full (maximum 4 builders)
  if (team.members.length >= 4 && !team.members.some((m) => m.ticketNumber === participant.ticketNumber)) {
    return { success: false, error: "This squad is already full (maximum 4 members reached)." };
  }

  // Add member to team if not already member
  const exists = team.members.some(
    (m) => m.ticketNumber.toUpperCase() === participant.ticketNumber.toUpperCase()
  );
  if (!exists) {
    team.members.push({
      ...participant,
      isCaptain: false,
    });
    persistTeam(team);
  }

  // Update participant's team references
  participant.teamId = team.id;
  participant.teamName = team.name;
  participant.teamCode = team.inviteCode;
  participant.isCaptain = team.captainId.toUpperCase() === participant.ticketNumber.toUpperCase();
  persistParticipant(participant);

  // Sync teammates across all participants in this team
  syncTeamParticipants(team);

  return { success: true, team };
}

/**
 * Create a new team and assign the creator as Captain.
 */
export function createNewTeam(params: {
  teamName: string;
  creatorTicket: string;
  hackathonId?: string;
}): { success: boolean; team?: HackathonTeam; error?: string } {
  const name = params.teamName.trim();
  if (!name) {
    return { success: false, error: "Team name is required." };
  }

  const creator = getPersistedParticipantByTicket(params.creatorTicket);
  if (!creator) {
    return { success: false, error: "Creator participant not found." };
  }

  // Generate invite code
  const prefix = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "HACK";
  const rand = Math.floor(1000 + Math.random() * 9000);
  const inviteCode = `${prefix}-${rand}`;
  const teamId = `team-${Date.now()}`;

  const newTeam: HackathonTeam = {
    id: teamId,
    hackathonId: params.hackathonId || creator.hackathonId || "gh-shipathon-2026",
    name,
    inviteCode,
    captainId: creator.ticketNumber,
    members: [
      {
        ...creator,
        isCaptain: true,
      },
    ],
    createdAt: new Date().toISOString(),
  };

  persistTeam(newTeam);

  // Update creator participant
  creator.teamId = teamId;
  creator.teamName = name;
  creator.teamCode = inviteCode;
  creator.isCaptain = true;
  creator.teammates = [{ name: creator.name, roleTitle: creator.roleTitle, avatarUrl: creator.avatarUrl }];
  persistParticipant(creator);

  return { success: true, team: newTeam };
}

/**
 * Leave current team and revert to Solo Builder.
 */
export function leaveCurrentTeam(participantTicket: string): { success: boolean; error?: string } {
  const participant = getPersistedParticipantByTicket(participantTicket);
  if (!participant || !participant.teamCode) {
    return { success: false, error: "Participant is not in a team." };
  }

  const team = getPersistedTeamByCode(participant.teamCode);
  if (team) {
    team.members = team.members.filter(
      (m) => m.ticketNumber.toUpperCase() !== participant.ticketNumber.toUpperCase()
    );

    // If captain left and members remain, promote first member to captain
    if (
      team.captainId.toUpperCase() === participant.ticketNumber.toUpperCase() &&
      team.members.length > 0
    ) {
      team.captainId = team.members[0].ticketNumber;
      team.members[0].isCaptain = true;
      const promoted = getPersistedParticipantByTicket(team.members[0].ticketNumber);
      if (promoted) {
        promoted.isCaptain = true;
        persistParticipant(promoted);
      }
    }

    persistTeam(team);
    syncTeamParticipants(team);
  }

  // Revert participant to solo
  participant.teamId = undefined;
  participant.teamName = undefined;
  participant.teamCode = undefined;
  participant.isCaptain = false;
  participant.teammates = undefined;
  persistParticipant(participant);

  return { success: true };
}

/**
 * Synchronize teammates list across all participants belonging to a team.
 */
function syncTeamParticipants(team: HackathonTeam) {
  const participants = loadPersistedParticipants();
  const squadRoster = team.members.map((m) => ({
    name: m.name,
    roleTitle: m.roleTitle,
    avatarUrl: m.avatarUrl,
  }));

  let changed = false;
  for (const p of participants) {
    if (p.teamCode && p.teamCode.toUpperCase() === team.inviteCode.toUpperCase()) {
      p.teamName = team.name;
      p.teammates = squadRoster;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(participants, null, 2), "utf-8");
  }
}
