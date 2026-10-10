/**
 * GoHackerz Hackathons Domain Layer
 * Handles events, registrations, team formations, tickets, and lightweight link submissions.
 */

export type HackathonTrack = {
  id: string;
  title: string;
  prize: string;
  description: string;
  tags: string[];
};

export type HackathonScheduleItem = {
  time: string;
  title: string;
  description: string;
  status: "completed" | "active" | "upcoming";
};

export type HackathonSponsor = {
  name: string;
  tier: "Title" | "Platinum" | "Gold";
  perk: string;
  logoText: string;
};

export type HackathonTheme = "lime" | "purple" | "sky" | "pink" | "amber";

export type HackathonData = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  coverImage?: string;
  status: "UPCOMING" | "ACTIVE" | "JUDGING" | "COMPLETED";
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  prizePool: string;
  participantCount: number;
  teamCount: number;
  tracks: HackathonTrack[];
  schedule: HackathonScheduleItem[];
  rules: string[];
  sponsors: HackathonSponsor[];
  faqs: { q: string; a: string }[];
};

export type HackathonParticipant = {
  id: string;
  hackathonId: string;
  ticketNumber: string;
  name: string;
  email: string;
  roleTitle: string; // e.g. "Fullstack & AI", "Systems Architect"
  bio?: string;
  discordHandle?: string;
  twitterHandle?: string;
  avatarUrl?: string;
  themeStyle: HackathonTheme;
  isCaptain: boolean;
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  teammates?: { name: string; roleTitle: string; avatarUrl?: string }[];
  submission?: HackathonSubmission;
  certificate?: HackathonCertificate;
  badges?: string[];
  createdAt: string;
};

export type HackathonTeam = {
  id: string;
  hackathonId: string;
  name: string;
  tagline?: string;
  inviteCode: string;
  captainId: string;
  members: HackathonParticipant[];
  createdAt: string;
};

export type HackathonSubmission = {
  id: string;
  hackathonId: string;
  ticketNumber?: string;
  teamName?: string;
  trackId: string;
  title: string;
  tagline: string;
  description: string;
  repoUrl: string;
  demoUrl?: string;
  pitchDeckUrl?: string; // PPT, Gamma, Google Slides, Pitch
  videoUrl?: string; // YouTube, Loom
  gammaUrl?: string; // Gamma presentation URL
  techStack: string[];
  authorName: string;
  createdAt: string;
  upvotes?: number;
};

export type CertificateType =
  | "PARTICIPATION"
  | "WINNER_FIRST"
  | "WINNER_SECOND"
  | "WINNER_THIRD"
  | "TRACK_WINNER"
  | "HONORABLE_MENTION";

export type HackathonCertificate = {
  id: string;
  certNumber: string;
  hackathonId: string;
  participantId: string;
  ticketNumber: string;
  userId?: string;
  type: CertificateType;
  title: string;
  awardTitle: string;
  recipientName: string;
  roleTitle?: string;
  projectName?: string;
  teamName?: string;
  trackName?: string;
  rank?: number;
  issuedAt: string;
  verificationUrl?: string;
};

