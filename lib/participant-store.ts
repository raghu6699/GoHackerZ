import fs from "fs";
import path from "path";
import { prisma, isDbAvailable } from "./prisma";
import type { HackathonParticipant, HackathonTeam, HackathonSubmission, HackathonTheme } from "./hackathons";

const DATA_DIR = path.join(process.cwd(), "data");
const PARTICIPANTS_FILE = path.join(DATA_DIR, "participants.json");
const TEAMS_FILE = path.join(DATA_DIR, "teams.json");

// Fallback hackathon ID used when DB is not seeded
const FALLBACK_HACKATHON_ID = "gh-shipathon-2026";

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn("Could not create data directory:", e);
    }
  }
}

// Global in-memory singleton for fast cross-request access in single process
export const memoryStore =
  (globalThis as unknown as {
    _ghMemStore?: {
      participants: Map<string, HackathonParticipant>;
      teams: Map<string, HackathonTeam>;
    };
  })._ghMemStore ||
  (() => {
    const store = {
      participants: new Map<string, HackathonParticipant>(),
      teams: new Map<string, HackathonTeam>(),
    };
    (
      globalThis as unknown as {
        _ghMemStore?: typeof store;
      }
    )._ghMemStore = store;
    return store;
  })();

/** Ensure the flagship hackathon row exists in DB. Returns the real DB cuid. */
export async function ensureHackathonInDb(hackathonIdOrSlug?: string): Promise<string> {
  if (!isDbAvailable()) return FALLBACK_HACKATHON_ID;
  try {
    const target = (hackathonIdOrSlug || "shipathon-2026").trim();
    const cleanSlug = target.replace(/^gh-/, "");

    // 1. Try finding by id or slug
    const existing = await prisma.hackathon.findFirst({
      where: {
        OR: [{ id: target }, { slug: target }, { slug: cleanSlug }],
      },
      select: { id: true, slug: true },
    });
    if (existing) return existing.id;

    // 2. Create flagship hackathon if missing
    const created = await prisma.hackathon.create({
      data: {
        slug: cleanSlug || "shipathon-2026",
        title: "GoHackerz Global Shipathon 2026",
        tagline: "Build with Edge & AI. Ship in 48 hours.",
        description: "The premier hackathon for the builders who ship.",
        status: "ACTIVE",
        startDate: new Date("2026-10-10T00:00:00Z"),
        endDate: new Date("2026-10-12T23:59:59Z"),
        submissionDeadline: new Date("2026-10-12T20:00:00Z"),
        prizePool: "Cash Grants + Trophy + Cloud Credits",
        tracks: [],
        rules: [],
      },
    });
    return created.id;
  } catch (e) {
    console.warn("[ensureHackathonInDb] Could not seed hackathon:", e);
    return FALLBACK_HACKATHON_ID;
  }
}

// Cache the real hackathon DB id per process
let _cachedHackathonDbId: string | null = null;
export async function getHackathonDbId(hackathonIdOrSlug?: string): Promise<string> {
  if (_cachedHackathonDbId && !hackathonIdOrSlug) return _cachedHackathonDbId;
  const id = await ensureHackathonInDb(hackathonIdOrSlug);
  if (!hackathonIdOrSlug) _cachedHackathonDbId = id;
  return id;
}

/**
 * Load all persisted participants from disk.
 */
export function loadPersistedParticipants(): HackathonParticipant[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(PARTICIPANTS_FILE)) return [];
    const data = fs.readFileSync(PARTICIPANTS_FILE, "utf-8");
    if (!data.trim()) return [];
    return JSON.parse(data) as HackathonParticipant[];
  } catch (error) {
    console.error("Failed to read participants from disk:", error);
    return [];
  }
}

/**
 * Get all participants associated with an email address.
 */
export function getUserParticipantsByEmail(email: string): HackathonParticipant[] {
  if (!email) return [];
  const cleanEmail = email.trim().toLowerCase();
  const list = loadPersistedParticipants();
  return list.filter((p) => p.email && p.email.trim().toLowerCase() === cleanEmail);
}

/**
 * Write a participant to disk JSON (sync, always works).
 */