// Flagship Inaugural Hackathon
export const FLAGSHIP_HACKATHON: HackathonData = {
  id: "gh-shipathon-2026",
  slug: "shipathon-2026",
  title: "GoHackerz Global Shipathon 2026",
  tagline: "Build with Edge & AI. Ship in 48 hours. Win Cash Grants & Prestige.",
  description:
    "The premier hackathon for the builders who ship. Assemble a team or ride solo, build bleeding-edge apps using AI Agents, Edge Infrastructure, and High-Performance Web systems. Every participant earns their official Holographic Hacker Passport.",
  status: "ACTIVE",
  startDate: "2026-10-10T00:00:00Z",
  endDate: "2026-10-12T23:59:59Z",
  submissionDeadline: "2026-10-12T20:00:00Z",
  prizePool: "Cash Grants + Trophy + Cloud Credits",
  participantCount: 342,
  teamCount: 94,
  tracks: [
    {
      id: "ai-agents",
      title: "Autonomous AI Agents & Workflows",
      prize: "Cash Grant + Cloud Credits",
      description:
        "Build autonomous multi-agent systems, code copilots, memory-augmented LLM chains, or proactive background helpers.",
      tags: ["AI", "Agents", "LangChain", "Vector DBs", "OpenAI/Claude"],
    },
    {
      id: "edge-systems",
      title: "Edge Architecture & High-Performance Web",
      prize: "Cash Grant + Cloud Credits",
      description:
        "Ultra-low latency web apps, distributed real-time systems, CRDTs, edge functions, and local-first software.",
      tags: ["Edge", "Wasm", "Distributed", "Realtime", "Next.js"],
    },
    {
      id: "devex-tools",
      title: "Developer Tools & Open Source Infrastructure",
      prize: "Cash Grant + Cloud Credits",
      description:
        "Tools that save engineers hours every week. CLI utilities, testing frameworks, observability pipelines, and code visualizers.",
      tags: ["DevEx", "CLI", "Rust/Go", "Prisma", "Observability"],
    },
  ],
  schedule: [
    {
      time: "Day 1 · 09:00 UTC",
      title: "Opening Keynote & Hacking Kickoff",
      description: "Live broadcast, theme reveal, and official timer starts.",
      status: "active",
    },
    {
      time: "Day 1 · 18:00 UTC",
      title: "Mentor Office Hours & Team Pitch Check-in",
      description: "Get feedback on architecture from GoHackerz engineering leads.",
      status: "upcoming",
    },
    {
      time: "Day 2 · 14:00 UTC",
      title: "Soft Submission & Deck Polish",
      description: "Test your live demo links, upload Gamma pitch decks and YouTube walkthroughs.",
      status: "upcoming",
    },
    {
      time: "Day 2 · 20:00 UTC",
      title: "Final Submission Deadline",
      description: "Hacking stops. Submission links lock for judge deliberation.",
      status: "upcoming",
    },
    {
      time: "Day 3 · 18:00 UTC",
      title: "Grand Finale, Demos & Winners Ceremony",
      description: "Top 5 teams demo live, prize distribution, and profile trophy badges awarded.",
      status: "upcoming",
    },
  ],
  rules: [
    "All code must be fresh and written during the hackathon window. Open-source libraries and APIs are permitted.",
    "Teams can consist of 1 to 4 hackers.",
    "Submissions must include a GitHub repository, working demo or video, and pitch deck (Gamma / PPT / Google Slides).",
    "Respect the hacker code of conduct: share knowledge, respect fellow builders, and have fun!",
  ],
  sponsors: [
    { name: "Supabase", tier: "Title", perk: "Free Pro tier + Vector DB credits", logoText: "⚡ Supabase" },
    { name: "Vercel", tier: "Platinum", perk: "Enterprise edge deployment credits", logoText: "▲ Vercel" },
    { name: "Prisma", tier: "Platinum", perk: "Prisma Accelerate & Pulse grants", logoText: "◬ Prisma" },
    { name: "Gamma", tier: "Gold", perk: "AI presentation generation plus credits", logoText: "✦ Gamma" },
  ],
  faqs: [
    {
      q: "Can I participate solo or do I need a team?",
      a: "Both! You can hack completely solo or form a team of up to 4 members. You can generate a team invite code to invite friends at any time.",
    },
    {
      q: "How does the animated Hacker Passport work?",
      a: "Once you register, you receive an interactive 3D holographic Hacker Passport with your unique Ticket ID and scannable QR code. You can download it as an image, share it to Twitter/X, and show off your team credentials.",
    },
    {
      q: "What do I need to submit when finished?",
      a: "Submissions are 100% lightweight link-based! You just need: your GitHub repo, your Live Demo link, your Pitch Deck (Gamma or PPT/Google Slides link), and an optional YouTube/Loom video demo.",
    },
    {
      q: "Is there any registration fee?",
      a: "Zero fee. GoHackerz hackathons are 100% free and open to all passionate developers, students, and engineers worldwide.",
    },
  ],
};

// Seed sample participants for demonstration and ticket exploration
const SEED_PARTICIPANTS: HackathonParticipant[] = [
  {
    id: "part-01",
    hackathonId: "gh-shipathon-2026",
    ticketNumber: "GH-2026-X89B",
    name: "Alex Vance",
    email: "alex@gohackerz.dev",
    roleTitle: "Lead Systems Architect",
    bio: "Obsessed with CRDTs, Rust edge workers, and distributed state machines.",
    discordHandle: "alexvance#404",
    twitterHandle: "@alexv_dev",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    themeStyle: "lime",
    isCaptain: true,
    teamId: "team-void",
    teamName: "Team Void Runners",
    teamCode: "VOID-42",
    teammates: [
      { name: "Alex Vance", roleTitle: "Systems Architect" },
      { name: "Sarah Chen", roleTitle: "AI & Vector Search" },
      { name: "Dev Patel", roleTitle: "Fullstack / Next.js" },
    ],
    submission: {
      id: "sub-01",
      hackathonId: "gh-shipathon-2026",
      ticketNumber: "GH-2026-X89B",
      teamName: "Team Void Runners",
      trackId: "ai-agents",
      title: "PulseFlow AI: Autonomous PR Review Swarm",
      tagline: "Multi-agent swarm that stress-tests, reproduces race conditions, and drafts PR fixes automatically.",
      description:
        "PulseFlow connects to your GitHub repository and spins up a swarm of specialized agent personas (Security Auditor, Performance Benchmark, and Spec Verifier) to review PRs in seconds.",
      repoUrl: "https://github.com/gohackerz/pulseflow-ai",
      demoUrl: "https://pulseflow.gohackerz.dev",
      pitchDeckUrl: "https://gamma.app/docs/pulseflow-ai-pitch",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gammaUrl: "https://gamma.app/docs/pulseflow-ai-pitch",
      techStack: ["Next.js 15", "TypeScript", "LangChain", "Supabase Vector", "Prisma"],
      authorName: "Alex Vance",
      createdAt: "2026-10-11T16:20:00Z",
      upvotes: 48,
    },
    createdAt: "2026-09-28T12:00:00Z",
  },
  {
    id: "part-02",
    hackathonId: "gh-shipathon-2026",
    ticketNumber: "GH-2026-N309",
    name: "Elena Rostova",
    email: "elena@matrix.io",
    roleTitle: "Fullstack AI Engineer",
    bio: "Building local-first speech synthesis and browser LLM inference engines.",
    discordHandle: "elena_r#892",
    twitterHandle: "@elena_builds",
    themeStyle: "purple",
    isCaptain: false,
    teamName: "Neural Forge",
    teamCode: "FORGE-99",
    teammates: [
      { name: "Elena Rostova", roleTitle: "AI Engineer" },
      { name: "Marcus Brody", roleTitle: "UI/UX Wizard" },
    ],
    submission: {
      id: "sub-02",
      hackathonId: "gh-shipathon-2026",
      ticketNumber: "GH-2026-N309",
      teamName: "Neural Forge",
      trackId: "edge-systems",
      title: "EdgeWhisper: Zero-Server On-Device Voice Intelligence",
      tagline: "Ultra-fast voice-to-structured-data engine running 100% inside WebAssembly on Edge.",
      description:
        "Transforms long voice memos into actionable Linear tickets and architectural docs with zero cloud latency and total privacy.",
      repoUrl: "https://github.com/gohackerz/edgewhisper",
      demoUrl: "https://edgewhisper.dev",
      pitchDeckUrl: "https://gamma.app/docs/edgewhisper-deck",
      videoUrl: "https://youtube.com",
      gammaUrl: "https://gamma.app/docs/edgewhisper-deck",
      techStack: ["WebAssembly", "Wasm-pack", "Next.js", "Tailwind CSS"],
      authorName: "Elena Rostova",
      createdAt: "2026-10-11T18:45:00Z",
      upvotes: 35,
    },
    createdAt: "2026-09-28T14:30:00Z",
  },
];

import { prisma, isDbAvailable } from "./prisma";
import {
  loadPersistedParticipants,
  persistParticipant,
  persistParticipantToDb,
  getPersistedParticipantByTicket,
  persistTeam,
  loadPersistedTeams,
  getPersistedTeamByCode,
  addMemberToTeam,
  createNewTeam,
  leaveCurrentTeam,
  syncTeamParticipants,
  persistSubmission,
  loadPersistedSubmissions,
  memoryStore,
} from "./participant-store";


// Note: memoryStore is imported from ./participant-store and shared via globalThis._ghMemStore
// The hackathonStore below provides a disk-seeded initial state but is no longer the primary store.
interface GlobalHackathonStore {
  participants: Map<string, HackathonParticipant>;
  teams: Map<string, HackathonTeam>;
  submissions: Map<string, HackathonSubmission>;
}

const globalForHackathons = globalThis as unknown as {
  hackathonStore?: GlobalHackathonStore;
};

if (!globalForHackathons.hackathonStore) {
  const persistedParticipants = loadPersistedParticipants();
  const allInitial = [...SEED_PARTICIPANTS];
  for (const p of persistedParticipants) {
    const existingIdx = allInitial.findIndex(
      (s) => s.ticketNumber.toUpperCase() === p.ticketNumber.toUpperCase()
    );
    if (existingIdx >= 0) {
      allInitial[existingIdx] = p;
    } else {
      allInitial.push(p);
    }
  }

  globalForHackathons.hackathonStore = {
    participants: new Map<string, HackathonParticipant>(
      allInitial.map((p) => [p.ticketNumber, p])
    ),
    teams: new Map<string, HackathonTeam>(
      loadPersistedTeams().map((t) => [t.inviteCode, t])
    ),
    submissions: new Map<string, HackathonSubmission>(
      allInitial
        .filter((p) => p.submission)
        .map((p) => [p.submission!.id, p.submission!])
    ),
  };

  // Seed memoryStore from disk on startup
  for (const [k, v] of globalForHackathons.hackathonStore.participants) {
    memoryStore.participants.set(k, v);
  }
  for (const [k, v] of globalForHackathons.hackathonStore.teams) {
    memoryStore.teams.set(k, v);
  }
}