function writeToDisk(participant: HackathonParticipant): void {
  try {
    ensureDirectoryExists();
    if (participant.teamCode && !participant.teamId) {
      const team = getPersistedTeamByCode(participant.teamCode);
      if (team) {
        participant.teamId = team.id;
        participant.teamName = team.name;
      }
    }
    const current = loadPersistedParticipants();
    const index = current.findIndex(
      (p) =>
        p.ticketNumber.toUpperCase() === participant.ticketNumber.toUpperCase() ||
        p.id === participant.id
    );
    if (index >= 0) {
      const existing = current[index];
      current[index] = {
        ...existing,
        ...participant,
        teamId: participant.teamId || existing.teamId,
        teamName: participant.teamName || existing.teamName,
        teamCode: participant.teamCode || existing.teamCode,
        isCaptain: participant.isCaptain ?? existing.isCaptain,
        teammates:
          participant.teammates && participant.teammates.length > 0
            ? participant.teammates
            : existing.teammates,
        themeStyle:
          participant.themeStyle && participant.themeStyle !== "lime"
            ? participant.themeStyle
            : existing.themeStyle || participant.themeStyle || "lime",
      };
    } else {
      current.push(participant);
    }
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(current, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write participant to disk:", error);
  }
}

/**
 * Persist a participant to disk (sync) and DB (async fire-and-forget).
 * Use persistParticipantToDb() when you need to await the DB write.
 */
export function persistParticipant(participant: HackathonParticipant): void {
  writeToDisk(participant);
  memoryStore.participants.set(participant.ticketNumber.toUpperCase(), participant);
  // Fire-and-forget DB sync
  persistParticipantToDb(participant).catch(() => {});
}

/**
 * Persist a participant to Postgres (awaitable).
 * Safe to call even if the hackathon row doesn't exist yet — it upserts the hackathon first.
 */
export async function persistParticipantToDb(participant: HackathonParticipant): Promise<void> {
  if (!isDbAvailable() || !participant.ticketNumber || !participant.name) return;
  try {
    const hackathonId = await getHackathonDbId(participant.hackathonId);

    // Get the real team DB id if we only have a teamCode
    let resolvedTeamId: string | null = participant.teamId || null;
    if (!resolvedTeamId && participant.teamCode) {
      const team = await prisma.hackathonTeam.findUnique({
        where: { inviteCode: participant.teamCode.trim().toUpperCase() },
        select: { id: true },
      });
      resolvedTeamId = team?.id || null;
    }

    await prisma.hackathonParticipant.upsert({
      where: { ticketNumber: participant.ticketNumber.trim().toUpperCase() },
      update: {
        name: participant.name.trim(),
        email: participant.email?.trim() || "",
        roleTitle: participant.roleTitle?.trim() || "Fullstack & AI Engineer",
        bio: participant.bio?.trim() || null,
        discordHandle: participant.discordHandle?.trim() || null,
        twitterHandle: participant.twitterHandle?.trim() || null,
        avatarUrl: participant.avatarUrl || null,
        themeStyle: participant.themeStyle || "lime",
        isCaptain: participant.isCaptain ?? false,
        teamId: resolvedTeamId,
      },
      create: {
        id: participant.id || `part-${Date.now()}`,
        hackathonId,
        ticketNumber: participant.ticketNumber.trim().toUpperCase(),
        name: participant.name.trim(),
        email: participant.email?.trim() || "",
        roleTitle: participant.roleTitle?.trim() || "Fullstack & AI Engineer",
        bio: participant.bio?.trim() || null,
        discordHandle: participant.discordHandle?.trim() || null,
        twitterHandle: participant.twitterHandle?.trim() || null,
        avatarUrl: participant.avatarUrl || null,
        themeStyle: participant.themeStyle || "lime",
        isCaptain: participant.isCaptain ?? false,
        teamId: resolvedTeamId,
      },
    });
  } catch (err) {
    console.warn("[persistParticipantToDb] DB upsert error:", err);
  }
}

/**
 * Find a participant by ticket number from disk storage.
 */
export function getPersistedParticipantByTicket(ticketNumber: string): HackathonParticipant | null {
  if (!ticketNumber) return null;
  const clean = ticketNumber.trim().toUpperCase();
  const list = loadPersistedParticipants();
  const participant = list.find((p) => p.ticketNumber.toUpperCase() === clean);
  if (!participant) return null;

  if (participant.teamCode || participant.teamId) {
    const team = participant.teamCode
      ? getPersistedTeamByCode(participant.teamCode)
      : loadPersistedTeams().find((t) => t.id === participant.teamId);

    if (team) {
      participant.teamId = team.id;
      participant.teamName = team.name;
      participant.teamCode = team.inviteCode;
      participant.isCaptain = team.captainId?.toUpperCase() === participant.ticketNumber.toUpperCase();
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
 * Persist a team to disk and DB.
 */
export function persistTeam(team: HackathonTeam): void {
  // 1. Update memory store
  memoryStore.teams.set(team.inviteCode.toUpperCase(), team);

  // 2. Disk write (sync)
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

  // 3. Fire-and-forget DB sync
  persistTeamToDb(team).catch(() => {});
}

/**
 * Persist a team to Postgres (awaitable).
 */
export async function persistTeamToDb(team: HackathonTeam): Promise<void> {
  if (!isDbAvailable() || !team.inviteCode || !team.name) return;
  try {
    const hackathonId = await getHackathonDbId(team.hackathonId);
    await prisma.hackathonTeam.upsert({
      where: { inviteCode: team.inviteCode.trim().toUpperCase() },
      update: { name: team.name.trim(), tagline: team.tagline || null },
      create: {
        id: team.id || `team-${Date.now()}`,
        hackathonId,
        name: team.name.trim(),
        tagline: team.tagline || null,
        inviteCode: team.inviteCode.trim().toUpperCase(),
      },
    });
  } catch (err) {
    console.warn("[persistTeamToDb] DB upsert error:", err);
  }
}

/**
 * Find a team by its unique invite code (disk fallback only).
 */
export function getPersistedTeamByCode(code: string): HackathonTeam | null {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  const teams = loadPersistedTeams();
  return teams.find((t) => t.inviteCode.toUpperCase() === clean) || null;
}

/**
 * Find a team by invite code — tries Postgres first, falls back to memory, then disk.
 */
export async function getTeamByCode(code: string, hackathonIdOrSlug?: string): Promise<HackathonTeam | null> {
  if (!code) return null;
  const clean = code.trim().toUpperCase();

  // 1. Try Postgres DB first (source of truth)
  if (isDbAvailable()) {
    try {
      const dbTeam = await prisma.hackathonTeam.findUnique({
        where: { inviteCode: clean },
        include: {
          hackathon: true,
          participants: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (dbTeam) {
        // If hackathonIdOrSlug is provided, validate hackathon match
        if (hackathonIdOrSlug) {
          const target = hackathonIdOrSlug.trim();
          const cleanSlug = target.replace(/^gh-/, "");
          const matches =
            dbTeam.hackathonId === target ||
            dbTeam.hackathon?.slug === target ||
            dbTeam.hackathon?.slug === cleanSlug ||
            dbTeam.hackathon?.id === target;

          if (!matches && dbTeam.hackathon?.slug && cleanSlug !== "shipathon-2026") {
            console.warn(`[getTeamByCode] Hackathon mismatch for team ${clean}:`, {
              dbHackathon: dbTeam.hackathon?.slug,
              requested: target,
            });
            return null;
          }
        }

        const captain = dbTeam.participants.find((p) => p.isCaptain) || dbTeam.participants[0];
        const teamObj: HackathonTeam = {
          id: dbTeam.id,
          hackathonId: dbTeam.hackathonId,
          name: dbTeam.name,
          inviteCode: dbTeam.inviteCode,
          captainId: captain?.ticketNumber || "",
          members: dbTeam.participants.map((p) => ({
            id: p.id,
            hackathonId: p.hackathonId,
            ticketNumber: p.ticketNumber,
            name: p.name,
            email: p.email,
            roleTitle: p.roleTitle,
            bio: p.bio ?? undefined,
            discordHandle: p.discordHandle ?? undefined,
            twitterHandle: p.twitterHandle ?? undefined,
            avatarUrl: p.avatarUrl ?? undefined,
            themeStyle: (p.themeStyle as HackathonTheme) || "lime",
            isCaptain: p.isCaptain,
            teamId: dbTeam.id,
            teamName: dbTeam.name,
            teamCode: dbTeam.inviteCode,
            createdAt: p.createdAt.toISOString(),
          })),
          createdAt: dbTeam.createdAt.toISOString(),
        };

        // Cache into memory & disk
        memoryStore.teams.set(clean, teamObj);
        writeToDiskTeam(teamObj);
        return teamObj;
      }
    } catch (e) {
      console.warn("Could not query team from DB:", e);
    }
  }

  // 2. Check memory store
  const memTeam = memoryStore.teams.get(clean);
  if (memTeam) return memTeam;

  // 3. Disk fallback
  const diskTeam = getPersistedTeamByCode(clean);
  if (diskTeam) {
    memoryStore.teams.set(clean, diskTeam);
    return diskTeam;
  }

  return null;
}

function writeToDiskTeam(team: HackathonTeam) {
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
  } catch (e) {
    console.warn("writeToDiskTeam error:", e);
  }
}

/**
 * Add a participant to a team. Works with both in-memory participant objects
 * (during registration) and ticket-number lookups (post-registration joins).
 */
export async function addMemberToTeam(params: {
  teamCode: string;
  participantTicket?: string;
  participantObj?: HackathonParticipant;
  hackathonId?: string;
}): Promise<{ success: boolean; team?: HackathonTeam; participant?: HackathonParticipant; error?: string }> {
  const code = (params.teamCode || "").trim().toUpperCase();
  if (!code) {
    return { success: false, error: "Please enter a valid team invite code." };
  }

  // Look up team from DB first, then memory & disk
  const team = await getTeamByCode(code, params.hackathonId);
  if (!team) {
    return {
      success: false,
      error: `Team with invite code "${code}" was not found. Please check the code and try again.`,
    };
  }

  let participant = params.participantObj;
  if (!participant && params.participantTicket) {
    participant =
      memoryStore.participants.get(params.participantTicket.toUpperCase()) ||
      getPersistedParticipantByTicket(params.participantTicket) ||
      undefined;
  }

  // If still not found, try DB lookup for participant
  if (!participant && params.participantTicket && isDbAvailable()) {
    try {
      const dbP = await prisma.hackathonParticipant.findUnique({
        where: { ticketNumber: params.participantTicket.trim().toUpperCase() },
      });
      if (dbP) {
        participant = {
          id: dbP.id,
          hackathonId: dbP.hackathonId,
          ticketNumber: dbP.ticketNumber,
          name: dbP.name,
          email: dbP.email,
          roleTitle: dbP.roleTitle,
          bio: dbP.bio ?? undefined,
          discordHandle: dbP.discordHandle ?? undefined,
          twitterHandle: dbP.twitterHandle ?? undefined,
          avatarUrl: dbP.avatarUrl ?? undefined,
          themeStyle: (dbP.themeStyle as HackathonTheme) || "lime",
          isCaptain: dbP.isCaptain,
          teamId: dbP.teamId ?? undefined,
          createdAt: dbP.createdAt.toISOString(),
        };
      }
    } catch (e) {
      console.warn("Could not find participant in DB:", e);
    }
  }

  if (!participant) {
    return { success: false, error: "Participant not found." };
  }

  // Check if already a member
  const alreadyMember = team.members.some(
    (m) =>
      m.ticketNumber.toUpperCase() === participant!.ticketNumber.toUpperCase() ||
      (participant!.email && m.email && m.email.trim().toLowerCase() === participant!.email.trim().toLowerCase())
  );

  // Check capacity (max 4 builders per squad)
  if (!alreadyMember && team.members.length >= 4) {
    return { success: false, error: "This squad has reached the maximum number of members (4)." };
  }

  // Update participant squad fields
  participant.teamId = team.id;
  participant.teamName = team.name;
  participant.teamCode = team.inviteCode;
  participant.isCaptain = !!(
    team.captainId && team.captainId.toUpperCase() === participant.ticketNumber.toUpperCase()
  );

  // Add to team members list if not already present
  if (!alreadyMember) {
    team.members.push({ ...participant, isCaptain: participant.isCaptain });
  }

  // DB: upsert team first, then upsert participant with team FK (all awaited)
  if (isDbAvailable()) {
    try {
      const hackathonId = await getHackathonDbId(params.hackathonId || team.hackathonId);

      // Ensure team exists in DB
      const dbTeam = await prisma.hackathonTeam.upsert({
        where: { inviteCode: team.inviteCode.toUpperCase() },
        update: { name: team.name },
        create: {
          id: team.id,
          hackathonId,
          name: team.name,
          inviteCode: team.inviteCode.toUpperCase(),
        },
      });

      // Update participant's teamId in DB
      await prisma.hackathonParticipant.upsert({
        where: { ticketNumber: participant.ticketNumber.trim().toUpperCase() },
        update: {
          teamId: dbTeam.id,
          isCaptain: participant.isCaptain,
        },
        create: {
          id: participant.id || `part-${Date.now()}`,
          hackathonId,
          ticketNumber: participant.ticketNumber.trim().toUpperCase(),
          name: participant.name.trim(),
          email: participant.email?.trim() || "",
          roleTitle: participant.roleTitle?.trim() || "Fullstack & AI Engineer",
          bio: participant.bio?.trim() || null,
          discordHandle: participant.discordHandle?.trim() || null,
          twitterHandle: participant.twitterHandle?.trim() || null,
          avatarUrl: participant.avatarUrl || null,
          themeStyle: participant.themeStyle || "lime",
          isCaptain: participant.isCaptain,
          teamId: dbTeam.id,
        },
      });

      // Refetch full roster from DB to guarantee 100% database truth
      const dbMembers = await prisma.hackathonParticipant.findMany({
        where: { teamId: dbTeam.id },
        orderBy: { createdAt: "asc" },
      });

      if (dbMembers.length > 0) {
        team.members = dbMembers.map((p) => ({
          id: p.id,
          hackathonId: p.hackathonId,
          ticketNumber: p.ticketNumber,
          name: p.name,
          email: p.email,
          roleTitle: p.roleTitle,
          bio: p.bio ?? undefined,
          discordHandle: p.discordHandle ?? undefined,
          twitterHandle: p.twitterHandle ?? undefined,
          avatarUrl: p.avatarUrl ?? undefined,
          themeStyle: (p.themeStyle as HackathonTheme) || "lime",
          isCaptain: p.isCaptain,
          teamId: dbTeam.id,
          teamName: dbTeam.name,
          teamCode: dbTeam.inviteCode,
          createdAt: p.createdAt.toISOString(),
        }));
      }
    } catch (e) {
      console.warn("[addMemberToTeam] DB error:", e);
    }
  }

  const squadRoster = team.members.map((m) => ({
    name: m.name,
    roleTitle: m.roleTitle,
    avatarUrl: m.avatarUrl,
  }));
  participant.teammates = squadRoster;

  // Persist everywhere
  persistTeam(team);
  persistParticipant(participant);
  syncTeamParticipants(team);

  return { success: true, team, participant };
}

/**
 * Create a new team and assign the creator as Captain.
 */
export async function createNewTeam(params: {
  teamName: string;
  creatorTicket?: string;
  creatorParticipant?: HackathonParticipant;
  hackathonId?: string;
}): Promise<{ success: boolean; team?: HackathonTeam; participant?: HackathonParticipant; error?: string }> {
  const name = params.teamName?.trim();
  if (!name) return { success: false, error: "Team name is required." };

  let creator = params.creatorParticipant;
  if (!creator && params.creatorTicket) {
    creator =
      memoryStore.participants.get(params.creatorTicket.toUpperCase()) ||
      getPersistedParticipantByTicket(params.creatorTicket) ||
      undefined;
  }

  if (!creator && params.creatorTicket && isDbAvailable()) {
    try {
      const dbP = await prisma.hackathonParticipant.findUnique({
        where: { ticketNumber: params.creatorTicket.trim().toUpperCase() },
      });
      if (dbP) {
        creator = {
          id: dbP.id,
          hackathonId: dbP.hackathonId,
          ticketNumber: dbP.ticketNumber,
          name: dbP.name,
          email: dbP.email,
          roleTitle: dbP.roleTitle,
          bio: dbP.bio ?? undefined,
          discordHandle: dbP.discordHandle ?? undefined,
          twitterHandle: dbP.twitterHandle ?? undefined,
          avatarUrl: dbP.avatarUrl ?? undefined,
          themeStyle: (dbP.themeStyle as HackathonTheme) || "lime",
          isCaptain: dbP.isCaptain,
          teamId: dbP.teamId ?? undefined,
          createdAt: dbP.createdAt.toISOString(),
        };
      }
    } catch (e) {
      console.warn("Could not find creator in DB:", e);
    }
  }

  if (!creator) return { success: false, error: "Creator participant not found." };

  // Generate unique invite code (e.g. TEAM-3508 or HACK-8921)
  const prefix = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "TEAM";
  const rand = Math.floor(1000 + Math.random() * 9000);
  const inviteCode = `${prefix}-${rand}`;
  const teamId = `team-${Date.now()}`;

  // Update creator
  creator.teamId = teamId;
  creator.teamName = name;
  creator.teamCode = inviteCode;
  creator.isCaptain = true;
  creator.teammates = [{ name: creator.name, roleTitle: creator.roleTitle, avatarUrl: creator.avatarUrl }];

  const newTeam: HackathonTeam = {
    id: teamId,
    hackathonId: params.hackathonId || creator.hackathonId || FALLBACK_HACKATHON_ID,
    name,
    inviteCode,
    captainId: creator.ticketNumber,
    members: [{ ...creator }],
    createdAt: new Date().toISOString(),
  };

  // DB: upsert hackathon → team → participant (sequential, all awaited)
  if (isDbAvailable()) {
    try {
      const hackathonId = await getHackathonDbId(params.hackathonId || creator.hackathonId);

      const dbTeam = await prisma.hackathonTeam.upsert({
        where: { inviteCode: inviteCode.toUpperCase() },
        update: { name: name.trim() },
        create: {
          id: teamId,
          hackathonId,
          name: name.trim(),
          inviteCode: inviteCode.toUpperCase(),
        },
      });

      newTeam.id = dbTeam.id;
      creator.teamId = dbTeam.id;

      await prisma.hackathonParticipant.upsert({
        where: { ticketNumber: creator.ticketNumber.trim().toUpperCase() },
        update: { teamId: dbTeam.id, isCaptain: true },
        create: {
          id: creator.id || `part-${Date.now()}`,
          hackathonId,
          ticketNumber: creator.ticketNumber.trim().toUpperCase(),
          name: creator.name.trim(),
          email: creator.email?.trim() || "",
          roleTitle: creator.roleTitle?.trim() || "Fullstack & AI Engineer",
          bio: creator.bio?.trim() || null,
          discordHandle: creator.discordHandle?.trim() || null,
          twitterHandle: creator.twitterHandle?.trim() || null,
          avatarUrl: creator.avatarUrl || null,
          themeStyle: creator.themeStyle || "lime",
          isCaptain: true,
          teamId: dbTeam.id,
        },
      });
    } catch (e) {
      console.warn("[createNewTeam] DB error:", e);
    }
  }

  // Memory & Disk cache
  persistTeam(newTeam);
  persistParticipant(creator);

  return { success: true, team: newTeam, participant: creator };
}

/**
 * Leave current team and revert to Solo Builder.
 */
export async function leaveCurrentTeam(participantTicket: string): Promise<{ success: boolean; error?: string }> {
  const clean = participantTicket.trim().toUpperCase();
  const participant =
    memoryStore.participants.get(clean) ||
    getPersistedParticipantByTicket(clean);

  if (!participant || (!participant.teamCode && !participant.teamId)) {
    return { success: false, error: "Participant is not currently in a team." };
  }

  const oldCode = participant.teamCode;
  const oldTeamId = participant.teamId;

  if (isDbAvailable()) {
    try {
      await prisma.hackathonParticipant.update({
        where: { ticketNumber: clean },
        data: { teamId: null, isCaptain: false },
      });
    } catch (e) {
      console.warn("[leaveCurrentTeam] DB error:", e);
    }
  }

  if (oldCode || oldTeamId) {
    const team =
      (oldCode ? await getTeamByCode(oldCode) : null) ||
      loadPersistedTeams().find((t) => t.id === oldTeamId) ||
      null;

    if (team) {
      team.members = team.members.filter((m) => m.ticketNumber.toUpperCase() !== clean);
      if (team.captainId?.toUpperCase() === clean && team.members.length > 0) {
        team.captainId = team.members[0].ticketNumber;
        team.members[0].isCaptain = true;
      }
      persistTeam(team);
      syncTeamParticipants(team);
    }
  }

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
export function syncTeamParticipants(team: HackathonTeam) {
  try {
    const squadRoster = team.members.map((m) => ({
      name: m.name,
      roleTitle: m.roleTitle,
      avatarUrl: m.avatarUrl,
    }));

    // Update memoryStore
    for (const p of memoryStore.participants.values()) {
      if (p.teamCode && p.teamCode.toUpperCase() === team.inviteCode.toUpperCase()) {
        p.teamName = team.name;
        p.teamId = team.id;
        p.teammates = squadRoster;
      }
    }

    // Update disk JSON
    const participants = loadPersistedParticipants();
    let changed = false;
    for (const p of participants) {
      if (p.teamCode && p.teamCode.toUpperCase() === team.inviteCode.toUpperCase()) {
        p.teamName = team.name;
        p.teamId = team.id;
        p.teammates = squadRoster;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(participants, null, 2), "utf-8");
    }
  } catch (e) {
    console.warn("[syncTeamParticipants] error:", e);
  }
}