const hackathonStore = globalForHackathons.hackathonStore!;


// Generate clean unique ticket ID (e.g. GH-2026-A82F)
export function generateTicketNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GH-2026-${code}`;
}

// Generate team invite code (e.g. HACK-7X9B)
export function generateTeamCode(teamName: string): string {
  const prefix = teamName.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "TEAM";
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
}

export async function getHackathonBySlug(slug: string): Promise<HackathonData | null> {
  const cleanSlug = slug.replace(/^gh-/, "");
  let liveStatus = FLAGSHIP_HACKATHON.status;

  if (isDbAvailable()) {
    try {
      const dbH = await prisma.hackathon.findFirst({
        where: {
          OR: [
            { slug: slug },
            { slug: cleanSlug },
            { id: slug },
            { id: `gh-${cleanSlug}` },
            { slug: "shipathon-2026" },
          ],
        },
        select: { status: true, title: true, tagline: true, prizePool: true },
      });
      if (dbH) {
        liveStatus = dbH.status as any;
      }
    } catch (e) {
      console.warn("[getHackathonBySlug] DB status query notice:", e);
    }
  }

  if (
    slug === FLAGSHIP_HACKATHON.slug ||
    cleanSlug === "shipathon-2026" ||
    slug === "active" ||
    slug === "current"
  ) {
    return {
      ...FLAGSHIP_HACKATHON,
      status: liveStatus,
      participantCount: Math.max(
        FLAGSHIP_HACKATHON.participantCount,
        FLAGSHIP_HACKATHON.participantCount + memoryStore.participants.size - SEED_PARTICIPANTS.length
      ),
      teamCount: Math.max(FLAGSHIP_HACKATHON.teamCount, FLAGSHIP_HACKATHON.teamCount + memoryStore.teams.size),
    };
  }
  return null;
}

export async function getAllHackathons(): Promise<HackathonData[]> {
  const flagship = await getHackathonBySlug(FLAGSHIP_HACKATHON.slug);
  return flagship ? [flagship] : [FLAGSHIP_HACKATHON];
}

export async function getParticipantByTicket(ticketNumber: string): Promise<HackathonParticipant | null> {
  if (!ticketNumber) return null;
  const clean = decodeURIComponent(ticketNumber).replace(/^#/, "").trim().toUpperCase();

  // 1. Query Postgres Database FIRST when available - it is the canonical source for team membership
  if (isDbAvailable()) {
    try {
      const dbRow = await prisma.hackathonParticipant.findUnique({
        where: { ticketNumber: clean },
        include: {
          team: {
            include: {
              participants: true,
            },
          },
          submissions: true,
          certificates: {
            orderBy: { issuedAt: "desc" },
            take: 1,
          },
        },
      });

      if (dbRow) {
        // Resolve submission from DB relation or team submission or disk
        let submission: HackathonSubmission | undefined = undefined;
        let rawSub = dbRow.submissions?.[0];
        if (!rawSub && dbRow.teamId) {
          try {
            rawSub = await prisma.hackathonSubmission.findFirst({
              where: { teamId: dbRow.teamId },
              orderBy: { createdAt: "desc" },
            }) as any;
          } catch {}
        }

        if (rawSub) {
          submission = {
            id: rawSub.id,
            hackathonId: dbRow.hackathonId,
            ticketNumber: dbRow.ticketNumber,
            teamName: dbRow.team?.name ?? undefined,
            trackId: rawSub.trackId || "general",
            title: rawSub.title,
            tagline: rawSub.tagline,
            description: rawSub.description,
            repoUrl: rawSub.repoUrl,
            demoUrl: rawSub.demoUrl || undefined,
            pitchDeckUrl: rawSub.pitchDeckUrl || undefined,
            videoUrl: rawSub.videoUrl || undefined,
            gammaUrl: rawSub.gammaUrl || undefined,
            techStack: (rawSub.techStack as string[]) || [],
            authorName: dbRow.name,
            createdAt: rawSub.createdAt.toISOString(),
            upvotes: 1,
          };
        } else {
          const diskSubs = loadPersistedSubmissions();
          const match = diskSubs.find(
            (s) =>
              s.ticketNumber?.toUpperCase() === clean ||
              (dbRow.team?.name && s.teamName && s.teamName.toLowerCase() === dbRow.team.name.toLowerCase())
          );
          if (match) submission = match;
        }

        let certificate: HackathonCertificate | undefined = undefined;
        const rawCert = dbRow.certificates?.[0];
        if (rawCert) {
          certificate = {
            id: rawCert.id,
            certNumber: rawCert.certNumber,
            hackathonId: dbRow.hackathonId,
            participantId: dbRow.id,
            ticketNumber: dbRow.ticketNumber,
            type: rawCert.type as CertificateType,
            title: rawCert.title,
            awardTitle: rawCert.awardTitle,
            recipientName: rawCert.recipientName,
            roleTitle: dbRow.roleTitle,
            projectName: rawCert.projectName || submission?.title || undefined,
            teamName: rawCert.teamName || dbRow.team?.name || undefined,
            trackName: rawCert.trackName || submission?.trackId || undefined,
            rank: rawCert.rank || undefined,
            issuedAt: rawCert.issuedAt.toISOString(),
            verificationUrl: `/verify/${rawCert.certNumber}`,
          };
        }

        const participant: HackathonParticipant = {
          id: dbRow.id,
          hackathonId: dbRow.hackathonId,
          ticketNumber: dbRow.ticketNumber,
          name: dbRow.name,
          email: dbRow.email,
          roleTitle: dbRow.roleTitle || "Fullstack & AI Engineer",
          bio: dbRow.bio ?? undefined,
          discordHandle: dbRow.discordHandle ?? undefined,
          twitterHandle: dbRow.twitterHandle ?? undefined,
          avatarUrl: dbRow.avatarUrl ?? undefined,
          themeStyle: (dbRow.themeStyle as HackathonTheme) || "lime",
          isCaptain: dbRow.isCaptain,
          teamId: dbRow.teamId ?? undefined,
          teamName: dbRow.team?.name ?? undefined,
          teamCode: dbRow.team?.inviteCode ?? undefined,
          teammates: dbRow.team?.participants.map((p) => ({
            name: p.name,
            roleTitle: p.roleTitle,
            avatarUrl: p.avatarUrl ?? undefined,
          })),
          submission,
          certificate,
          createdAt: dbRow.createdAt.toISOString(),
        };

        // Cache into disk and memory
        persistParticipant(participant);
        memoryStore.participants.set(clean, participant);
        return participant;
      }
    } catch (e) {
      console.warn("Could not query participant from DB:", e);
    }
  }

  // 2. Fallback to persistent disk storage
  const persisted = getPersistedParticipantByTicket(clean);
  if (persisted) {
    if (!persisted.submission) {
      const diskSubs = loadPersistedSubmissions();
      const match = diskSubs.find(
        (s) =>
          s.ticketNumber?.toUpperCase() === clean ||
          (persisted.teamName && s.teamName && s.teamName.toLowerCase() === persisted.teamName.toLowerCase())
      );
      if (match) persisted.submission = match;
    }
    memoryStore.participants.set(clean, persisted);
    return persisted;
  }

  // 3. Fallback to memory store if not yet flushed
  const direct = memoryStore.participants.get(clean);
  if (direct) {
    if (!direct.submission) {
      const diskSubs = loadPersistedSubmissions();
      const match = diskSubs.find((s) => s.ticketNumber?.toUpperCase() === clean);
      if (match) direct.submission = match;
    }
    return direct;
  }

  for (const [key, val] of memoryStore.participants.entries()) {
    if (key.toUpperCase() === clean) {
      if (!val.submission) {
        const diskSubs = loadPersistedSubmissions();
        const match = diskSubs.find((s) => s.ticketNumber?.toUpperCase() === clean);
        if (match) val.submission = match;
      }
      return val;
    }
  }

  return null;
}

export async function getParticipantByEmail(
  hackathonId: string,
  email: string
): Promise<HackathonParticipant | null> {
  if (!email) return null;
  const target = email.trim().toLowerCase();

  // 1. Query Postgres Database FIRST when available (canonical source)
  if (isDbAvailable()) {
    try {
      const dbRow = await prisma.hackathonParticipant.findFirst({
        where: {
          email: target,
        },
        include: {
          team: {
            include: { participants: true },
          },
          submissions: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (dbRow) {
        let submission: HackathonSubmission | undefined = undefined;
        let rawSub = dbRow.submissions?.[0];
        if (!rawSub && dbRow.teamId) {
          try {
            rawSub = await prisma.hackathonSubmission.findFirst({
              where: { teamId: dbRow.teamId },
              orderBy: { createdAt: "desc" },
            }) as any;
          } catch {}
        }

        if (rawSub) {
          submission = {
            id: rawSub.id,
            hackathonId: dbRow.hackathonId,
            ticketNumber: dbRow.ticketNumber,
            teamName: dbRow.team?.name ?? undefined,
            trackId: rawSub.trackId || "general",
            title: rawSub.title,
            tagline: rawSub.tagline,
            description: rawSub.description,
            repoUrl: rawSub.repoUrl,
            demoUrl: rawSub.demoUrl || undefined,
            pitchDeckUrl: rawSub.pitchDeckUrl || undefined,
            videoUrl: rawSub.videoUrl || undefined,
            gammaUrl: rawSub.gammaUrl || undefined,
            techStack: (rawSub.techStack as string[]) || [],
            authorName: dbRow.name,
            createdAt: rawSub.createdAt.toISOString(),
            upvotes: 1,
          };
        } else {
          const diskSubs = loadPersistedSubmissions();
          const match = diskSubs.find(
            (s) =>
              s.ticketNumber?.toUpperCase() === dbRow.ticketNumber.toUpperCase() ||
              (dbRow.team?.name && s.teamName && s.teamName.toLowerCase() === dbRow.team.name.toLowerCase())
          );
          if (match) submission = match;
        }

        const participant: HackathonParticipant = {
          id: dbRow.id,
          hackathonId: dbRow.hackathonId,
          ticketNumber: dbRow.ticketNumber,
          name: dbRow.name,
          email: dbRow.email,
          roleTitle: dbRow.roleTitle || "Fullstack & AI Engineer",
          bio: dbRow.bio ?? undefined,
          discordHandle: dbRow.discordHandle ?? undefined,
          twitterHandle: dbRow.twitterHandle ?? undefined,
          avatarUrl: dbRow.avatarUrl ?? undefined,
          themeStyle: (dbRow.themeStyle as HackathonTheme) || "lime",
          isCaptain: dbRow.isCaptain,
          teamId: dbRow.teamId ?? undefined,
          teamName: dbRow.team?.name ?? undefined,
          teamCode: dbRow.team?.inviteCode ?? undefined,
          teammates: dbRow.team?.participants.map((p) => ({
            name: p.name,
            roleTitle: p.roleTitle,
            avatarUrl: p.avatarUrl ?? undefined,
          })),
          submission,
          createdAt: dbRow.createdAt.toISOString(),
        };
        persistParticipant(participant);
        memoryStore.participants.set(participant.ticketNumber, participant);
        return participant;
      }
    } catch (e) {
      console.warn("Could not query participant by email from DB:", e);
    }
  }

  // 2. Fallback: disk storage
  const persistedList = loadPersistedParticipants();
  const found = persistedList.find(
    (p) =>
      (!hackathonId || p.hackathonId === hackathonId || p.hackathonId === "gh-shipathon-2026") &&
      p.email.trim().toLowerCase() === target
  );
  if (found) {
    if (found.teamCode) {
      const team = getPersistedTeamByCode(found.teamCode);
      if (team) {
        found.teamName = team.name;
        found.teammates = team.members.map((m) => ({
          name: m.name,
          roleTitle: m.roleTitle,
          avatarUrl: m.avatarUrl,
        }));
      }
    }
    memoryStore.participants.set(found.ticketNumber, found);
    return found;
  }

  // 3. Check memory store
  for (const p of memoryStore.participants.values()) {
    if (
      (!hackathonId || p.hackathonId === hackathonId || p.hackathonId === "gh-shipathon-2026") &&
      p.email.trim().toLowerCase() === target
    ) {
      return p;
    }
  }

  return null;
}

export async function registerHacker(params: {
  hackathonId: string;
  name: string;
  email: string;
  roleTitle: string;
  bio?: string;
  discordHandle?: string;
  twitterHandle?: string;
  avatarUrl?: string;
  themeStyle?: HackathonTheme;
  teamOption: "solo" | "create" | "join";
  teamName?: string;
  teamInviteCode?: string;
}): Promise<HackathonParticipant> {
  const existing = await getParticipantByEmail(params.hackathonId, params.email);
  const ticketNumber = existing ? existing.ticketNumber : generateTicketNumber();

  let participant: HackathonParticipant = {
    ...(existing || {}),
    id: existing ? existing.id : `part-${Date.now()}`,
    hackathonId: params.hackathonId,
    ticketNumber,
    name: params.name.trim() || (existing ? existing.name : "Hacker"),
    email: params.email.trim().toLowerCase(),
    roleTitle: params.roleTitle.trim() || (existing ? existing.roleTitle : "Fullstack Hacker"),
    bio: params.bio?.trim() ?? existing?.bio,
    discordHandle: params.discordHandle?.trim() ?? existing?.discordHandle,
    twitterHandle: params.twitterHandle?.trim() ?? existing?.twitterHandle,
    avatarUrl: params.avatarUrl || existing?.avatarUrl,
    themeStyle: params.themeStyle || existing?.themeStyle || "lime",
    isCaptain: existing?.isCaptain ?? false,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  // 1. Initial participant save
  persistParticipant(participant);
  await persistParticipantToDb(participant);
  memoryStore.participants.set(ticketNumber, participant);

  // 2. Handle team formation
  if (params.teamOption === "create") {
    const tName = params.teamName?.trim();
    if (!tName) {
      throw new Error("Please provide a name for your new squad.");
    }
    const teamRes = await createNewTeam({
      teamName: tName,
      creatorParticipant: participant,
      hackathonId: params.hackathonId,
    });
    if (!teamRes.success || !teamRes.team) {
      throw new Error(teamRes.error || "Failed to create squad.");
    }
    memoryStore.teams.set(teamRes.team.inviteCode, teamRes.team);
  } else if (params.teamOption === "join") {
    const code = (params.teamInviteCode || "").trim().toUpperCase();
    if (!code) {
      throw new Error("Please enter a valid team invite code.");
    }
    const joinRes = await addMemberToTeam({
      teamCode: code,
      participantObj: participant,
      hackathonId: params.hackathonId,
    });
    if (!joinRes.success || !joinRes.team) {
      throw new Error(joinRes.error || `Team with invite code "${code}" was not found. Please check the code and try again.`);
    }
    memoryStore.teams.set(joinRes.team.inviteCode, joinRes.team);
  }

  // 3. Final synchronization with squad state
  persistParticipant(participant);
  await persistParticipantToDb(participant);
  memoryStore.participants.set(ticketNumber, participant);

  return participant;
}

export async function submitProject(params: {
  hackathonId: string;
  ticketNumber: string;
  trackId: string;
  title: string;
  tagline: string;
  description: string;
  repoUrl: string;
  demoUrl?: string;
  pitchDeckUrl?: string;
  videoUrl?: string;
  gammaUrl?: string;
  techStack: string[];
}): Promise<HackathonSubmission> {
  const participant = await getParticipantByTicket(params.ticketNumber);
  const subId = `sub-${Date.now()}`;

  const submission: HackathonSubmission = {
    id: subId,
    hackathonId: params.hackathonId,
    ticketNumber: params.ticketNumber,
    teamName: participant?.teamName,
    trackId: params.trackId,
    title: params.title.trim(),
    tagline: params.tagline.trim(),
    description: params.description.trim(),
    repoUrl: params.repoUrl.trim(),
    demoUrl: params.demoUrl?.trim(),
    pitchDeckUrl: params.pitchDeckUrl?.trim(),
    videoUrl: params.videoUrl?.trim(),
    gammaUrl: params.gammaUrl?.trim(),
    techStack: params.techStack.length > 0 ? params.techStack : ["Next.js", "TypeScript"],
    authorName: participant?.name || "Anonymous Builder",
    createdAt: new Date().toISOString(),
    upvotes: 1,
  };

  hackathonStore.submissions.set(subId, submission);

  // Persist submission to Postgres DB, disk, memory, and sync to squad teammates
  await persistSubmission(submission);

  return submission;
}

export async function getAllSubmissions(hackathonId?: string): Promise<HackathonSubmission[]> {
  const diskList = loadPersistedSubmissions();
  const map = new Map<string, HackathonSubmission>();

  for (const s of diskList) {
    map.set(s.id, s);
  }

  // Check DB
  if (isDbAvailable()) {
    try {
      const dbSubs = await prisma.hackathonSubmission.findMany({
        include: { participant: true, team: true },
        orderBy: { createdAt: "desc" },
      });
      for (const s of dbSubs) {
        map.set(s.id, {
          id: s.id,
          hackathonId: s.hackathonId,
          ticketNumber: s.participant?.ticketNumber,
          teamName: s.team?.name || undefined,
          trackId: s.trackId || "general",
          title: s.title,
          tagline: s.tagline,
          description: s.description,
          repoUrl: s.repoUrl,
          demoUrl: s.demoUrl || undefined,
          pitchDeckUrl: s.pitchDeckUrl || undefined,
          videoUrl: s.videoUrl || undefined,
          gammaUrl: s.gammaUrl || undefined,
          techStack: (s.techStack as string[]) || [],
          authorName: s.participant?.name || "Builder",
          createdAt: s.createdAt.toISOString(),
          upvotes: 1,
        });
      }
    } catch (e) {
      console.warn("[getAllSubmissions] DB query error:", e);
    }
  }

  const list = Array.from(map.values());
  if (hackathonId) {
    const clean = hackathonId.replace(/^gh-/, "");
    return list.filter(
      (s) =>
        !s.hackathonId ||
        s.hackathonId === hackathonId ||
        s.hackathonId === clean ||
        s.hackathonId === `gh-${clean}` ||
        s.hackathonId === "gh-shipathon-2026" ||
        s.hackathonId === "shipathon-2026" ||
        s.hackathonId.startsWith("c") ||
        s.hackathonId.startsWith("cm")
    );
  }
  return list;
}

export async function getUserHackathonHistory(email: string): Promise<{ hackathon: HackathonData; participant: HackathonParticipant }[]> {
  if (!email) return [];
  const cleanEmail = email.trim().toLowerCase();

  const userMap = new Map<string, HackathonParticipant>();

  // 1. Check disk store
  const diskList = loadPersistedParticipants();
  for (const p of diskList) {
    if (p.email && p.email.trim().toLowerCase() === cleanEmail) {
      userMap.set(p.ticketNumber.toUpperCase(), p);
    }
  }

  // 2. Check memory store
  for (const p of memoryStore.participants.values()) {
    if (p.email && p.email.trim().toLowerCase() === cleanEmail) {
      userMap.set(p.ticketNumber.toUpperCase(), p);
    }
  }

  // 3. Query DB if available
  if (isDbAvailable()) {
    try {
      const dbRows = await prisma.hackathonParticipant.findMany({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
        include: {
          team: { include: { participants: true } },
          submissions: { orderBy: { createdAt: "desc" }, take: 1 },
          certificates: { orderBy: { issuedAt: "desc" }, take: 1 },
          hackathon: true,
        },
      });
      for (const row of dbRows) {
        let submission: HackathonSubmission | undefined = undefined;
        const sub = row.submissions?.[0];
        if (sub) {
          submission = {
            id: sub.id,
            hackathonId: row.hackathon?.slug || row.hackathonId,
            ticketNumber: row.ticketNumber,
            teamName: row.team?.name || undefined,
            trackId: sub.trackId || "general",
            title: sub.title,
            tagline: sub.tagline,
            description: sub.description,
            repoUrl: sub.repoUrl,
            demoUrl: sub.demoUrl || undefined,
            pitchDeckUrl: sub.pitchDeckUrl || undefined,
            videoUrl: sub.videoUrl || undefined,
            gammaUrl: sub.gammaUrl || undefined,
            techStack: (sub.techStack as string[]) || [],
            authorName: row.name,
            createdAt: sub.createdAt.toISOString(),
          };
        }

        let certificate: HackathonCertificate | undefined = undefined;
        const cert = row.certificates?.[0];
        if (cert) {
          certificate = {
            id: cert.id,
            certNumber: cert.certNumber,
            hackathonId: row.hackathon?.slug || row.hackathonId,
            participantId: row.id,
            ticketNumber: row.ticketNumber,
            type: cert.type as CertificateType,
            title: cert.title,
            awardTitle: cert.awardTitle,
            recipientName: cert.recipientName,
            roleTitle: row.roleTitle,
            projectName: cert.projectName || submission?.title || undefined,
            teamName: cert.teamName || row.team?.name || undefined,
            trackName: cert.trackName || submission?.trackId || undefined,
            rank: cert.rank || undefined,
            issuedAt: cert.issuedAt.toISOString(),
            verificationUrl: `/verify/${cert.certNumber}`,
          };
        }

        const participant: HackathonParticipant = {
          id: row.id,
          hackathonId: row.hackathon?.slug || row.hackathonId,
          ticketNumber: row.ticketNumber,
          name: row.name,
          email: row.email,
          roleTitle: row.roleTitle || "Fullstack & AI Engineer",
          bio: row.bio ?? undefined,
          discordHandle: row.discordHandle ?? undefined,
          twitterHandle: row.twitterHandle ?? undefined,
          avatarUrl: row.avatarUrl ?? undefined,
          themeStyle: (row.themeStyle as HackathonTheme) || "lime",
          isCaptain: row.isCaptain,
          teamId: row.teamId ?? undefined,
          teamName: row.team?.name ?? undefined,
          teamCode: row.team?.inviteCode ?? undefined,
          teammates: row.team?.participants.map((p) => ({
            name: p.name,
            roleTitle: p.roleTitle,
            avatarUrl: p.avatarUrl ?? undefined,
          })),
          submission,
          certificate,
          createdAt: row.createdAt.toISOString(),
        };
        userMap.set(row.ticketNumber.toUpperCase(), participant);
      }
    } catch (e) {
      console.warn("Could not query user hackathons from DB:", e);
    }
  }

  const results: { hackathon: HackathonData; participant: HackathonParticipant }[] = [];
  const allHackathons = await getAllHackathons();

  for (const participant of userMap.values()) {
    const hackathon = allHackathons.find((h) => h.id === participant.hackathonId) || FLAGSHIP_HACKATHON;
    results.push({ hackathon, participant });
  }

  return results;
}

